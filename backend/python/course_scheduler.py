import sys
import math
from collections import defaultdict
try:
    from ortools.sat.python import cp_model
except ImportError:
    print("Error: Google OR-Tools not found. Please install it using 'pip install ortools'")
    sys.exit(1)
import json
import time
from typing import Dict, List, Any, Set, Tuple

class CourseScheduler:
    """
    Redesigned scheduler class using Google OR-Tools CP-SAT solver to generate
    course schedules with 100% scheduling guarantee and balanced distribution.
    """
    
    def __init__(self, data: Dict[str, Any]):
        """Initialize the scheduler with necessary data."""
        # Core data
        self.data = data
        self.schedule_id = data['scheduleId']
        self.courses = data['courses']
        self.professors = data['professors']
        self.time_slots = data['timeSlots']
        self.professor_availability = data['professorAvailability']
        self.professor_courses = data.get('professorCourses', [])
        
        # Dictionary lookups for performance
        self.course_dict = {c['course_id']: c for c in self.courses}
        self.professor_dict = {p['professor_id']: p for p in self.professors}
        self.time_slot_dict = {t['timeslot_id']: t for t in self.time_slots}
        
        # Organize data for efficient constraint creation
        self._prepare_course_data()
        self._organize_time_slots()
        self._analyze_constraints()
        
        # Initialize model
        self.model = cp_model.CpModel()
        self.solver = None
        
        # Decision variables
        self.course_professor_vars = {}
        self.course_timeslot_vars = {}
        self.course_day_vars = {}
        self.course_scheduled_vars = {}
        
        # Tracking variables for optimization
        self.courses_per_timeslot = {}
        self.courses_per_day = {}
        self.timeslot_imbalance = None
        self.day_imbalance = None
        self.similar_slot_imbalances = {}
        
    def _prepare_course_data(self):
        """Pre-process course data for scheduling."""
        self.total_course_instances = 0
        self.core_courses = []
        self.elective_courses = []
        self.multi_class_courses = {}
        
        for course in self.courses:
            course_id = course['course_id']
            num_classes = course.get('num_classes', 1)
            self.total_course_instances += num_classes
            
            if course.get('is_core', False):
                self.core_courses.append(course_id)
            else:
                self.elective_courses.append(course_id)
                
            if num_classes > 1:
                self.multi_class_courses[course_id] = num_classes
        
        print(f"Total courses: {len(self.courses)}")
        print(f"Total course instances to schedule: {self.total_course_instances}")
        print(f"Core courses: {len(self.core_courses)}")
        print(f"Multi-class courses: {len(self.multi_class_courses)}")
    
    def _organize_time_slots(self):
        """Organize time slots for efficient access."""
        # Group by day
        self.time_slots_by_day = defaultdict(list)
        for slot in self.time_slots:
            # Skip Friday slots
            if slot['day_of_week'].lower() != 'friday':
                self.time_slots_by_day[slot['day_of_week']].append(slot)
        
        # Group by duration
        self.time_slots_by_duration = defaultdict(list)
        for slot in self.time_slots:
            if slot['day_of_week'].lower() != 'friday':
                self.time_slots_by_duration[slot['duration_minutes']].append(slot)
        
        # Group by slot number (TS1, TS2, etc.)
        self.time_slots_by_number = defaultdict(list)
        for slot in self.time_slots:
            if slot['day_of_week'].lower() != 'friday':
                slot_number = slot['timeslot_id'].split('-')[0]
                self.time_slots_by_number[slot_number].append(slot)
                
        # Count available slots
        self.valid_time_slots = [s for s in self.time_slots 
                                if s['day_of_week'].lower() != 'friday']
        
        print(f"Valid time slots: {len(self.valid_time_slots)}")
        print(f"Time slots by duration: {', '.join(f'{d}min: {len(s)}' for d, s in self.time_slots_by_duration.items())}")
    
    def _analyze_constraints(self):
        """Analyze constraints to determine scheduling feasibility."""
        # Calculate course duration demand
        duration_demand = defaultdict(int)
        for course in self.courses:
            duration = course['duration_minutes']
            num_classes = course.get('num_classes', 1)
            duration_demand[duration] += num_classes
        
        # Calculate time slot supply by duration
        duration_supply = defaultdict(int)
        for slot in self.valid_time_slots:
            duration = slot['duration_minutes']
            duration_supply[duration] += 1
            
        # Calculate average courses per slot
        self.avg_courses_per_slot = self.total_course_instances / max(1, len(self.valid_time_slots))
        
        # Calculate expected max courses per slot for balancing
        # This will guide our soft constraints but NOT limit scheduling
        self.target_max_per_slot = max(2, math.ceil(self.avg_courses_per_slot * 1.5))
        
        # Calculate expected courses per day
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday"]
        self.target_courses_per_day = self.total_course_instances / len(valid_days)
        
        print(f"Average courses per slot: {self.avg_courses_per_slot:.2f}")
        print(f"Target maximum courses per slot: {self.target_max_per_slot}")
        print(f"Target courses per day: {self.target_courses_per_day:.2f}")
    
    def solve(self):
        """Main method to solve the scheduling problem with pattern enforcement."""
        start_time = time.time()
        
        # Create decision variables
        self._create_decision_variables()
        
        # Add core constraints (must be satisfied)
        self._add_core_constraints()
        
        # Add multi-class pattern constraints - ABSOLUTE ENFORCEMENT
        self._enforce_multi_class_constraints()
        
        # Add distribution tracking variables (for optimization, not constraints)
        self._add_distribution_tracking()
        
        # Add objective function that prioritizes 100% scheduling first,
        # then balanced distribution
        self._add_objective_function()
        
        # Solve the model
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = 300  # 5 minute timeout
        status = self.solver.Solve(self.model)
        
        solve_time = time.time() - start_time
        
        # Process the solution
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            result = self._extract_solution(status, solve_time)
        else:
            result = self._report_infeasibility(status, solve_time)
        
        return result
    
    def _create_decision_variables(self):
        """Create all decision variables with balanced distribution in mind."""
        # Prioritize slots for balanced distribution
        prioritized_slots = self._calculate_slot_priorities()
        
        # For each course and its instances
        for course in self.courses:
            course_id = course['course_id']
            num_classes = course.get('num_classes', 1)
            duration = course['duration_minutes']
            
            # Find matching time slots with exact duration
            matching_slots = [slot for slot in prioritized_slots 
                            if slot['duration_minutes'] == duration]
            
            # If no exact matches, allow flexibility to ensure 100% scheduling
            if not matching_slots:
                print(f"WARNING: No exact matching time slots for course {course_id} (duration: {duration})")
                
                # First try close matches (±5 minutes)
                matching_slots = [slot for slot in prioritized_slots
                                if abs(slot['duration_minutes'] - duration) <= 5]
                
                # If still no matches, use all non-Friday slots
                if not matching_slots:
                    matching_slots = prioritized_slots
            
            # Create variables for each class instance
            for instance in range(1, num_classes + 1):
                instance_id = f"{course_id}_{instance}"
                
                # Variable tracking if this course instance is scheduled
                self.course_scheduled_vars[instance_id] = self.model.NewBoolVar(f"scheduled_{instance_id}")
                
                # Create professor assignment variables
                self.course_professor_vars[instance_id] = {}
                for professor in self.professors:
                    prof_id = professor['professor_id']
                    # Only create variable if professor can teach this course
                    if self._can_professor_teach_course(prof_id, course_id):
                        self.course_professor_vars[instance_id][prof_id] = self.model.NewBoolVar(
                            f"course_{instance_id}_prof_{prof_id}"
                        )
                
                # Create time slot assignment variables
                self.course_timeslot_vars[instance_id] = {}
                self.course_day_vars[instance_id] = {}
                
                # Process each matching time slot for this course
                for time_slot in matching_slots:
                    slot_id = time_slot['timeslot_id']
                    day = time_slot['day_of_week']
                    
                    # Skip Friday slots
                    if day.lower() == 'friday':
                        continue
                    
                    # Create the time slot variable
                    self.course_timeslot_vars[instance_id][slot_id] = self.model.NewBoolVar(
                        f"course_{instance_id}_slot_{slot_id}"
                    )
                    
                    # Create day variables for convenience
                    if day not in self.course_day_vars[instance_id]:
                        self.course_day_vars[instance_id][day] = self.model.NewBoolVar(
                            f"course_{instance_id}_day_{day}"
                        )
    
    def _calculate_slot_priorities(self):
        """Calculate priorities for time slots to encourage balanced distribution."""
        # Get all non-Friday time slots
        slots = [slot for slot in self.time_slots 
                if slot['day_of_week'].lower() != 'friday']
        
        # Group slots by slot number (TS1, TS2, etc.)
        slots_by_number = defaultdict(list)
        for slot in slots:
            slot_number = slot['timeslot_id'].split('-')[0]
            slots_by_number[slot_number].append(slot)
        
        # Create alternating day order for balanced distribution
        day_order = {"Monday": 0, "Tuesday": 2, "Wednesday": 1, "Thursday": 3}
        
        # Sort slots within each group by day order
        for slot_number, group_slots in slots_by_number.items():
            group_slots.sort(key=lambda x: day_order[x['day_of_week']])
        
        # Create prioritized list with interleaved slot numbers
        prioritized_slots = []
        slot_groups = list(slots_by_number.items())
        slot_groups.sort(key=lambda x: x[0])
        
        # First add all slot groups in order
        for _, group_slots in slot_groups:
            prioritized_slots.extend(group_slots)
        
        return prioritized_slots
    
    def _add_core_constraints(self):
        """Add essential hard constraints that must be satisfied."""
        # CONSTRAINT 1: Every course must be scheduled (100% scheduling)
        for course_instance_id, scheduled_var in self.course_scheduled_vars.items():
            self.model.Add(scheduled_var == 1)
        
        # CONSTRAINT 2: Each scheduled course must have exactly one professor
        for course_instance_id, prof_vars in self.course_professor_vars.items():
            professor_sum = []
            for prof_id, var in prof_vars.items():
                professor_sum.append(var)
            
            # If there are professors who can teach this course
            if professor_sum:
                self.model.Add(sum(professor_sum) == 1)  # Must have exactly one professor
            else:
                # If no qualified professors, add a warning but don't enforce
                # This allows the model to remain feasible
                print(f"WARNING: No qualified professors for {course_instance_id}")
        
        # CONSTRAINT 3: Each scheduled course must have exactly one time slot
        for course_instance_id, slot_vars in self.course_timeslot_vars.items():
            time_slot_sum = []
            for slot_id, var in slot_vars.items():
                time_slot_sum.append(var)
            
            if time_slot_sum:
                self.model.Add(sum(time_slot_sum) == 1)  # Must have exactly one time slot
            else:
                # If no available time slots, add a warning but don't enforce
                print(f"WARNING: No available time slots for {course_instance_id}")
        
        # CONSTRAINT 4: A professor cannot teach two courses at the same time
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            for time_slot in self.time_slots_by_day[day]:
                slot_id = time_slot['timeslot_id']
                
                # For each professor
                for prof_id in self.professor_dict:
                    # Find all course instances that could be assigned to this professor at this time slot
                    courses_at_slot = []
                    for course_instance_id in self.course_scheduled_vars:
                        if (prof_id in self.course_professor_vars.get(course_instance_id, {}) and 
                            slot_id in self.course_timeslot_vars.get(course_instance_id, {})):
                            prof_var = self.course_professor_vars[course_instance_id][prof_id]
                            slot_var = self.course_timeslot_vars[course_instance_id][slot_id]
                            
                            # This variable is 1 if the course is assigned to this professor and time slot
                            assignment_var = self.model.NewBoolVar(f"prof_{prof_id}_slot_{slot_id}_course_{course_instance_id}")
                            self.model.AddBoolAnd([prof_var, slot_var]).OnlyEnforceIf(assignment_var)
                            self.model.AddBoolOr([prof_var.Not(), slot_var.Not()]).OnlyEnforceIf(assignment_var.Not())
                            
                            courses_at_slot.append(assignment_var)
                    
                    # At most one course can be assigned to this professor at this time slot
                    if len(courses_at_slot) > 1:
                        self.model.Add(sum(courses_at_slot) <= 1)
        
        # CONSTRAINT 5: Professors should not teach in consecutive time slots
        self._add_consecutive_slot_constraints()
        
        # CONSTRAINT 6: Courses can only be scheduled when professors are available
        self._add_professor_availability_constraints()
    
    def _enforce_multi_class_constraints(self):
        """Add constraints for multi-class courses with absolute pattern enforcement."""
        print("\n=== ENFORCING MULTI-CLASS PATTERNS WITH ABSOLUTE CONSTRAINTS ===")
        
        # Group course instances by their base course_id
        course_instances = {}
        for course_instance_id in self.course_scheduled_vars:
            course_id = course_instance_id.split('_')[0]
            instance = int(course_instance_id.split('_')[1])
            
            if course_id not in course_instances:
                course_instances[course_id] = []
            course_instances[course_id].append((course_instance_id, instance))
        
        # Process each course with multiple instances
        for course_id, instances in course_instances.items():
            # Sort instances by number
            instances.sort(key=lambda x: x[1])
            num_classes = len(instances)
            
            if num_classes <= 1:
                continue  # Skip courses with only one instance
                
            print(f"\nAbsolute pattern enforcement for {course_id} with {num_classes} classes")
            
            # 1. Ensure timeslot consistency (all instances use same timeslot number)
            self._enforce_absolute_timeslot_consistency(course_id, instances)
            
            # 2. Apply rigid day patterns based on number of classes
            if num_classes == 2:
                self._enforce_absolute_two_class_pattern(course_id, instances)
            elif num_classes == 3:
                self._enforce_absolute_three_class_pattern(course_id, instances)

    def _enforce_absolute_timeslot_consistency(self, course_id, instances):
        """Ensure all instances of a course use the same time slot number."""
        print(f"  Enforcing absolute timeslot consistency for {course_id}")
        
        # Extract all instances
        instance_ids = [instance_id for instance_id, _ in instances]
        
        # For each unique timeslot number (TS1, TS2, etc.)
        slot_numbers = set()
        for instance_id in instance_ids:
            for slot_id in self.course_timeslot_vars.get(instance_id, {}):
                slot_number = slot_id.split('-')[0]
                slot_numbers.add(slot_number)
        
        # For each possible timeslot number, create a decision variable
        number_vars = {}
        for slot_number in slot_numbers:
            number_vars[slot_number] = self.model.NewBoolVar(f"{course_id}_uses_{slot_number}")
        
        # Exactly one timeslot number must be chosen
        self.model.Add(sum(number_vars.values()) == 1)
        
        # For each instance and each of its possible timeslots
        for instance_id in instance_ids:
            for slot_id, slot_var in self.course_timeslot_vars.get(instance_id, {}).items():
                slot_number = slot_id.split('-')[0]
                
                # This timeslot can only be chosen if its number is chosen
                if slot_number in number_vars:
                    self.model.Add(slot_var <= number_vars[slot_number])
                else:
                    # If this slot number isn't a valid option, never choose it
                    self.model.Add(slot_var == 0)

    def _enforce_absolute_two_class_pattern(self, course_id, instances):
        """Force 2-class courses to follow either Mon+Wed or Tue+Thu pattern."""
        if len(instances) != 2:
            return
        
        instance1_id, instance2_id = instances[0][0], instances[1][0]
        print(f"  ABSOLUTE ENFORCEMENT: 2-class pattern for {course_id}")
        print(f"    Instance 1: {instance1_id}")
        print(f"    Instance 2: {instance2_id}")
        
        # Create a pattern selector - determines which pattern to use
        pattern_var = self.model.NewBoolVar(f"{course_id}_pattern")
        
        # Pattern 1 (pattern_var=0): Monday+Wednesday
        # Pattern 2 (pattern_var=1): Tuesday+Thursday
        
        # Track which slots are on which days for each instance
        day_slots = {
            instance1_id: {
                "Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": []
            },
            instance2_id: {
                "Monday": [], "Tuesday": [], "Wednesday": [], "Thursday": []
            }
        }
        
        # Gather all slots by day
        for instance_id in [instance1_id, instance2_id]:
            for slot_id, slot_var in self.course_timeslot_vars.get(instance_id, {}).items():
                day = self.time_slot_dict[slot_id]['day_of_week']
                if day in day_slots[instance_id]:
                    day_slots[instance_id][day].append((slot_id, slot_var))
        
        # Print available slots for debugging
        print(f"    Instance 1 available slots: Mon:{len(day_slots[instance1_id]['Monday'])}, " +
            f"Tue:{len(day_slots[instance1_id]['Tuesday'])}, " +
            f"Wed:{len(day_slots[instance1_id]['Wednesday'])}, " +
            f"Thu:{len(day_slots[instance1_id]['Thursday'])}")
        print(f"    Instance 2 available slots: Mon:{len(day_slots[instance2_id]['Monday'])}, " +
            f"Tue:{len(day_slots[instance2_id]['Tuesday'])}, " +
            f"Wed:{len(day_slots[instance2_id]['Wednesday'])}, " +
            f"Thu:{len(day_slots[instance2_id]['Thursday'])}")
        
        # Now enforce pattern 1: Monday+Wednesday
        # If pattern_var is FALSE (0):
        #  - Instance 1 MUST be on Monday
        #  - Instance 2 MUST be on Wednesday
        
        # Sum of all Monday slots for instance 1
        if day_slots[instance1_id]["Monday"]:
            monday_sum = sum(slot_var for _, slot_var in day_slots[instance1_id]["Monday"])
            # When pattern_var=0, this sum must be 1
            self.model.Add(monday_sum == 1).OnlyEnforceIf(pattern_var.Not())
        else:
            # If no Monday slots available, pattern 1 can't be used
            self.model.Add(pattern_var == 1)
        
        # All non-Monday slots for instance 1 must be 0 when pattern_var=0
        for day in ["Tuesday", "Wednesday", "Thursday"]:
            for _, slot_var in day_slots[instance1_id][day]:
                self.model.Add(slot_var == 0).OnlyEnforceIf(pattern_var.Not())
        
        # Sum of all Wednesday slots for instance 2
        if day_slots[instance2_id]["Wednesday"]:
            wednesday_sum = sum(slot_var for _, slot_var in day_slots[instance2_id]["Wednesday"])
            # When pattern_var=0, this sum must be 1
            self.model.Add(wednesday_sum == 1).OnlyEnforceIf(pattern_var.Not())
        else:
            # If no Wednesday slots available, pattern 1 can't be used
            self.model.Add(pattern_var == 1)
        
        # All non-Wednesday slots for instance 2 must be 0 when pattern_var=0
        for day in ["Monday", "Tuesday", "Thursday"]:
            for _, slot_var in day_slots[instance2_id][day]:
                self.model.Add(slot_var == 0).OnlyEnforceIf(pattern_var.Not())
        
        # Now enforce pattern 2: Tuesday+Thursday
        # If pattern_var is TRUE (1):
        #  - Instance 1 MUST be on Tuesday
        #  - Instance 2 MUST be on Thursday
        
        # Sum of all Tuesday slots for instance 1
        if day_slots[instance1_id]["Tuesday"]:
            tuesday_sum = sum(slot_var for _, slot_var in day_slots[instance1_id]["Tuesday"])
            # When pattern_var=1, this sum must be 1
            self.model.Add(tuesday_sum == 1).OnlyEnforceIf(pattern_var)
        else:
            # If no Tuesday slots available, pattern 2 can't be used
            self.model.Add(pattern_var == 0)
        
        # All non-Tuesday slots for instance 1 must be 0 when pattern_var=1
        for day in ["Monday", "Wednesday", "Thursday"]:
            for _, slot_var in day_slots[instance1_id][day]:
                self.model.Add(slot_var == 0).OnlyEnforceIf(pattern_var)
        
        # Sum of all Thursday slots for instance 2
        if day_slots[instance2_id]["Thursday"]:
            thursday_sum = sum(slot_var for _, slot_var in day_slots[instance2_id]["Thursday"])
            # When pattern_var=1, this sum must be 1
            self.model.Add(thursday_sum == 1).OnlyEnforceIf(pattern_var)
        else:
            # If no Thursday slots available, pattern 2 can't be used
            self.model.Add(pattern_var == 0)
        
        # All non-Thursday slots for instance 2 must be 0 when pattern_var=1
        for day in ["Monday", "Tuesday", "Wednesday"]:
            for _, slot_var in day_slots[instance2_id][day]:
                self.model.Add(slot_var == 0).OnlyEnforceIf(pattern_var)

    def _enforce_absolute_three_class_pattern(self, course_id, instances):
        """Force 3-class courses to follow Monday+Tuesday+Thursday pattern."""
        if len(instances) != 3:
            return
        
        instance_ids = [instance_id for instance_id, _ in instances]
        print(f"  ABSOLUTE ENFORCEMENT: 3-class pattern for {course_id}")
        print(f"    Instance 1: {instance_ids[0]}")
        print(f"    Instance 2: {instance_ids[1]}")
        print(f"    Instance 3: {instance_ids[2]}")
        
        # Required pattern: Monday+Tuesday+Thursday
        required_days = ["Monday", "Tuesday", "Thursday"]
        
        # For each instance, track slots by day
        day_slots = {}
        for idx, instance_id in enumerate(instance_ids):
            day_slots[instance_id] = {day: [] for day in required_days + ["Wednesday"]}
            
            # Gather slots by day
            for slot_id, slot_var in self.course_timeslot_vars.get(instance_id, {}).items():
                day = self.time_slot_dict[slot_id]['day_of_week']
                if day in day_slots[instance_id]:
                    day_slots[instance_id][day].append((slot_id, slot_var))
            
            # Print available slots for debugging
            target_day = required_days[idx]
            print(f"    Instance {idx+1} available slots for target day {target_day}: " +
                f"{len(day_slots[instance_id][target_day])}")
        
        # For each instance, enforce its required day and forbid other days
        for idx, instance_id in enumerate(instance_ids):
            target_day = required_days[idx]
            other_days = [d for d in day_slots[instance_id].keys() if d != target_day]
            
            # Sum of all slots on target day must be 1
            if day_slots[instance_id][target_day]:
                target_sum = sum(slot_var for _, slot_var in day_slots[instance_id][target_day])
                self.model.Add(target_sum == 1)
            else:
                print(f"    WARNING: Instance {idx+1} has no slots on required {target_day}")
                # This is a hard constraint that cannot be satisfied
                # We'll let the solver fail and report conflicts
            
            # All slots on other days must be 0
            for day in other_days:
                for _, slot_var in day_slots[instance_id][day]:
                    self.model.Add(slot_var == 0)

    def _add_consecutive_slot_constraints(self):
        """Prevent professors from teaching in consecutive time slots."""
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            # Sort time slots by start time
            day_slots = sorted(
                self.time_slots_by_day[day],
                key=lambda x: x['start_time']
            )
            
            # For each pair of consecutive time slots
            for i in range(len(day_slots) - 1):
                slot1 = day_slots[i]
                slot2 = day_slots[i + 1]
                slot1_id = slot1['timeslot_id']
                slot2_id = slot2['timeslot_id']
                
                # For each professor
                for prof_id in self.professor_dict:
                    # Find course instances that could be assigned to this professor at these time slots
                    courses_at_slot1 = []
                    courses_at_slot2 = []
                    
                    for course_instance_id in self.course_scheduled_vars:
                        # Check if this course instance could be assigned to this slot and professor
                        prof_vars = self.course_professor_vars.get(course_instance_id, {})
                        slot_vars = self.course_timeslot_vars.get(course_instance_id, {})
                        
                        if prof_id in prof_vars:
                            prof_var = prof_vars[prof_id]
                            
                            if slot1_id in slot_vars:
                                slot1_var = slot_vars[slot1_id]
                                
                                # Variable is 1 if course is assigned to professor and slot1
                                assignment_var1 = self.model.NewBoolVar(
                                    f"prof_{prof_id}_slot_{slot1_id}_course_{course_instance_id}"
                                )
                                self.model.AddBoolAnd([prof_var, slot1_var]).OnlyEnforceIf(assignment_var1)
                                self.model.AddBoolOr([prof_var.Not(), slot1_var.Not()]).OnlyEnforceIf(assignment_var1.Not())
                                
                                courses_at_slot1.append(assignment_var1)
                            
                            if slot2_id in slot_vars:
                                slot2_var = slot_vars[slot2_id]
                                
                                # Variable is 1 if course is assigned to professor and slot2
                                assignment_var2 = self.model.NewBoolVar(
                                    f"prof_{prof_id}_slot_{slot2_id}_course_{course_instance_id}"
                                )
                                self.model.AddBoolAnd([prof_var, slot2_var]).OnlyEnforceIf(assignment_var2)
                                self.model.AddBoolOr([prof_var.Not(), slot2_var.Not()]).OnlyEnforceIf(assignment_var2.Not())
                                
                                courses_at_slot2.append(assignment_var2)
                    
                    # A professor cannot teach in consecutive time slots
                    for var1 in courses_at_slot1:
                        for var2 in courses_at_slot2:
                            self.model.Add(var1 + var2 <= 1)
    
    def _add_professor_availability_constraints(self):
        """Ensure courses are scheduled only when professors are available."""
        for course_instance_id in self.course_scheduled_vars:
            # For each possible professor and time slot
            for prof_id, prof_var in self.course_professor_vars.get(course_instance_id, {}).items():
                for slot_id, slot_var in self.course_timeslot_vars.get(course_instance_id, {}).items():
                    time_slot = self.time_slot_dict[slot_id]
                    day = time_slot['day_of_week']
                    
                    # If professor is not available, course can't use this professor and time slot
                    is_available = self._is_professor_available(prof_id, slot_id, day)
                    if not is_available:
                        self.model.Add(prof_var + slot_var <= 1)
    
    def _add_distribution_tracking(self):
        """Add variables to track distribution metrics for optimization."""
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday"]
        
        # 1. Track courses per time slot
        for day in valid_days:
            for time_slot in self.time_slots_by_day[day]:
                slot_id = time_slot['timeslot_id']
                slot_key = f"{day}_{slot_id}"
                
                # Get all course variables that could be assigned to this time slot
                course_vars = []
                for course_instance_id, slot_vars in self.course_timeslot_vars.items():
                    if slot_id in slot_vars:
                        course_vars.append(slot_vars[slot_id])
                
                # Variable to track how many courses are assigned to this slot
                max_possible = len(course_vars)
                self.courses_per_timeslot[slot_key] = self.model.NewIntVar(
                    0, max_possible, f"courses_at_{slot_key}"
                )
                
                # Set this variable equal to the sum of course variables
                self.model.Add(self.courses_per_timeslot[slot_key] == sum(course_vars))
        
        # 2. Track courses per day
        for day in valid_days:
            day_course_vars = []
            
            for time_slot in self.time_slots_by_day[day]:
                slot_id = time_slot['timeslot_id']
                slot_key = f"{day}_{slot_id}"
                day_course_vars.append(self.courses_per_timeslot[slot_key])
            
            # Variable to track how many courses are on this day
            self.courses_per_day[day] = self.model.NewIntVar(
                0, self.total_course_instances, f"courses_on_{day}"
            )
            
            # Set this variable equal to the sum of courses on this day
            self.model.Add(self.courses_per_day[day] == sum(day_course_vars))
        
        # 3. Track day imbalance (max - min)
        max_day_count = self.model.NewIntVar(0, self.total_course_instances, "max_day_count")
        min_day_count = self.model.NewIntVar(0, self.total_course_instances, "min_day_count")
        
        for day, count_var in self.courses_per_day.items():
            self.model.Add(max_day_count >= count_var)
            self.model.Add(min_day_count <= count_var)
        
        self.day_imbalance = self.model.NewIntVar(0, self.total_course_instances, "day_imbalance")
        self.model.Add(self.day_imbalance == max_day_count - min_day_count)
        
        # 4. Track similar slot imbalance
        self._add_similar_slot_tracking()
    
    def _add_similar_slot_tracking(self):
        """Track distribution across similar time slots."""
        # Group time slots by their slot number (TS1, TS2, etc.)
        slot_groups = {}
        
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            for time_slot in self.time_slots_by_day[day]:
                slot_id = time_slot['timeslot_id']
                slot_number = slot_id.split('-')[0]  # e.g., 'TS1'
                
                if slot_number not in slot_groups:
                    slot_groups[slot_number] = {}
                
                slot_key = f"{day}_{slot_id}"
                if slot_key in self.courses_per_timeslot:
                    if day not in slot_groups[slot_number]:
                        slot_groups[slot_number][day] = []
                    slot_groups[slot_number][day].append(self.courses_per_timeslot[slot_key])
        
        # For each group of similar slots, track imbalance
        self.similar_slot_imbalances = {}
        
        for slot_number, days in slot_groups.items():
            if len(days) <= 1:
                continue  # Skip if only on one day
            
            # Find the max and min for this slot group
            group_max = self.model.NewIntVar(0, self.total_course_instances, f"max_{slot_number}")
            group_min = self.model.NewIntVar(0, self.total_course_instances, f"min_{slot_number}")
            
            # Collect all count variables for this slot group
            group_counts = []
            for day_slots in days.values():
                group_counts.extend(day_slots)
            
            # Set max and min variables
            for count_var in group_counts:
                self.model.Add(group_max >= count_var)
                
                # Only consider non-zero slots for the minimum
                is_positive = self.model.NewBoolVar(f"is_positive_{count_var}")
                self.model.Add(count_var > 0).OnlyEnforceIf(is_positive)
                self.model.Add(count_var == 0).OnlyEnforceIf(is_positive.Not())
                self.model.Add(group_min <= count_var).OnlyEnforceIf(is_positive)
            
            # Calculate imbalance (max - min)
            imbalance = self.model.NewIntVar(0, self.total_course_instances, f"imbalance_{slot_number}")
            self.model.Add(imbalance == group_max - group_min)
            
            # Store for objective function
            self.similar_slot_imbalances[slot_number] = imbalance
    
    def _add_objective_function(self):
        """Define a comprehensive objective function for optimization."""
        objective_terms = []
        
        # HIGHEST PRIORITY: Multi-class course patterns
        if hasattr(self, 'pattern_reward'):
            pattern_reward_term = self.model.NewConstant(self.pattern_reward)
            objective_terms.append(pattern_reward_term)
            
        # Next highest: Timeslot consistency for multi-class courses
        if hasattr(self, 'slot_consistency_reward'):
            slot_reward_term = self.model.NewConstant(self.slot_consistency_reward)
            objective_terms.append(slot_reward_term)

        # 1. Minimize day imbalance (with negative coefficient)
        objective_terms.append(self.day_imbalance * -5)
        
        # 2. Penalize excessive courses in any time slot
        for slot_key, count_var in self.courses_per_timeslot.items():
            # Graduated penalty: The more courses in a slot, the higher the penalty
            for i in range(1, self.target_max_per_slot * 2):
                # Variable is 1 if slot has more than i courses
                over_i = self.model.NewBoolVar(f"over_{i}_{slot_key}")
                self.model.Add(count_var > i).OnlyEnforceIf(over_i)
                self.model.Add(count_var <= i).OnlyEnforceIf(over_i.Not())
                
                # Increasing penalty for each additional course
                penalty = -1 * (i ** 2)  # Quadratic penalty
                objective_terms.append(over_i * penalty)
        
        # 3. Penalize imbalances in similar time slots
        for slot_number, imbalance in self.similar_slot_imbalances.items():
            # Stronger penalty for popular time slots
            weight = -10 if slot_number in ['TS1', 'TS2', 'TS3'] else -5
            objective_terms.append(imbalance * weight)
        
        # 4. Prefer assigning core courses to better time slots
        for course_instance_id, slot_vars in self.course_timeslot_vars.items():
            course_id = course_instance_id.split('_')[0]
            course = self.course_dict[course_id]
            
            if course.get('is_core', False):
                # Prioritize early slots for core courses
                for slot_id, slot_var in slot_vars.items():
                    slot_num = slot_id.split('-')[0]
                    # Better slots (TS1, TS2) get higher weights
                    pref_weight = 3 if slot_num in ['TS1', 'TS2'] else 1
                    objective_terms.append(slot_var * pref_weight)
        
        self.model.Maximize(sum(objective_terms))
    
    def _extract_solution(self, status, solve_time):
        """Extract the solution from the solved model."""
        result = {
            "success": True,
            "result": {
                "scheduled_courses": [],
                "conflicts": [],  # Initialize conflicts array even if empty
                "statistics": {
                    "solver_status": self._get_status_string(status),
                    "solver_time": solve_time
                }
            }
        }
        
        # Dictionary to track courses by time slot
        courses_by_timeslot = {}
        professors_by_timeslot = {}
        
        # Extract scheduled courses
        scheduled_count = 0
        core_scheduled = 0
        core_total = 0
        scheduled_course_ids = set()  # Keep track of scheduled courses
        
        # Count total core courses
        for course in self.courses:
            if course.get('is_core', False):
                core_total += course.get('num_classes', 1)
        
        # Process all scheduled course instances
        for course_instance_id, scheduled_var in self.course_scheduled_vars.items():
            course_id = course_instance_id.split('_')[0]
            instance_num = int(course_instance_id.split('_')[1])
            
            if self.solver.Value(scheduled_var) == 1:
                course = self.course_dict[course_id]
                
                # Find assigned professor
                assigned_prof_id = None
                for prof_id, prof_var in self.course_professor_vars[course_instance_id].items():
                    if self.solver.Value(prof_var) == 1:
                        assigned_prof_id = prof_id
                        break
                
                # Find assigned time slot
                assigned_slot_id = None
                assigned_day = None
                
                for slot_id, slot_var in self.course_timeslot_vars[course_instance_id].items():
                    if self.solver.Value(slot_var) == 1:
                        assigned_slot_id = slot_id
                        assigned_day = self.time_slot_dict[slot_id]['day_of_week']
                        break
                
                # Only process if we have both professor and time slot assigned
                if assigned_prof_id and assigned_slot_id:
                    scheduled_count += 1
                    scheduled_course_ids.add(course_instance_id)
                    
                    if course.get('is_core', False):
                        core_scheduled += 1
                    
                    # Track courses by time slot for analysis
                    slot_key = f"{assigned_day}_{assigned_slot_id}"
                    if slot_key not in courses_by_timeslot:
                        courses_by_timeslot[slot_key] = []
                    
                    courses_by_timeslot[slot_key].append({
                        "course_id": course_id,
                        "course_instance_id": course_instance_id,
                        "is_core": course.get('is_core', False)
                    })
                    
                    # Track professors by time slot
                    if slot_key not in professors_by_timeslot:
                        professors_by_timeslot[slot_key] = {}
                    
                    if assigned_prof_id not in professors_by_timeslot[slot_key]:
                        professors_by_timeslot[slot_key][assigned_prof_id] = []
                    
                    professors_by_timeslot[slot_key][assigned_prof_id].append(course_instance_id)
                    
                    # Add to scheduled courses
                    result["result"]["scheduled_courses"].append({
                        "scheduled_course_id": f"SC-{course_instance_id}",
                        "schedule_id": self.schedule_id,
                        "course_id": course_id,
                        "professor_id": assigned_prof_id,
                        "timeslot_id": assigned_slot_id,
                        "day_of_week": assigned_day,
                        "is_override": False,
                        "class_instance": instance_num,
                        "num_classes": course.get('num_classes', 1),
                        "course_data": course,
                        "professor_data": self.professor_dict.get(assigned_prof_id, {}),
                        "time_slot_data": self.time_slot_dict.get(assigned_slot_id, {})
                    })
        
        # Find unscheduled courses and add them as conflicts
        for course_instance_id, scheduled_var in self.course_scheduled_vars.items():
            course_id = course_instance_id.split('_')[0]
            instance_num = int(course_instance_id.split('_')[1])
            
            if course_instance_id not in scheduled_course_ids:
                course = self.course_dict[course_id]
                
                # Determine best professor (if any)
                best_prof_id = None
                for prof_id in self.course_professor_vars[course_instance_id]:
                    if self._can_professor_teach_course(prof_id, course_id):
                        best_prof_id = prof_id
                        break
                
                # Add conflict with the structure expected by Node.js
                result["result"]["conflicts"].append({
                    "conflict": {
                        "conflict_id": f"CONF-{course_instance_id}",
                        "schedule_id": self.schedule_id,
                        "timeslot_id": None,  # No time slot assigned
                        "day_of_week": None,  # No day assigned
                        "conflict_type": "NO_AVAILABLE_SLOT",
                        "description": f"Could not schedule course {course_id} (instance {instance_num})",
                        "is_resolved": False,
                        "resolution_notes": None
                    },
                    "scheduled_course": {
                        "course_id": course_id,
                        "professor_id": best_prof_id,
                        "class_instance": instance_num,
                        "num_classes": course.get('num_classes', 1)
                    },
                    "conflict_course": {
                        "scheduled_course_id": f"SC-{course_instance_id}"
                    }
                })
        
        # Calculate day counts from courses_by_timeslot
        day_counts = {}
        for slot_key, courses in courses_by_timeslot.items():
            day = slot_key.split('_')[0]
            day_counts[day] = day_counts.get(day, 0) + len(courses)
        
        # Update statistics
        result["result"]["statistics"].update({
            "total_courses": self.total_course_instances,
            "scheduled_courses": scheduled_count,
            "scheduling_percentage": round((scheduled_count / self.total_course_instances) * 100, 2),
            "core_courses": core_total,
            "core_courses_scheduled": core_scheduled,
            "core_percentage": round((core_scheduled / core_total) * 100, 2) if core_total > 0 else 100,
            "unresolved_conflicts": len(result["result"]["conflicts"]),
            "courses_by_day": day_counts
        })
        
        # For debugging: print a detailed breakdown of the schedule
        self._print_schedule_analysis(courses_by_timeslot, day_counts)
        
        return result
    
    def _calculate_distribution_quality(self, timeslot_counts, day_counts):
        """Calculate a score for distribution quality."""
        # Day balance score (0-100)
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday"]
        day_values = [day_counts.get(day, 0) for day in valid_days]
        max_day = max(day_values) if day_values else 0
        min_day = min(day_values) if day_values else 0
        day_range = max_day - min_day
        day_score = max(0, 100 - (day_range * 10))
        
        # Time slot distribution score (0-100)
        slot_values = list(timeslot_counts.values())
        max_slot = max(slot_values) if slot_values else 0
        avg_slot = sum(slot_values) / len(slot_values) if slot_values else 0
        slot_score = max(0, 100 - (max_slot - avg_slot) * 15)
        
        # Overall quality score (0-100)
        overall_score = (day_score * 0.4) + (slot_score * 0.6)
        
        return {
            "overall_score": round(overall_score, 1),
            "day_balance_score": round(day_score, 1),
            "slot_distribution_score": round(slot_score, 1),
            "max_courses_in_any_day": max_day,
            "day_imbalance": day_range
        }
    
    def _print_schedule_analysis(self, courses_by_timeslot, day_counts):
        # Add new validation code:
        print("\nMulti-Class Course Pattern Validation:")
        multi_classes = {k: v for k, v in self.multi_class_courses.items() if v > 1}
        
        for course_id, num_classes in multi_classes.items():
            instances = []
            for i in range(1, num_classes + 1):
                instance_id = f"{course_id}_{i}"
                day = "Unknown"
                
                # Find this instance in the schedule
                for slot_key, courses in courses_by_timeslot.items():
                    for c in courses:
                        if c['course_instance_id'] == instance_id:
                            day = slot_key.split('_')[0]
                            break
                
                instances.append((i, day))
            
            # Verify pattern compliance
            days = [day for _, day in instances]
            pattern_ok = False
            
            if num_classes == 2:
                pattern_ok = (days == ["Monday", "Wednesday"] or days == ["Tuesday", "Thursday"])
            elif num_classes == 3:
                pattern_ok = (days == ["Monday", "Tuesday", "Thursday"])
                
            print(f"  {course_id} ({num_classes} classes): {'CORRECT' if pattern_ok else 'INCORRECT'}")
            print(f"    Days: {', '.join(days)}")
    
    def _report_infeasibility(self, status, solve_time):
        """Report why the model is infeasible."""
        # Analyze potential issues
        issues = []
        
        # Check if there are courses with no available time slots
        courses_without_slots = []
        for course in self.courses:
            course_id = course['course_id']
            course_duration = course['duration_minutes']
            matching_slots = [
                slot for slot in self.valid_time_slots 
                if slot['duration_minutes'] == course_duration
            ]
            if not matching_slots:
                courses_without_slots.append({
                    "course_id": course_id,
                    "duration": course_duration,
                    "available_durations": list(set(slot['duration_minutes'] for slot in self.valid_time_slots))
                })
        
        if courses_without_slots:
            issues.append(f"Found {len(courses_without_slots)} courses with no matching time slot durations")
        
        # Check if there are courses with no qualified professors
        courses_without_professors = []
        for course in self.courses:
            course_id = course['course_id']
            qualified_profs = [
                p['professor_id'] for p in self.professors
                if self._can_professor_teach_course(p['professor_id'], course_id)
            ]
            if not qualified_profs:
                courses_without_professors.append({
                    "course_id": course_id,
                    "department_id": course.get('department_id')
                })
        
        if courses_without_professors:
            issues.append(f"Found {len(courses_without_professors)} courses with no qualified professors")
        
        # Check if there are enough time slots
        if len(self.valid_time_slots) < self.total_course_instances:
            issues.append(f"Not enough time slots: have {len(self.valid_time_slots)}, need at least {self.total_course_instances}")
        
        return {
            "success": False,
            "error": f"The scheduling problem is infeasible or could not be solved within the time limit",
            "status": self._get_status_string(status),
            "solver_time": solve_time,
            "issues": issues,
            "courses_without_slots": courses_without_slots[:10] if courses_without_slots else [],
            "courses_without_professors": courses_without_professors[:10] if courses_without_professors else []
        }
        
    def _get_status_string(self, status):
        """Convert solver status to string representation."""
        if status == cp_model.OPTIMAL:
            return "OPTIMAL"
        elif status == cp_model.FEASIBLE:
            return "FEASIBLE"
        elif status == cp_model.INFEASIBLE:
            return "INFEASIBLE"
        elif status == cp_model.MODEL_INVALID:
            return "MODEL_INVALID"
        elif status == cp_model.UNKNOWN:
            return "UNKNOWN"
        return "UNDEFINED"
    
    def _can_professor_teach_course(self, professor_id, course_id):
        """Check if a professor can teach a course based on qualifications."""
        # If we have professor-course assignments, use them
        if self.professor_courses:
            for pc in self.professor_courses:
                if pc['professor_id'] == professor_id and pc['course_id'] == course_id:
                    return True
            return False
        
        # Otherwise, assume professors can teach courses in their department
        course = self.course_dict.get(course_id)
        professor = self.professor_dict.get(professor_id)
        
        if not course or not professor:
            return False
        
        # If department IDs match, professor can teach the course
        return course.get('department_id') == professor.get('department_id')
    
    def _is_professor_available(self, professor_id, timeslot_id, day):
        """Check if a professor is available at a given time slot."""
        # If we have availability data, use it
        if professor_id in self.professor_availability:
            if day in self.professor_availability[professor_id]:
                return timeslot_id in self.professor_availability[professor_id][day]
            return False
        
        # Otherwise, assume professors are available at all times
        return True