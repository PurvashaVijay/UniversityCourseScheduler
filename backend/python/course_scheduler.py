#!/usr/bin/env python3
"""
Course Scheduler using Google OR-Tools
This script takes JSON input data and generates an optimal course schedule
"""
import json
import sys
import uuid
import re
from datetime import datetime
from ortools.sat.python import cp_model


class CourseScheduler:
    def __init__(self, data):
        """Initialize the scheduler with the input data"""
        self.data = data
        self.model = cp_model.CpModel()
        self.solver = None
        self.status = None
        self.solution = None

        # Extract all the main components from the input data
        self.courses = data['courses']
        self.professors = data['professors']
        self.time_slots = data['timeSlots']
        self.professor_availability = data['professorAvailability']
        self.professor_courses = data.get('professorCourses', [])  # Add this line
        self.schedule_id = data['scheduleId']
        
        # Create lookup dictionaries for faster access
        self.course_dict = {course['course_id']: course for course in self.courses}
        self.professor_dict = {prof['professor_id']: prof for prof in self.professors}
        self.time_slot_dict = {slot['timeslot_id']: slot for slot in self.time_slots}

        # Create a map of which professors can teach which courses
        self.professor_course_map = {}
        for pc in self.professor_courses:
            course_id = pc['course_id']
            professor_id = pc['professor_id']
            if course_id not in self.professor_course_map:
                self.professor_course_map[course_id] = []
            self.professor_course_map[course_id].append(professor_id)
            
        # Create the reverse mapping (professors to courses they can teach)
        self.professor_qualified_courses = {}
        for pc in self.professor_courses:
            course_id = pc['course_id']
            professor_id = pc['professor_id']
            if professor_id not in self.professor_qualified_courses:
                self.professor_qualified_courses[professor_id] = []
            self.professor_qualified_courses[professor_id].append(course_id)
        
        # Group availability by professor
        self.availability_by_professor = {}
        for avail in self.professor_availability:
            prof_id = avail['professor_id']
            if prof_id not in self.availability_by_professor:
                self.availability_by_professor[prof_id] = []
            self.availability_by_professor[prof_id].append(avail)


        # Group time slots by day and duration for faster access
        self.time_slots_by_day = {}
        self.time_slots_by_duration = {}
        for ts in self.time_slots:
            day = ts['day_of_week']
            duration = ts['duration_minutes']
        
            if day not in self.time_slots_by_day:
                self.time_slots_by_day[day] = []
            self.time_slots_by_day[day].append(ts)
        
            if duration not in self.time_slots_by_duration:
                self.time_slots_by_duration[duration] = []
            self.time_slots_by_duration[duration].append(ts)

    def safe_access(self, dict_obj, key, default=None):
        """Safely access a dictionary key, returning a default if key doesn't exist"""
        return dict_obj.get(key, default)

    def build_model(self):
        """Build the constraint programming model"""
        # Create variables
        self.create_variables()
        
        # Add constraints
        self.add_professor_assignment_constraints()
        self.add_time_slot_constraints()
        self.add_professor_availability_constraints()
        self.add_timeslot_duration_constraints()
        self.add_core_course_priority_constraints()
        self.add_cross_program_course_constraints()
        self.add_professor_qualification_constraints()  # Add this line

        # Add new constraints
        self.add_day_distribution_constraints()  # For multi-class courses
        self.add_professor_consecutive_slot_constraints()  # Prevent consecutive slots
        
        # Set objective function
        self.set_objective()
    
    def create_variables(self):
        """Create the decision variables for the model"""
        self.course_professor = {}  # course_id -> professor_id assignment
        self.course_time_slot = {}  # course_id -> time_slot_id assignment
        self.course_day = {}        # course_id -> day_of_week assignment
    
        # New variable for tracking number of classes per course
        self.course_num_classes = {}  # course_id -> number of classes
    
        # New variables for tracking course distribution by day and time slot
        self.course_count_by_time_slot = {}  # timeslot_id -> count
        self.course_count_by_day = {}       # day -> count
    
        # Track core courses by time slot for distribution
        self.core_course_count_by_time_slot = {}  # timeslot_id -> count
    
        # Get unique days and time slots for counting
        all_days = set(ts['day_of_week'] for ts in self.time_slots)
        all_time_slot_ids = set(ts['timeslot_id'] for ts in self.time_slots)
    
        # Create count variables for days
        for day in all_days:
            self.course_count_by_day[day] = self.model.NewIntVar(
                0, len(self.courses), f'course_count_day_{day}')
    
        # Create count variables for time slots
        for ts_id in all_time_slot_ids:
            self.course_count_by_time_slot[ts_id] = self.model.NewIntVar(
                0, len(self.courses), f'course_count_slot_{ts_id}')
            self.core_course_count_by_time_slot[ts_id] = self.model.NewIntVar(
                0, len(self.courses), f'core_course_count_slot_{ts_id}')
    
        # Create course to professor assignment variables
        for course in self.courses:
            course_id = course['course_id']
            self.course_time_slot[course_id] = {}
            self.course_day[course_id] = {}
            self.course_professor[course_id] = {}
        
            # Determine number of classes for this course
            num_classes = course.get('num_classes', 1)  # Default to 1 if not specified
            self.course_num_classes[course_id] = num_classes
        
            # Get qualified professors for this course
            qualified_professors = []
            if course_id in self.professor_course_map:
                qualified_professors = self.professor_course_map[course_id]

            # Create variables only for qualified professors
            if qualified_professors:
                for prof in self.professors:
                    prof_id = prof['professor_id']
                    if prof_id in qualified_professors:
                        # A boolean variable that is 1 if course is assigned to professor
                        self.course_professor[course_id][prof_id] = self.model.NewBoolVar(
                            f'course_{course_id}_prof_{prof_id}')
    
        # Create course to time slot assignment variables
        for course in self.courses:
            course_id = course['course_id']
            course_duration = course['duration_minutes']
            self.course_time_slot[course_id] = {}
            self.course_day[course_id] = {}
        
            # For each time slot, only create variables if the duration matches
            for ts in self.time_slots:
                time_id = ts['timeslot_id']
                day = ts['day_of_week']
                slot_duration = ts['duration_minutes']
            
                # Only create variables for matching durations
                if abs(slot_duration - course_duration) <= 10:
                    # Handle day restrictions for core courses
                    if course['is_core'] and day == 'Friday':
                        continue  # Skip Friday for core courses
                
                    # Handle Friday time restrictions (no courses after 5 PM)
                    if day == 'Friday' and self._is_after_5pm(ts):
                        continue  # Skip time slots after 5 PM on Friday
                
                    # Handle Friday duration restrictions (no 180-minute courses)
                    if day == 'Friday' and slot_duration >= 180:
                        continue  # Skip 180-minute slots on Friday
                
                    # A boolean variable that is 1 if course is assigned to this time slot
                    self.course_time_slot[course_id][time_id] = self.model.NewBoolVar(
                        f'course_{course_id}_time_{time_id}')
                
                    # Day is derived from time slot, but we also track it separately
                    day_var_name = f'course_{course_id}_day_{day}'
                    if day_var_name not in self.course_day[course_id]:
                        self.course_day[course_id][day] = self.model.NewBoolVar(day_var_name)
    
        # Course scheduled indicator
        self.course_scheduled = {}
        for course in self.courses:
            course_id = course['course_id']
            self.course_scheduled[course_id] = self.model.NewBoolVar(f'course_{course_id}_scheduled')

        # For multi-class courses, create a special variable for pattern enforcement
        for course in self.courses:
            course_id = course['course_id']
            num_classes = self.course_num_classes.get(course_id, 1)
            if num_classes > 1:
                # Create a variable that is 1 if this course has a valid pattern
                self.course_has_valid_pattern = self.model.NewBoolVar(f'course_{course_id}_has_valid_pattern')
                # Link this variable to the course_scheduled variable
                self.model.AddImplication(self.course_scheduled[course_id], self.course_has_valid_pattern)

    def _is_after_5pm(self, time_slot):
        """Check if a time slot starts after 5 PM"""
        try:
            start_time = time_slot['start_time']
            if isinstance(start_time, str):
                # Parse time string like "17:30:00"
                hour = int(start_time.split(':')[0])
                return hour >= 17  # 5 PM or later
            return False
        except (ValueError, IndexError, KeyError):
            return False  # Default to False if we can't determine   

    def add_professor_assignment_constraints(self):
        """Add constraints for professor assignments"""
        # Each course must be assigned to exactly one professor
        for course in self.courses:
            course_id = course['course_id']
            if course_id in self.course_professor and self.course_professor[course_id]:
                self.model.Add(sum(self.course_professor[course_id].values()) == 1)
        
        # A professor cannot teach two courses at the same time
        for prof in self.professors:
            prof_id = prof['professor_id']
        
            for ts in self.time_slots:
                time_id = ts['timeslot_id']
                day = ts['day_of_week']
            
                # Collect all course assignments for this professor at this time/day
                courses_at_time = []
                for course in self.courses:
                    course_id = course['course_id']
                
                    # Only process if this professor can teach this course
                    if (course_id in self.course_professor and 
                        prof_id in self.course_professor[course_id] and
                        time_id in self.course_time_slot[course_id]):
                    
                        # If course is assigned to this professor AND this time slot
                        courses_at_time.append(
                            self.model.NewBoolVar(f'prof_{prof_id}_time_{time_id}_course_{course_id}'))
                    
                        # Link the new variable to the existing assignment variables
                        self.model.AddBoolAnd([
                            self.course_professor[course_id][prof_id], 
                            self.course_time_slot[course_id][time_id]
                        ]).OnlyEnforceIf(courses_at_time[-1])
                    
                        self.model.AddBoolOr([
                            self.course_professor[course_id][prof_id].Not(), 
                            self.course_time_slot[course_id][time_id].Not()
                        ]).OnlyEnforceIf(courses_at_time[-1].Not())
            
                # A professor can only teach one course at a time
                if len(courses_at_time) > 1:
                    self.model.AddAtMostOne(courses_at_time)
    
    def add_time_slot_constraints(self):
        """Add constraints for time slot assignments"""

        # Add explicit constraints to forbid core courses on Friday
        for course in self.courses:
            course_id = course['course_id']
            if course['is_core']:
                for ts in self.time_slots:
                    if ts['day_of_week'] == 'Friday':
                        time_id = ts['timeslot_id']
                        # Check if this variable exists before trying to constrain it
                        if (course_id in self.course_time_slot and 
                            time_id in self.course_time_slot[course_id]):
                            self.model.Add(self.course_time_slot[course_id][time_id] == 0)

        # Also directly constrain the course_day variable for Friday
        for course in self.courses:
            course_id = course['course_id']
            if course['is_core'] and 'Friday' in self.course_day.get(course_id, {}):
                # Core courses cannot be scheduled on Friday
                self.model.Add(self.course_day[course_id]['Friday'] == 0)

        # Each course must be assigned to exactly one time slot if it's scheduled
        for course in self.courses:
            course_id = course['course_id']
        
            # Link course_scheduled to the sum of time slot assignments
            time_slot_vars = []
            for time_id in self.course_time_slot.get(course_id, {}):
                time_slot_vars.append(self.course_time_slot[course_id][time_id])
        
            # If there are no time slot variables for this course, it can't be scheduled
            if not time_slot_vars:
                self.model.Add(self.course_scheduled[course_id] == 0)
                continue
            
            time_slot_sum = sum(time_slot_vars)
            self.model.Add(time_slot_sum == 1).OnlyEnforceIf(self.course_scheduled[course_id])
            self.model.Add(time_slot_sum == 0).OnlyEnforceIf(self.course_scheduled[course_id].Not())
        
            # Link day variables to time slot assignments
            for ts in self.time_slots:
                time_id = ts['timeslot_id']
                day = ts['day_of_week']
            
                # Only create constraint if this time slot exists for this course
                if course_id in self.course_time_slot and time_id in self.course_time_slot[course_id]:
                    # If this time slot is assigned, the corresponding day must be assigned
                    if day in self.course_day.get(course_id, {}):
                        self.model.AddImplication(
                            self.course_time_slot[course_id][time_id], 
                            self.course_day[course_id][day]
                        )
    
        # Ensure a course is only assigned one day (derived from time slot)
        for course in self.courses:
            course_id = course['course_id']
        
            day_vars = list(self.course_day.get(course_id, {}).values())
        
            # At most one day can be assigned to a course
            if day_vars:
                self.model.Add(sum(day_vars) <= 1)
            
                # If a course is scheduled, exactly one day must be assigned
                self.model.Add(sum(day_vars) == 1).OnlyEnforceIf(
                    self.course_scheduled[course_id])

    def add_professor_availability_constraints(self):
        """Add constraints for professor availability"""
        for course in self.courses:
            course_id = course['course_id']
        
            for prof in self.professors:
                prof_id = prof['professor_id']
            
                # Skip if professor isn't assigned to this course
                if (course_id not in self.course_professor or 
                    prof_id not in self.course_professor[course_id]):
                    continue
                
                # Get this professor's availability
                if prof_id in self.availability_by_professor:
                    available_slots = set()
                    for avail in self.availability_by_professor[prof_id]:
                        if avail['is_available']:
                            available_slots.add((avail['timeslot_id'], avail['day_of_week']))
                
                    # A course can only be assigned to this professor at an available time
                    for ts in self.time_slots:
                        time_id = ts['timeslot_id']
                        day = ts['day_of_week']
                    
                        # Skip if the time slot isn't available for this course
                        if (course_id not in self.course_time_slot or 
                            time_id not in self.course_time_slot[course_id]):
                            continue
                        
                        # If the professor is not available at this time, the course cannot be
                        # assigned to both this professor and this time
                        if (time_id, day) not in available_slots:
                            self.model.AddBoolOr([
                                self.course_professor[course_id][prof_id].Not(),
                                self.course_time_slot[course_id][time_id].Not()
                            ])
    
    def add_timeslot_duration_constraints(self):
        """Add constraints to match course duration with time slot duration"""
        for course in self.courses:
            course_id = course['course_id']
            course_duration = course['duration_minutes']
            
            for ts in self.time_slots:
                time_id = ts['timeslot_id']
                slot_duration = ts['duration_minutes']

                # Only add constraint if this time slot variable exists for this course
                if (course_id in self.course_time_slot and 
                    time_id in self.course_time_slot[course_id]):
                
                    # If the time slot duration doesn't match the course duration (within 10 min),
                    # the course cannot be assigned to this time slot
                    if abs(slot_duration - course_duration) > 10:
                        self.model.Add(self.course_time_slot[course_id][time_id] == 0)

    def add_day_distribution_constraints(self):
        """
        Add constraints for multi-class courses to follow specific day patterns
        and maintain time slot consistency
        """
        # Define valid day patterns
        valid_patterns = {
            2: [
                ['Monday', 'Wednesday'],
                ['Tuesday', 'Thursday'],
                ['Wednesday', 'Friday']
            ],
            3: [
                ['Monday', 'Wednesday', 'Friday']
            ]
        }
        
        # For each course with multiple classes
        for course in self.courses:
            course_id = course['course_id']
            num_classes = self.course_num_classes.get(course_id, 1)
            
            # Skip single-class courses
            if num_classes <= 1:
                continue

            # Skip if the course doesn't have valid patterns for its num_classes
            if num_classes not in valid_patterns:
                continue
                
            # Get all possible patterns for this num_classes
            patterns = valid_patterns[num_classes]
            
            # Create a variable for each pattern to indicate if it's selected
            pattern_vars = []
            for i, pattern in enumerate(patterns):
                pattern_var = self.model.NewBoolVar(f'course_{course_id}_pattern_{i}')
                pattern_vars.append(pattern_var)
                
                # If this pattern is selected, ALL its days must be assigned
                for day in pattern:
                    if day in self.course_day[course_id]:
                        # This day must be used if this pattern is selected
                        self.model.AddImplication(
                            pattern_var, 
                            self.course_day[course_id][day]
                        )
                
                # If ANY required day is missing, this pattern cannot be selected
                missing_days = []
                for day in pattern:
                    if day in self.course_day[course_id]:
                        missing_days.append(self.course_day[course_id][day].Not())
                
                if missing_days:
                    self.model.AddBoolOr(missing_days).OnlyEnforceIf(pattern_var.Not())
            
            # Exactly one pattern must be selected if the course is scheduled
            if pattern_vars:
                self.model.AddBoolOr(pattern_vars).OnlyEnforceIf(self.course_scheduled[course_id])
                self.model.Add(sum(pattern_vars) == 0).OnlyEnforceIf(self.course_scheduled[course_id].Not())
            
            # A multi-class course must have exactly num_classes days assigned if scheduled
            day_vars = list(self.course_day[course_id].values())
            if day_vars:
                self.model.Add(sum(day_vars) == num_classes).OnlyEnforceIf(self.course_scheduled[course_id])
                self.model.Add(sum(day_vars) == 0).OnlyEnforceIf(self.course_scheduled[course_id].Not())
            
            # Even stronger: if any day is assigned, the course must be scheduled with num_classes days
            if day_vars:
                for day_var in day_vars:
                    self.model.AddImplication(day_var, self.course_scheduled[course_id])
                    # If this day is assigned, exactly num_classes days must be assigned
                    self.model.Add(sum(day_vars) == num_classes).OnlyEnforceIf(day_var)

            # Ensure time slot consistency across days (same slot number on different days)
            slot_patterns = {}
            for ts in self.time_slots:
                match = re.match(r'TS(\d+)', ts['timeslot_id'])
                if match:
                    slot_number = match.group(1)
                    if slot_number not in slot_patterns:
                        slot_patterns[slot_number] = []
                    slot_patterns[slot_number].append(ts['timeslot_id'])
            
            # Create variables for each slot pattern
            for slot_number, slot_ids in slot_patterns.items():
                # Create a variable that is true if this slot pattern is used
                slot_pattern_var = self.model.NewBoolVar(f'course_{course_id}_slot_pattern_{slot_number}')
                
                # Create list of all course-slot variables for this slot pattern
                slot_vars = []
                for slot_id in slot_ids:
                    if slot_id in self.course_time_slot.get(course_id, {}):
                        slot_vars.append(self.course_time_slot[course_id][slot_id])
                
                if not slot_vars:
                    continue
                    
                # This slot pattern is used if ANY of these slot variables is true
                self.model.AddBoolOr(slot_vars).OnlyEnforceIf(slot_pattern_var)
                self.model.AddBoolAnd([var.Not() for var in slot_vars]).OnlyEnforceIf(slot_pattern_var.Not())
                
                # For each selected pattern and each day in that pattern
                for i, pattern_days in enumerate(patterns):
                    pattern_var = pattern_vars[i]
                    
                    # For each day in this pattern
                    for day in pattern_days:
                        # Find the time slot ID for this day and slot number
                        day_slot_id = None
                        for ts_id in slot_ids:
                            ts = self.time_slot_dict[ts_id]
                            if ts['day_of_week'] == day:
                                day_slot_id = ts_id
                                break
                        
                        # If we found a matching slot for this day and slot number
                        if (day_slot_id and 
                            course_id in self.course_time_slot and 
                            day_slot_id in self.course_time_slot[course_id]):
                            
                            # Create a variable for the conjunction of pattern and slot pattern
                            pattern_and_slot = self.model.NewBoolVar(
                                f'course_{course_id}_pattern_{i}_slot_{slot_number}_day_{day}'
                            )
                            
                            # This variable is true iff both pattern and slot pattern are true
                            self.model.AddBoolAnd([pattern_var, slot_pattern_var]).OnlyEnforceIf(pattern_and_slot)
                            self.model.AddBoolOr([
                                pattern_var.Not(), 
                                slot_pattern_var.Not()
                            ]).OnlyEnforceIf(pattern_and_slot.Not())
                            
                            # If both pattern and slot pattern are true, this day must use this slot
                            self.model.AddImplication(
                                pattern_and_slot, 
                                self.course_time_slot[course_id][day_slot_id]
                            )

    def add_professor_consecutive_slot_constraints(self):
        """
        Add constraints to prevent professors from teaching in consecutive time slots
        """
        # Group time slots by day and sort by start time
        time_slots_by_day = {}
        for ts in self.time_slots:
            day = ts['day_of_week']
            if day not in time_slots_by_day:
                time_slots_by_day[day] = []
            time_slots_by_day[day].append(ts)
    
        # Sort time slots within each day by start time
        for day, slots in time_slots_by_day.items():
            time_slots_by_day[day] = sorted(slots, key=lambda x: x['start_time'])
    
        # Find consecutive time slots
        consecutive_pairs = []
        for day, slots in time_slots_by_day.items():
            for i in range(len(slots) - 1):
                # These two slots are consecutive
                consecutive_pairs.append((slots[i]['timeslot_id'], slots[i+1]['timeslot_id'], day))
    
        # For each professor, add constraints for consecutive slots
        for prof in self.professors:
            prof_id = prof['professor_id']
        
            # For each pair of consecutive time slots
            for ts1_id, ts2_id, day in consecutive_pairs:
                # Collect all courses that might be assigned to this professor in these time slots
                courses_in_ts1 = []
                courses_in_ts2 = []
            
                for course in self.courses:
                    course_id = course['course_id']
                
                    # Check if this course can be assigned to this professor and these time slots
                    if prof_id in self.course_professor[course_id]:
                        if ts1_id in self.course_time_slot[course_id]:
                            # Create a new variable for professor teaching this course in this time slot
                            var_name = f'prof_{prof_id}_course_{course_id}_ts_{ts1_id}'
                            var = self.model.NewBoolVar(var_name)
                        
                            # This variable is true iff professor and time slot are both assigned to this course
                            self.model.AddBoolAnd([
                                self.course_professor[course_id][prof_id],
                                self.course_time_slot[course_id][ts1_id]
                            ]).OnlyEnforceIf(var)
                        
                            self.model.AddBoolOr([
                                self.course_professor[course_id][prof_id].Not(),
                                self.course_time_slot[course_id][ts1_id].Not()
                            ]).OnlyEnforceIf(var.Not())
                        
                            courses_in_ts1.append(var)
                    
                        if ts2_id in self.course_time_slot[course_id]:
                            # Create a new variable for professor teaching this course in this time slot
                            var_name = f'prof_{prof_id}_course_{course_id}_ts_{ts2_id}'
                            var = self.model.NewBoolVar(var_name)
                        
                            # This variable is true iff professor and time slot are both assigned to this course
                            self.model.AddBoolAnd([
                                self.course_professor[course_id][prof_id],
                                self.course_time_slot[course_id][ts2_id]
                            ]).OnlyEnforceIf(var)
                        
                            self.model.AddBoolOr([
                                self.course_professor[course_id][prof_id].Not(),
                                self.course_time_slot[course_id][ts2_id].Not()
                            ]).OnlyEnforceIf(var.Not())
                        
                            courses_in_ts2.append(var)
            
                # If this professor teaches any course in ts1, they can't teach in ts2
                if courses_in_ts1 and courses_in_ts2:
                    for var1 in courses_in_ts1:
                        for var2 in courses_in_ts2:
                            # If var1 is true, var2 must be false
                            self.model.AddImplication(var1, var2.Not())

    def add_core_course_priority_constraints(self):
        """Add constraints to prioritize core courses"""
        # Create variables to track conflicts between core courses
        self.core_conflicts = []  # Make this an instance variable so set_objective can access it
        core_courses = [c for c in self.courses if c['is_core']]

        # Add a hard constraint: core courses cannot be scheduled on Friday
        for course in core_courses:
            course_id = course['course_id']
            if 'Friday' in self.course_day.get(course_id, {}):
                self.model.Add(self.course_day[course_id]['Friday'] == 0)
        
        # Track conflicts between core courses (but don't prevent them)
        for i, course1 in enumerate(core_courses):
            for course2 in core_courses[i+1:]:
                course1_id = course1['course_id']
                course2_id = course2['course_id']
                
                # For each time slot
                for ts in self.time_slots:
                    time_id = ts['timeslot_id']
                    
                    # Skip if either course doesn't have this time slot variable
                    if (course1_id not in self.course_time_slot or 
                        time_id not in self.course_time_slot[course1_id] or
                        course2_id not in self.course_time_slot or
                        time_id not in self.course_time_slot[course2_id]):
                        continue

                    # If both courses are assigned to this time slot, it's a conflict
                    conflict = self.model.NewBoolVar(
                        f'conflict_core_{course1_id}_{course2_id}_{time_id}')
                    
                    self.model.AddBoolAnd([
                        self.course_time_slot[course1_id][time_id],
                        self.course_time_slot[course2_id][time_id]
                    ]).OnlyEnforceIf(conflict)
                    
                    self.model.AddBoolOr([
                        self.course_time_slot[course1_id][time_id].Not(),
                        self.course_time_slot[course2_id][time_id].Not()
                    ]).OnlyEnforceIf(conflict.Not())
                    
                    self.core_conflicts.append(conflict)
        
        # Instead of adding a hard constraint (self.model.Add(sum(self.core_conflicts) == 0)),
        # we'll use these conflicts in the objective function with a high penalty weight
    
    def add_cross_program_course_constraints(self):
        """Add constraints for cross-program courses"""
        # Group courses by their cross-program relationships
        # This would require additional data that isn't fully represented in the schema
        # For now, we'll implement a placeholder that can be expanded later
        
        # Cross-program courses with a single section must be at the same time across programs
        # For courses with multiple sections, we would need section identifiers
        pass
    
    def add_professor_qualification_constraints(self):
        """Add constraints to ensure only qualified professors teach courses"""
        for course in self.courses:
            course_id = course['course_id']
            # Get the list of professors qualified to teach this course
            qualified_professors = self.professor_course_map.get(course_id, [])
            # If there are no qualified professors, allow any professor (fallback)
            if not qualified_professors:
                self.model.Add(self.course_scheduled[course_id] == 0)
                continue
             # For each professor, add a constraint
            for prof in self.professors:
                prof_id = prof['professor_id']
                # If this professor is not qualified, they cannot teach this course
                if prof_id not in qualified_professors:
                    # Check if the variable exists before trying to constrain it
                    if (course_id in self.course_professor and 
                        prof_id in self.course_professor[course_id]):
                        self.model.Add(self.course_professor[course_id][prof_id] == 0)

    def set_objective(self):
        """Set the objective function for the model"""
        # Our primary objective is to maximize the number of scheduled courses
        # with priority given to core courses
    
        # Calculate weights: core courses get higher weight
        course_weights = {}
        for course in self.courses:
            course_id = course['course_id']
            # Core courses are weighted 2x as important
            course_weights[course_id] = 2 if course['is_core'] else 1
    
        # Create objective components
    
        # Component 1: Maximize weighted sum of scheduled courses (positive weight)
        scheduled_courses_objective = []
        for course_id, weight in course_weights.items():
            # Apply the schedule weight directly to each course variable
            scheduled_courses_objective.append(
                self.course_scheduled[course_id] * weight * 1000  # High positive weight
            )
    
        # Component 2: Minimize maximum course load per time slot (negative weight)
        # Create a max_load variable
        max_time_slot_load = self.model.NewIntVar(0, len(self.courses), 'max_time_slot_load')
    
        # For each time slot, add constraint that max_load is >= this slot's load
        for ts_id, load_var in self.course_count_by_time_slot.items():
            self.model.Add(max_time_slot_load >= load_var)
    
        # Component 3: Minimize maximum core course load per time slot (negative weight)
        max_core_load = self.model.NewIntVar(0, len(self.courses), 'max_core_load')
    
        # For each time slot, add constraint that max_core_load is >= this slot's core course load
        for ts_id, load_var in self.core_course_count_by_time_slot.items():
            self.model.Add(max_core_load >= load_var)

        # Add strong negative weight for core courses on Friday
        core_friday_penalty = []
        for course in self.courses:
            if course['is_core']:
                course_id = course['course_id']
                if 'Friday' in self.course_day.get(course_id, {}):
                    core_friday_penalty.append(self.course_day[course_id]['Friday'] * -10000)  # Very high negative weight

        # Add very strong weight for multi-class course completion 
        multi_class_weight = []
        for course in self.courses:
            course_id = course['course_id']
            num_classes = self.course_num_classes.get(course_id, 1)
            
            # Skip single-class courses
            if num_classes <= 1:
                continue
                
            # Add strong positive weight for scheduling multi-class courses
            # This prioritizes them over single-class courses
            multi_class_weight.append(self.course_scheduled[course_id] * num_classes * 1000)

        # Component 4: Heavily penalize core course conflicts
        core_conflict_penalty = 0
        if hasattr(self, 'core_conflicts') and self.core_conflicts:
            core_conflict_penalty = sum(self.core_conflicts) * -5000  # Very high negative weight
    
        # Final objective: Combine all components with appropriate weights
        # Instead of subtraction, we use a single sum with positive and negative weights
        objective_expr = sum(scheduled_courses_objective)  # Maximize scheduled courses (positive)
        objective_expr += max_time_slot_load * -10         # Minimize max load (negative weight)
        objective_expr += max_core_load * -10              # Minimize max core load (negative weight)

        objective_expr += sum(core_friday_penalty) if core_friday_penalty else 0  # NEW: Penalize core courses on Friday
        objective_expr += sum(multi_class_weight) if multi_class_weight else 0  # NEW: Prioritize multi-class courses
        objective_expr += core_conflict_penalty  # NEW: Heavily penalize core conflicts
    
        # Set the objective to maximize the combined expression
        self.model.Maximize(objective_expr)

    def solve(self):
        """Solve the constraint programming model"""
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = 120  # Set a time limit

        # Add logging about the model size (using correct method names)
        print("Starting model solve process...")
        
        self.status = self.solver.Solve(self.model)
        
        if self.status == cp_model.OPTIMAL or self.status == cp_model.FEASIBLE:
            print(f"Solution found with objective value: {self.solver.ObjectiveValue()}")
            return self.extract_solution()
        else:
            print(f"No solution found. Status: {self.get_status_string()}")
            return {"error": "No feasible solution found"}
    
    def extract_solution(self):
        """Extract the solution from the solved model"""
        try:
            scheduled_courses = []
            conflicts = []

            # Create a dictionary to track partial multi-class scheduling
            multi_class_days = {}
            
            # First pass: Count how many days each multi-class course is scheduled
            for course in self.courses:
                course_id = course['course_id']
                num_classes = self.course_num_classes.get(course_id, 1)
                
                # Only track multi-class courses
                if num_classes <= 1:
                    continue
                    
                # Skip if course is not scheduled
                if not self.solver.Value(self.course_scheduled[course_id]):
                    continue
                    
                # Count how many days are scheduled
                scheduled_days = []
                for day, var in self.course_day[course_id].items():
                    if self.solver.Value(var):
                        scheduled_days.append(day)
                        
                multi_class_days[course_id] = scheduled_days
            
            # Process each course
            for course in self.courses:
                course_id = course['course_id']
                num_classes = self.course_num_classes.get(course_id, 1)
        
                # Check if the course was scheduled
                if self.solver.Value(self.course_scheduled[course_id]):
                    # Find which professor was assigned
                    assigned_prof_id = None
                    for prof_id, var in self.course_professor[course_id].items():
                        if self.solver.Value(var):
                            assigned_prof_id = prof_id
                            break

                    # For courses with num_classes > 1, we need to look at all day patterns
                    scheduled_days = []
                    scheduled_time_slots = {}
            
                    # Find which days the course is scheduled
                    for day, var in self.course_day[course_id].items():
                        if self.solver.Value(var):
                            scheduled_days.append(day)
            
                            # Find which time slots are assigned
                            for day in scheduled_days:
                                for time_id, slot_var in self.course_time_slot[course_id].items():
                                    ts = self.time_slot_dict[time_id]
                                    if ts['day_of_week'] == day and self.solver.Value(slot_var):
                                        scheduled_time_slots[day] = time_id
                                        break

                    # For multi-class courses, validate that we have the right number of days
                    if len(scheduled_days) != num_classes:
                        # This is a serious violation of constraints - create a special conflict
                        conflict_id = f"CONF-{str(uuid.uuid4())[:8]}"
                        conflict = {
                            "conflict_id": conflict_id,
                            "schedule_id": self.schedule_id,
                            "timeslot_id": list(scheduled_time_slots.values())[0] if scheduled_time_slots else self.time_slots[0]['timeslot_id'],
                            "day_of_week": scheduled_days[0] if scheduled_days else self.time_slots[0]['day_of_week'],
                            "conflict_type": "MULTI_CLASS_INCONSISTENCY",
                            "description": f"Course {course['course_name']} (ID: {course_id}) needs {num_classes} days but was assigned to {len(scheduled_days)} days. This indicates a constraint failure.",
                            "is_resolved": False
                        }
                        conflicts.append({"conflict": conflict, "scheduled_course": None, "conflict_course": None})
                        continue
                    
                    # For courses with multiple scheduled instances, verify they use the same time slot pattern
                    # This is a safeguard in case our constraints didn't fully enforce time slot consistency
                    if num_classes > 1 and len(scheduled_days) == num_classes:
                        # Extract the time slot pattern number (e.g., TS1, TS2) for each day
                        slot_patterns = {}
                        for day, time_id in scheduled_time_slots.items():
                            match = re.match(r'TS(\d+)', time_id)
                            if match:
                                slot_number = match.group(1)
                                if slot_number not in slot_patterns:
                                    slot_patterns[slot_number] = []
                                slot_patterns[slot_number].append(day)
                        
                        # If we have more than one pattern, this is a constraint violation
                        if len(slot_patterns) > 1:
                            conflict_id = f"CONF-{str(uuid.uuid4())[:8]}"
                            conflict = {
                                "conflict_id": conflict_id,
                                "schedule_id": self.schedule_id,
                                "timeslot_id": list(scheduled_time_slots.values())[0],
                                "day_of_week": scheduled_days[0],
                                "conflict_type": "SLOT_PATTERN_INCONSISTENCY",
                                "description": f"Course {course['course_name']} (ID: {course_id}) is using different time slot patterns across days: {slot_patterns}. All instances should use the same time slot number.",
                                "is_resolved": False
                            }
                            conflicts.append({"conflict": conflict, "scheduled_course": None, "conflict_course": None})
                            continue

                    # Create a scheduled course entry for each day the course is scheduled
                    for i, day in enumerate(scheduled_days):
                        time_id = scheduled_time_slots.get(day)
                        if not time_id:
                            continue  # Skip if no time slot found for this day
                
                        scheduled_course = {
                            "scheduled_course_id": f"SC-{str(uuid.uuid4())[:8]}",
                            "schedule_id": self.schedule_id,
                            "course_id": course_id,
                            "professor_id": assigned_prof_id,
                            "timeslot_id": time_id,
                            "day_of_week": day,
                            "is_override": False,
                            "class_instance": i + 1,  # Track which instance this is (1-based)
                            "num_classes": num_classes,  # Store total number of classes
                            "course_data": course,
                            "professor_data": self.professor_dict[assigned_prof_id],
                            "time_slot_data": self.time_slot_dict[time_id]
                        }
                
                        scheduled_courses.append(scheduled_course)
            
                else:
                    # The course could not be scheduled, create a conflict
                    conflict_id = f"CONF-{str(uuid.uuid4())[:8]}"
            
                    # For an unscheduled course, we'll use the first time slot
                    # This matches the original logic in the JS implementation
                    default_time_slot = self.time_slots[0]
                    default_time_id = default_time_slot['timeslot_id']
                    default_day = default_time_slot['day_of_week']

                    # Check if there are qualified professors for this course
                    qualified_professors = self.professor_course_map.get(course_id, [])

                    # Choose a qualified professor if available, otherwise random
                    if qualified_professors:
                        professor_id = qualified_professors[0]
                        random_prof = self.professor_dict[professor_id]

                        # Create conflict description with reason
                        conflict_description = f"No suitable time slot found for course {course['course_name']}"
                        if not self.availability_by_professor.get(professor_id, []):
                            conflict_description += " (Qualified professor has no availability)"
                        else:
                            conflict_description += f" that matches duration and professor availability for {num_classes} classes"

                    else:
                        import random
                        random_prof = random.choice(self.professors)
                        professor_id = random_prof['professor_id']
                
                        conflict_description = f"No suitable time slot found for course {course['course_name']}"
                        if not qualified_professors:
                            conflict_description += " (No qualified professors available)"
                        else:
                            conflict_description += f" that matches duration and professor availability for {num_classes} classes"
            
                    # Create conflict record
                    conflict = {
                        "conflict_id": conflict_id,
                        "schedule_id": self.schedule_id,
                        "timeslot_id": default_time_id,
                        "day_of_week": default_day,
                        "conflict_type": "NO_AVAILABLE_SLOT",
                        "description": conflict_description,
                        "is_resolved": False
                    }
            
                    # Create a scheduled course for the conflict
                    scheduled_course_id = f"SC-{str(uuid.uuid4())[:8]}"
                    scheduled_course = {
                        "scheduled_course_id": scheduled_course_id,
                        "schedule_id": self.schedule_id,
                        "course_id": course_id,
                        "professor_id": professor_id,
                        "timeslot_id": default_time_id,
                        "day_of_week": default_day,
                        "is_override": False,
                        "class_instance": 1,
                        "num_classes": num_classes,
                        "course_data": course,
                        "professor_data": random_prof,
                        "time_slot_data": default_time_slot
                    }
            
                    # Create conflict course association
                    conflict_course = {
                        "conflict_course_id": f"CC-{str(uuid.uuid4())[:8]}",
                        "conflict_id": conflict_id,
                        "scheduled_course_id": scheduled_course_id
                    }
            
                    conflicts.append({
                        "conflict": conflict,
                        "scheduled_course": scheduled_course,
                        "conflict_course": conflict_course
                    })
    
            # Check for time slot conflicts
            time_slot_conflicts = self.check_time_slot_conflicts(scheduled_courses)
            conflicts.extend(time_slot_conflicts)
    
            # Check for professor consecutive slot conflicts
            consecutive_conflicts = self.check_consecutive_slot_conflicts(scheduled_courses)
            conflicts.extend(consecutive_conflicts)
    
            # Summarize day distribution for statistics
            day_counts = {}
            for day in set(sc['day_of_week'] for sc in scheduled_courses):
                day_count = sum(1 for sc in scheduled_courses if sc['day_of_week'] == day)
                day_counts[day] = day_count

            # Check if any core courses are scheduled on Friday
            core_friday_conflicts = []
            for sc in scheduled_courses:
                course_id = sc['course_id']
                if self.course_dict[course_id]['is_core'] and sc['day_of_week'] == 'Friday':
                    conflict_id = f"CONF-{str(uuid.uuid4())[:8]}"
                    conflict = {
                        "conflict_id": conflict_id,
                        "schedule_id": self.schedule_id,
                        "timeslot_id": sc['timeslot_id'],
                        "day_of_week": "Friday",
                        "conflict_type": "CORE_COURSE_ON_FRIDAY",
                        "description": f"Core course {self.course_dict[course_id]['course_name']} is scheduled on Friday, which violates constraints",
                        "is_resolved": False
                    }
                    conflict_course = {
                        "conflict_course_id": f"CC-{str(uuid.uuid4())[:8]}",
                        "conflict_id": conflict_id,
                        "scheduled_course_id": sc['scheduled_course_id']
                    }
                    core_friday_conflicts.append({
                        "conflict": conflict,
                        "scheduled_course": sc,
                        "conflict_course": conflict_course
                    })
            conflicts.extend(core_friday_conflicts)
    
            return {
                "scheduled_courses": scheduled_courses,
                "conflicts": conflicts,
                "statistics": {
                    "total_courses": len(self.courses),
                    "scheduled_courses": len(set(sc['course_id'] for sc in scheduled_courses)),
                    "total_scheduled_instances": len(scheduled_courses),
                    "unresolved_conflicts": len(conflicts),
                    "core_courses": sum(1 for c in self.courses if c['is_core']),
                    "core_courses_scheduled": sum(1 for sc in scheduled_courses 
                                                if self.course_dict[sc['course_id']]['is_core']),
                    "day_distribution": day_counts,
                    "solver_status": self.get_status_string(),
                    "solver_time": self.solver.WallTime()
                }
            }
        
        except Exception as e:
            print(f"Error extracting solution: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "error": f"Failed to extract solution: {str(e)}",
                "scheduled_courses": [],
                "conflicts": []
            }

    def check_consecutive_slot_conflicts(self, scheduled_courses):
        """Check for consecutive time slot conflicts that may have slipped through"""
        conflicts = []
    
        # Group scheduled courses by professor and day
        prof_day_courses = {}
        for sc in scheduled_courses:
            prof_id = sc['professor_id']
            day = sc['day_of_week']
        
            key = (prof_id, day)
            if key not in prof_day_courses:
                prof_day_courses[key] = []
            prof_day_courses[key].append(sc)
    
        # Check each professor-day combination for consecutive slots
        for (prof_id, day), courses in prof_day_courses.items():
            # Sort by time slot start time
            sorted_courses = sorted(courses, key=lambda x: x['time_slot_data']['start_time'])
        
            # Check for consecutive slots
            for i in range(len(sorted_courses) - 1):
                sc1 = sorted_courses[i]
                sc2 = sorted_courses[i + 1]
            
                # Parse time slots to determine if they're consecutive
                ts1 = sc1['time_slot_data']
                ts2 = sc2['time_slot_data']
            
                # Simple check: Do they touch?
                if ts1['end_time'] == ts2['start_time']:
                    # Create a conflict
                    conflict_id = f"CONF-{str(uuid.uuid4())[:8]}"
                
                    conflict = {
                        "conflict_id": conflict_id,
                        "schedule_id": self.schedule_id,
                        "timeslot_id": sc1['timeslot_id'],  # Use first time slot
                        "day_of_week": day,
                        "conflict_type": "CONSECUTIVE_SLOT_CONFLICT",
                        "description": f"Professor {self.professor_dict[prof_id]['first_name']} {self.professor_dict[prof_id]['last_name']} has consecutive classes on {day}",
                        "is_resolved": False
                    }
                
                    # Create conflict course associations
                    conflict_courses = []
                    for sc in [sc1, sc2]:
                        conflict_courses.append({
                            "conflict_course_id": f"CC-{str(uuid.uuid4())[:8]}",
                            "conflict_id": conflict_id,
                            "scheduled_course_id": sc['scheduled_course_id']
                        })
                
                    conflicts.append({
                        "conflict": conflict,
                        "scheduled_courses": [sc1, sc2],
                        "conflict_courses": conflict_courses
                    })
    
        return conflicts
    
    def check_time_slot_conflicts(self, scheduled_courses):
        """Check for conflicts in the scheduled courses (same time slot)"""
        conflicts = []
        
        # Group scheduled courses by time slot and day
        time_slot_map = {}
        for sc in scheduled_courses:
            key = (sc['timeslot_id'], sc['day_of_week'])
            if key not in time_slot_map:
                time_slot_map[key] = []
            time_slot_map[key].append(sc)
        
        # Check each time slot for multiple courses
        for (time_id, day), courses in time_slot_map.items():
            if len(courses) > 1:
                # There's a conflict
                conflict_id = f"CONF-{str(uuid.uuid4())[:8]}"
                
                # Create conflict record
                conflict = {
                    "conflict_id": conflict_id,
                    "schedule_id": self.schedule_id,
                    "timeslot_id": time_id,
                    "day_of_week": day,
                    "conflict_type": "TIME_SLOT_CONFLICT",
                    "description": f"Multiple courses scheduled at the same time slot on {day}",
                    "is_resolved": False
                }
                
                # Create conflict course associations
                conflict_courses = []
                for course in courses:
                    conflict_courses.append({
                        "conflict_course_id": f"CC-{str(uuid.uuid4())[:8]}",
                        "conflict_id": conflict_id,
                        "scheduled_course_id": course['scheduled_course_id']
                    })
                
                conflicts.append({
                    "conflict": conflict,
                    "scheduled_courses": courses,
                    "conflict_courses": conflict_courses
                })
        
        return conflicts
    
    def get_status_string(self):
        """Convert the solver status to a string"""
        if self.status == cp_model.OPTIMAL:
            return "OPTIMAL"
        elif self.status == cp_model.FEASIBLE:
            return "FEASIBLE"
        elif self.status == cp_model.INFEASIBLE:
            return "INFEASIBLE"
        elif self.status == cp_model.MODEL_INVALID:
            return "MODEL_INVALID"
        else:
            return "UNKNOWN"


def main():
    """Main function to run the scheduler"""
    try:
        if len(sys.argv) > 1:
            # Read from the input file
            with open(sys.argv[1], 'r') as file:
                data = json.load(file)
        else:
            # Read from stdin
            data = json.load(sys.stdin)
        
        # Initialize and solve
        scheduler = CourseScheduler(data)
        scheduler.build_model()
        solution = scheduler.solve()
        
        # Output the solution
        print(json.dumps(solution, indent=2))
    except Exception as e:
        print(f"Error in scheduler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        error_response = {
            "error": f"Scheduler error: {str(e)}",
            "scheduled_courses": [],
            "conflicts": []
        }
        print(json.dumps(error_response, indent=2))


if __name__ == "__main__":
    main()