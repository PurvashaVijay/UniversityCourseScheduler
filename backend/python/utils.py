"""
Helper functions for the OR-Tools scheduler
"""

import json
from typing import Dict, List, Any, Set, Tuple
import uuid

def generate_id(prefix: str = "ID") -> str:
    """Generate a unique ID with a prefix"""
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def parse_time(time_str: str) -> int:
    """
    Parse a time string in HH:MM:SS format to minutes since midnight
    
    Args:
        time_str: Time string in format HH:MM:SS
        
    Returns:
        Minutes since midnight
    """
    if not time_str:
        return 0
    
    parts = time_str.split(':')
    if len(parts) != 3:
        return 0
    
    try:
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds = int(parts[2])
        
        return hours * 60 + minutes + (seconds // 60)
    except ValueError:
        return 0

def format_time(minutes: int) -> str:
    """
    Format minutes since midnight to HH:MM:SS
    
    Args:
        minutes: Minutes since midnight
        
    Returns:
        Time string in format HH:MM:SS
    """
    hours = minutes // 60
    mins = minutes % 60
    
    return f"{hours:02d}:{mins:02d}:00"

def group_time_slots_by_number(time_slots: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Group time slots by their number (e.g., TS1, TS2)
    
    Args:
        time_slots: List of time slot dictionaries
        
    Returns:
        Dictionary mapping slot numbers to lists of slot IDs
    """
    result = {}
    
    for slot in time_slots:
        slot_id = slot.get('timeslot_id', '')
        
        # Extract time slot number from ID (e.g., TS1-MON -> TS1)
        parts = slot_id.split('-')
        if len(parts) >= 1:
            slot_num = parts[0]
            
            if slot_num not in result:
                result[slot_num] = []
            
            result[slot_num].append(slot_id)
    
    return result

def get_day_patterns(num_classes: int) -> List[List[str]]:
    """
    Get valid day patterns for a specific number of classes
    
    Args:
        num_classes: Number of class instances per week (1-3)
        
    Returns:
        List of valid day patterns, where each pattern is a list of days
    """
    patterns = {
        1: [["Monday"], ["Tuesday"], ["Wednesday"], ["Thursday"]],
        2: [["Monday", "Wednesday"], ["Tuesday", "Thursday"]],
        3: [["Monday", "Tuesday", "Thursday"]]
    }
    
    return patterns.get(num_classes, [])

def are_time_slots_consecutive(slot1: Dict[str, Any], slot2: Dict[str, Any]) -> bool:
    """
    Check if two time slots are consecutive
    
    Args:
        slot1: First time slot dictionary
        slot2: Second time slot dictionary
        
    Returns:
        True if the slots are consecutive, False otherwise
    """
    if not slot1 or not slot2 or slot1.get('day_of_week') != slot2.get('day_of_week'):
        return False
    
    # Parse times
    slot1_end = parse_time(slot1.get('end_time', ''))
    slot2_start = parse_time(slot2.get('start_time', ''))
    
    # Consecutive if end of slot1 is the same as start of slot2
    return slot1_end == slot2_start

def extract_course_associations(course_id: str, course_programs: Dict[str, Any]) -> Tuple[List[str], bool, int]:
    """
    Extract program associations, core status, and number of classes for a course
    
    Args:
        course_id: ID of the course
        course_programs: Dictionary of course-program associations
        
    Returns:
        Tuple of (program_ids, is_core, num_classes)
    """
    program_ids = []
    is_core = False
    num_classes = 1
    
    if course_id in course_programs:
        associations = course_programs[course_id]
        
        for assoc in associations:
            program_ids.append(assoc.get('program_id'))
            
            # A course is core if it's required in any program
            if assoc.get('is_required', False):
                is_core = True
            
            # Use the maximum number of classes from all associations
            assoc_num_classes = assoc.get('num_classes', 1)
            if assoc_num_classes > num_classes:
                num_classes = assoc_num_classes
    
    return program_ids, is_core, num_classes

def count_courses_by_day(scheduled_courses: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Count courses scheduled on each day
    
    Args:
        scheduled_courses: List of scheduled course dictionaries
        
    Returns:
        Dictionary mapping days to course counts
    """
    result = {}
    
    for course in scheduled_courses:
        day = course.get('day_of_week')
        if day:
            if day not in result:
                result[day] = 0
            
            result[day] += 1
    
    return result

def calculate_day_imbalance(day_counts: Dict[str, int]) -> int:
    """
    Calculate the maximum imbalance between days
    
    Args:
        day_counts: Dictionary mapping days to course counts
        
    Returns:
        Maximum difference between any two days
    """
    if not day_counts:
        return 0
    
    values = list(day_counts.values())
    return max(values) - min(values)

def detect_time_slot_conflicts(scheduled_courses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect conflicts where multiple courses are scheduled in the same time slot
    
    Args:
        scheduled_courses: List of scheduled course dictionaries
        
    Returns:
        List of conflicts
    """
    conflicts = []
    
    # Group courses by time slot
    courses_by_slot = {}
    
    for course in scheduled_courses:
        day = course.get('day_of_week')
        slot_id = course.get('timeslot_id')
        
        if day and slot_id:
            key = f"{day}_{slot_id}"
            
            if key not in courses_by_slot:
                courses_by_slot[key] = []
            
            courses_by_slot[key].append(course)
    
    # Check for conflicts
    for slot_key, courses in courses_by_slot.items():
        if len(courses) > 1:
            day, slot_id = slot_key.split('_')
            
            # Check for core course conflicts
            core_courses = [c for c in courses if c.get('is_core', False)]
            if len(core_courses) > 1:
                conflicts.append({
                    "conflict_type": "CORE_COURSE_CONFLICT",
                    "day_of_week": day,
                    "timeslot_id": slot_id,
                    "courses": core_courses,
                    "description": f"Multiple core courses scheduled at the same time"
                })
            
            # Check for professor conflicts
            professors = {}
            for course in courses:
                prof_id = course.get('professor_id')
                if prof_id:
                    if prof_id not in professors:
                        professors[prof_id] = []
                    
                    professors[prof_id].append(course)
            
            for prof_id, prof_courses in professors.items():
                if len(prof_courses) > 1:
                    conflicts.append({
                        "conflict_type": "PROFESSOR_CONFLICT",
                        "day_of_week": day,
                        "timeslot_id": slot_id,
                        "professor_id": prof_id,
                        "courses": prof_courses,
                        "description": f"Professor {prof_id} is scheduled to teach multiple courses at the same time"
                    })
    
    return conflicts