import sys
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
    Main scheduler class using Google OR-Tools CP-SAT solver to generate
    course schedules based on complex constraints.
    """
    
    def __init__(self, data: Dict[str, Any]):
        """
        Initialize the scheduler with necessary data.
        
        Args:
            data: Dictionary containing all input data for scheduling
        """
        self.data = data
        self.model = cp_model.CpModel()
        self.solver = None
        self.schedule_id = data['scheduleId']
        self.courses = data['courses']
        self.professors = data['professors']
        self.time_slots = data['timeSlots']
        self.professor_availability = data['professorAvailability']
        self.course_programs = data.get('coursePrograms', {})
        self.professor_courses = data.get('professorCourses', [])
        self.course_semesters = data.get('courseSemesters', {})
        self.constraints = data.get('constraints', {})
        
        # Initialize dictionaries for faster lookup
        self.course_dict = {c['course_id']: c for c in self.courses}
        self.professor_dict = {p['professor_id']: p for p in self.professors}
        self.time_slot_dict = {t['timeslot_id']: t for t in self.time_slots}
        
        # Group time slots by day
        self.time_slots_by_day = self._group_time_slots_by_day()
        
        # Group time slots by duration
        self.time_slots_by_duration = self._group_time_slots_by_duration()
        
        # Variables that will be created during solve()
        self.course_professor_vars = {}
        self.course_timeslot_vars = {}
        self.course_day_vars = {}
        self.course_scheduled_vars = {}
        self.solution = None
        
    def _group_time_slots_by_day(self) -> Dict[str, List[Dict[str, Any]]]:
        """Group time slots by day of week for faster access"""
        result = {}
        for slot in self.time_slots:
            day = slot['day_of_week']
            if day not in result:
                result[day] = []
            result[day].append(slot)
        return result
    
    def _group_time_slots_by_duration(self) -> Dict[int, List[Dict[str, Any]]]:
        """Group time slots by duration for faster access"""
        result = {}
        for slot in self.time_slots:
            duration = slot['duration_minutes']
            if duration not in result:
                result[duration] = []
            result[duration].append(slot)
        return result
    
    def solve(self) -> Dict[str, Any]:
        """Main method to solve the scheduling problem with a simplified approach"""
        start_time = time.time()
        
        # Create decision variables with Friday filtering
        self._create_sequential_scanning_variables()
        
        # Add essential constraints that FORCE courses to be scheduled
        self._add_essential_constraints()

        # Calculate time slot scarcity for each duration
        self._add_timeslot_scarcity_penalty()
        
        # Define objective function
        self._add_simple_objective(self.model)
        
        # Solve the model
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = 1000000  # 2 minute timeout
        status = self.solver.Solve(self.model)
        

        
        solve_time = time.time() - start_time
        
        # Process the solution or find conflicts
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            result = self._extract_solution(self.solver, status, solve_time)
        else:
            result = self._report_infeasibility(status, solve_time)
        
        return result

    def _create_simple_variables(self):
        """Create all decision variables with flexible duration matching"""
        # For each course and number of classes
        for course in self.courses:
            course_id = course['course_id']
            num_classes = course.get('num_classes', 1)
            
            # Create variables for each class instance
            for instance in range(1, num_classes + 1):
                instance_id = f"{course_id}_{instance}"
                
                # Boolean variable to track if this course instance is scheduled
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
                
                # Time slot variables - filter out Friday slots and ensure exact duration matching
                for time_slot in self.time_slots:
                    # Skip Friday time slots
                    if time_slot['day_of_week'].lower() == 'friday':
                        continue
                        
                    # Only create variables for time slots with exactly matching duration
                    slot_id = time_slot['timeslot_id']
                    course_duration = self.course_dict[course_id.split('_')[0]]['duration_minutes']
                    slot_duration = time_slot['duration_minutes']
                    
                    # Only create variable if durations match exactly
                    if course_duration == slot_duration:
                        self.course_timeslot_vars[instance_id][slot_id] = self.model.NewBoolVar(
                            f"course_{instance_id}_slot_{slot_id}"
                        )
                        
                        # Record day variables for convenience
                        day = time_slot['day_of_week']
                        if day not in self.course_day_vars[instance_id]:
                            self.course_day_vars[instance_id][day] = self.model.NewBoolVar(
                                f"course_{instance_id}_day_{day}"
                            )
                
                # Add after the time slot variable creation loop:
                if not self.course_timeslot_vars[instance_id]:
                    print(f"WARNING: Course {course_id} (duration: {course_duration} min) has no time slots with exact matching duration")

    def _add_essential_constraints(self):
        """Add the most essential constraints plus distribution constraints"""
        # Constraint 1: Each scheduled course must have exactly one professor
        for course_instance_id, prof_vars in self.course_professor_vars.items():
            professor_sum = []
            for prof_id, var in prof_vars.items():
                professor_sum.append(var)
            
            scheduled_var = self.course_scheduled_vars[course_instance_id]
            
            # If there are professors who can teach this course
            if professor_sum:
                self.model.Add(sum(professor_sum) == scheduled_var)
            else:
                # If no qualified professors, course can't be scheduled
                self.model.Add(scheduled_var == 0)
        
        # Constraint 2: Each scheduled course must have exactly one time slot
        for course_instance_id, slot_vars in self.course_timeslot_vars.items():
            time_slot_sum = []
            for slot_id, var in slot_vars.items():
                time_slot_sum.append(var)
            
            scheduled_var = self.course_scheduled_vars[course_instance_id]
            
            if time_slot_sum:
                self.model.Add(sum(time_slot_sum) == scheduled_var)
            else:
                # If no available time slots, course can't be scheduled
                self.model.Add(scheduled_var == 0)
        
        # Constraint 3: A professor cannot teach two courses at the same time
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            for time_slot in self.time_slots_by_day.get(day, []):
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

        # Constraint 4: Distribution constraints across days
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday"]
        day_counts = {}

        for day in valid_days:
            # Count courses scheduled on each day
            day_slots = [slot_id for slot_id, slot in self.time_slot_dict.items() 
                        if slot['day_of_week'] == day]
            day_course_vars = []
            
            for course_instance_id in self.course_scheduled_vars:
                course_on_day = []
                for slot_id in day_slots:
                    if slot_id in self.course_timeslot_vars.get(course_instance_id, {}):
                        course_on_day.append(self.course_timeslot_vars[course_instance_id][slot_id])
                
                if course_on_day:
                    # This variable is 1 if course is scheduled on this day
                    day_var = self.model.NewBoolVar(f"course_{course_instance_id}_on_{day}")
                    self.model.Add(sum(course_on_day) == day_var)
                    day_course_vars.append(day_var)
            
            # Variable representing number of courses on this day
            day_counts[day] = self.model.NewIntVar(0, len(self.courses) * 3, f"count_{day}")
            self.model.Add(day_counts[day] == sum(day_course_vars))

        # Add time slot load balancing
        self._add_time_slot_load_balancing()

        # Add day pattern constraints for multi-class courses
        self._add_multi_class_day_patterns()

        # Add time slot consistency constraints for multi-class courses
        self._add_time_slot_consistency()

        # Try to enforce minimum courses per day (at least 2-3 courses per day)
        min_per_day = max(2, len(self.courses) // len(valid_days) - 1)
        for day in valid_days:
            self.model.Add(day_counts[day] >= min_per_day)
            
        # Add maximum courses per day constraint
        max_per_day = (len(self.courses) // len(valid_days)) + 2  # Allow slight imbalance
        for day in valid_days:
            self.model.Add(day_counts[day] <= max_per_day)

        # Track the day imbalance for the objective function
        max_day_count = self.model.NewIntVar(0, len(self.courses) * 3, "max_day_count")
        min_day_count = self.model.NewIntVar(0, len(self.courses) * 3, "min_day_count")

        # Set max_day_count to be the maximum of all day counts
        for day in valid_days:
            self.model.Add(max_day_count >= day_counts[day])

        # Set min_day_count to be the minimum of all day counts
        for day in valid_days:
            self.model.Add(min_day_count <= day_counts[day])

        # Store day imbalance as instance variable for objective function
        self.day_imbalance = self.model.NewIntVar(0, len(self.courses) * 3, "day_imbalance")
        self.model.Add(self.day_imbalance == max_day_count - min_day_count)

        # Limit maximum imbalance
        self.model.Add(self.day_imbalance <= 2)
        
        # Add time slot distribution constraints
        self._add_time_slot_distribution_constraints()

        # Require at least 75% of courses to be scheduled
        min_courses = max(1, int(len(self.courses) * 0.75))
        total_scheduled = []
        for course_instance_id, scheduled_var in self.course_scheduled_vars.items():
            total_scheduled.append(scheduled_var)
        self.model.Add(sum(total_scheduled) >= min_courses)

        # Link day variables to time slot variables
        for course_instance_id in self.course_scheduled_vars:
            for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
                if day in self.course_day_vars.get(course_instance_id, {}):
                    day_var = self.course_day_vars[course_instance_id][day]
                    
                    # Get all time slots for this day
                    day_slots = []
                    for slot_id, slot_var in self.course_timeslot_vars.get(course_instance_id, {}).items():
                        time_slot = self.time_slot_dict.get(slot_id)
                        if time_slot and time_slot['day_of_week'] == day:
                            day_slots.append(slot_var)
                    
                    if day_slots:
                        # If this day is chosen, exactly one of its time slots must be chosen
                        self.model.Add(sum(day_slots) == day_var)
                    else:
                        # If no time slots for this day, it can't be chosen
                        self.model.Add(day_var == 0)
    
    def _create_variables(self):
        """Create all decision variables for the model"""
        # For each course and number of classes
        for course in self.courses:
            course_id = course['course_id']
            num_classes = course.get('num_classes', 1)
            
            # Create variables for each class instance
            for instance in range(1, num_classes + 1):
                instance_id = f"{course_id}_{instance}"
                
                # Boolean variable to track if this course instance is scheduled
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
                
                # Day variables for day pattern enforcement
                valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday"]
                for day in valid_days:
                    self.course_day_vars[instance_id][day] = self.model.NewBoolVar(
                        f"course_{instance_id}_day_{day}"
                    )
                
                # Time slot variables - allow flexibility in duration
                course_duration = course['duration_minutes']
                for time_slot in self.time_slots:
                    # Don't enforce exact duration matching - allow any time slot
                    slot_id = time_slot['timeslot_id']
                    self.course_timeslot_vars[instance_id][slot_id] = self.model.NewBoolVar(
                        f"course_{instance_id}_slot_{slot_id}"
                    )

    def _add_time_slot_distribution_constraints(self):
        """Limit the number of courses in any single time slot"""
        
        # For each time slot across all days
        for time_slot in self.time_slots:
            slot_id = time_slot['timeslot_id']
            day = time_slot['day_of_week']
            
            # Skip Friday slots (should already be filtered in variable creation)
            if day.lower() == 'friday':
                continue
                
            # Find all courses that could be assigned to this time slot
            course_vars = []
            for course_instance_id in self.course_scheduled_vars:
                if slot_id in self.course_timeslot_vars.get(course_instance_id, {}):
                    course_vars.append(self.course_timeslot_vars[course_instance_id][slot_id])
            
            # If multiple courses could be assigned, limit the maximum
            if len(course_vars) > 1:
                # Allow up to 3 courses per time slot (more generous limit)
                max_courses_per_slot = min(3, max(2, len(self.courses) // (len(self.time_slots) * 2)))
                self.model.Add(sum(course_vars) <= max_courses_per_slot)

    def _create_sequential_scanning_variables(self):
        """Create decision variables with sequential scanning and smart duration matching"""
        # Group time slots by day and sort by start time
        sorted_time_slots_by_day = {}
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            day_slots = self.time_slots_by_day.get(day, [])
            sorted_time_slots_by_day[day] = sorted(day_slots, key=lambda ts: ts['start_time'])
        
        # Debug: Print all available time slot durations
        available_durations = set(slot['duration_minutes'] for slot in self.time_slots)
        print(f"Available time slot durations: {sorted(available_durations)}")
        
        # Create a list of all time slots for systematic processing
        all_time_slots = []
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            for slot in sorted_time_slots_by_day[day]:
                all_time_slots.append(slot)
        
        # Sort time slots to ensure consistent processing - first by day, then by start time
        all_time_slots.sort(key=lambda ts: (["Monday", "Tuesday", "Wednesday", "Thursday"].index(ts['day_of_week']), ts['start_time']))
        
        # For each course and number of classes
        for course in self.courses:
            course_id = course['course_id']
            num_classes = course.get('num_classes', 1)
            course_duration = course['duration_minutes']
            
            # Debug: Print course duration
            print(f"Course {course_id} requires duration: {course_duration}")
            
            # Find matching time slots for this course
            matching_slots = [slot for slot in all_time_slots if slot['duration_minutes'] == course_duration]
            
            if not matching_slots:
                print(f"WARNING: No exact matching time slots for course {course_id} (duration: {course_duration})")
                # If no exact matches, try using all non-Friday slots as fallback
                matching_slots = [slot for slot in all_time_slots if slot['day_of_week'].lower() != 'friday']
            
            # Create variables for each class instance
            for instance in range(1, num_classes + 1):
                instance_id = f"{course_id}_{instance}"
                
                # Boolean variable to track if this course instance is scheduled
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
                    
                    # Record day variables for convenience
                    if day not in self.course_day_vars[instance_id]:
                        self.course_day_vars[instance_id][day] = self.model.NewBoolVar(
                            f"course_{instance_id}_day_{day}"
                        )

    def _add_professor_qualification_constraints(self):
        """Ensure professors are only assigned to courses they can teach"""
        for course_instance_id, prof_vars in self.course_professor_vars.items():
            course_id = course_instance_id.split('_')[0]
            
            # Each course instance must be assigned exactly one professor if scheduled
            professor_sum = []
            for prof_id, var in prof_vars.items():
                professor_sum.append(var)
            
            scheduled_var = self.course_scheduled_vars[course_instance_id]
            
            # If the course is scheduled, it must have exactly one professor
            if professor_sum:
                self.model.Add(sum(professor_sum) == scheduled_var)
            else:
                # If no qualified professors, course can't be scheduled
                self.model.Add(scheduled_var == 0)

    def _add_timeslot_scarcity_penalty(self):
        """Add penalties for using scarce time slots that match certain durations"""
        # Count how many courses require each duration
        duration_demand = {}
        for course in self.courses:
            duration = course['duration_minutes']
            duration_demand[duration] = duration_demand.get(duration, 0) + 1
        
        # Count how many time slots are available for each duration
        duration_supply = {}
        for slot in self.time_slots:
            if slot['day_of_week'].lower() != 'friday':  # Skip Friday
                duration = slot['duration_minutes']
                duration_supply[duration] = duration_supply.get(duration, 0) + 1
        
        # Calculate scarcity for each duration
        duration_scarcity = {}
        for duration, demand in duration_demand.items():
            supply = duration_supply.get(duration, 0)
            if supply > 0:
                # Higher value means more scarce
                duration_scarcity[duration] = min(3.0, demand / supply)
            else:
                duration_scarcity[duration] = 3.0  # Maximum scarcity
        
        # Store scarcity information for the objective function
        self.duration_scarcity = duration_scarcity

    def _add_time_slot_load_balancing(self):
        """Add constraints to track and balance the load across time slots"""
        # Create variables to track courses per time slot
        self.courses_per_timeslot = {}
        self.max_courses_per_timeslot = self.model.NewIntVar(0, 3, "max_courses_per_timeslot")
        
        # For each valid time slot (excluding Friday)
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            for time_slot in self.time_slots_by_day.get(day, []):
                slot_id = time_slot['timeslot_id']
                slot_key = f"{day}_{slot_id}"
                
                # Get all course variables that could be assigned to this time slot
                course_vars = []
                for course_instance_id, slot_vars in self.course_timeslot_vars.items():
                    if slot_id in slot_vars:
                        course_vars.append(slot_vars[slot_id])
                
                # Create a variable to track how many courses are assigned to this slot
                max_courses = min(len(course_vars), 3)  # At most 3 courses per slot
                self.courses_per_timeslot[slot_key] = self.model.NewIntVar(
                    0, max_courses, f"courses_at_{slot_key}"
                )
                
                # Set this variable equal to the sum of course variables
                self.model.Add(self.courses_per_timeslot[slot_key] == sum(course_vars))
                
                # Update max_courses_per_timeslot to be the maximum across all slots
                self.model.Add(self.max_courses_per_timeslot >= self.courses_per_timeslot[slot_key])
        
        # Add a constraint to limit maximum courses per timeslot to 2
        # This forces better distribution across available slots
        self.model.Add(self.max_courses_per_timeslot <= 2)

    
    def _add_professor_availability_constraints(self):
        """Ensure courses are scheduled only when professors are available"""
        for course_instance_id in self.course_scheduled_vars:
            course_id = course_instance_id.split('_')[0]
            
            # For each possible professor and time slot
            for prof_id, prof_var in self.course_professor_vars.get(course_instance_id, {}).items():
                for slot_id, slot_var in self.course_timeslot_vars.get(course_instance_id, {}).items():
                    time_slot = self.time_slot_dict[slot_id]
                    day = time_slot['day_of_week']
                    
                    # If professor is not available, course can't use this professor and time slot
                    is_available = self._is_professor_available(prof_id, slot_id, day)
                    if not is_available:
                        self.model.Add(prof_var + slot_var <= 1)
    
    def _add_multi_class_day_patterns(self):
        """Enforce specific day patterns for courses with multiple instances"""
        # Group course instances by their base course_id
        course_instances = {}
        for course_instance_id in self.course_scheduled_vars:
            course_id = course_instance_id.split('_')[0]
            instance = int(course_instance_id.split('_')[1])
            
            if course_id not in course_instances:
                course_instances[course_id] = []
            course_instances[course_id].append((course_instance_id, instance))
        
        # For each course with multiple instances
        for course_id, instances in course_instances.items():
            if len(instances) <= 1:
                continue
                
            # Sort instances by number
            instances.sort(key=lambda x: x[1])
            num_classes = len(instances)
            
            # Define valid day patterns
            valid_day_patterns = []
            if num_classes == 2:
                valid_day_patterns = [
                    ["Monday", "Wednesday"],
                    ["Tuesday", "Thursday"]
                ]
            elif num_classes == 3:
                valid_day_patterns = [
                    ["Monday", "Wednesday", "Thursday"]
                ]
            else:
                continue  # Skip if not 2 or 3 instances
            
            # Create variables for each valid pattern
            pattern_vars = []
            for pattern_idx, pattern in enumerate(valid_day_patterns):
                # Create a variable that is 1 if this pattern is chosen
                pattern_var = self.model.NewBoolVar(f"pattern_{course_id}_{pattern_idx}")
                pattern_vars.append(pattern_var)
                
                # For each day in the pattern
                for i, day in enumerate(pattern):
                    # Get the instance for this position
                    if i < len(instances):
                        instance_id = instances[i][0]
                        
                        # For this instance, create implications for each day
                        for check_day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
                            # Skip if day not in course_day_vars
                            if check_day not in self.course_day_vars.get(instance_id, {}):
                                continue
                                
                            day_var = self.course_day_vars[instance_id][check_day]
                            
                            # If pattern is chosen, this instance must be on the correct day
                            if check_day == day:
                                self.model.AddImplication(pattern_var, day_var)
                            else:
                                # If pattern is chosen, this instance cannot be on other days
                                self.model.AddImplication(pattern_var, day_var.Not())
            
            # Exactly one pattern must be chosen if course is scheduled
            if pattern_vars:
                first_instance_id = instances[0][0]
                scheduled_var = self.course_scheduled_vars[first_instance_id]
                
                # If any instance is scheduled, a pattern must be chosen
                self.model.Add(sum(pattern_vars) == scheduled_var)
                
                # Ensure all instances of a course have the same scheduled status
                for i in range(1, len(instances)):
                    instance_id = instances[i][0]
                    self.model.Add(self.course_scheduled_vars[instance_id] == scheduled_var)

    def _add_time_slot_consistency(self):
        """Ensure all instances of a course use the same time slot number"""
        # Group time slots by their number
        time_slot_groups = {}
        for slot_id, slot in self.time_slot_dict.items():
            # Extract the time slot number (TS1, TS2, etc.)
            slot_num = slot_id.split('-')[0]
            if slot_num not in time_slot_groups:
                time_slot_groups[slot_num] = []
            time_slot_groups[slot_num].append(slot_id)
        
        # Group course instances by their base course_id
        course_instances = {}
        for course_instance_id in self.course_scheduled_vars:
            course_id = course_instance_id.split('_')[0]
            instance = int(course_instance_id.split('_')[1])
            
            if course_id not in course_instances:
                course_instances[course_id] = []
            course_instances[course_id].append((course_instance_id, instance))
        
        # For each course with multiple instances
        for course_id, instances in course_instances.items():
            if len(instances) <= 1:
                continue
            
            # Create variables for each time slot number
            slot_num_vars = {}
            for slot_num in time_slot_groups:
                slot_num_var = self.model.NewBoolVar(f"course_{course_id}_slot_num_{slot_num}")
                slot_num_vars[slot_num] = slot_num_var
                
                # For each instance of this course
                for instance_id, _ in instances:
                    # Get the slot variables for this time slot number
                    instance_slot_vars = []
                    for slot_id in time_slot_groups[slot_num]:
                        if slot_id in self.course_timeslot_vars.get(instance_id, {}):
                            instance_slot_vars.append(self.course_timeslot_vars[instance_id][slot_id])
                    
                    if instance_slot_vars:
                        # Get the scheduled variable for this instance
                        scheduled_var = self.course_scheduled_vars[instance_id]
                        
                        # Create a variable that is 1 if both slot_num_var and scheduled_var are 1
                        slot_scheduled_var = self.model.NewBoolVar(f"slot_{slot_num}_scheduled_{instance_id}")
                        self.model.AddBoolAnd([slot_num_var, scheduled_var]).OnlyEnforceIf(slot_scheduled_var)
                        self.model.AddBoolOr([slot_num_var.Not(), scheduled_var.Not()]).OnlyEnforceIf(slot_scheduled_var.Not())
                        
                        # If slot_scheduled_var is 1, exactly one of the instance_slot_vars must be 1
                        # If slot_scheduled_var is 0, all of the instance_slot_vars must be 0
                        self.model.Add(sum(instance_slot_vars) == slot_scheduled_var)
                        
                        # Additionally, if the course is scheduled but this slot number is not chosen,
                        # then none of the time slots in this group can be chosen
                        not_this_slot_but_scheduled = self.model.NewBoolVar(f"not_slot_{slot_num}_but_scheduled_{instance_id}")
                        self.model.AddBoolAnd([slot_num_var.Not(), scheduled_var]).OnlyEnforceIf(not_this_slot_but_scheduled)
                        self.model.AddBoolOr([slot_num_var, scheduled_var.Not()]).OnlyEnforceIf(not_this_slot_but_scheduled.Not())
                        
                        # If not_this_slot_but_scheduled is 1, all instance_slot_vars must be 0
                        for var in instance_slot_vars:
                            self.model.AddImplication(not_this_slot_but_scheduled, var.Not())
            
            # Ensure all instances of a course have the same scheduled status
            first_instance_scheduled = self.course_scheduled_vars[instances[0][0]]
            for i in range(1, len(instances)):
                instance_id = instances[i][0]
                self.model.Add(self.course_scheduled_vars[instance_id] == first_instance_scheduled)
            
            # If the course is scheduled, exactly one time slot number must be chosen
            if slot_num_vars:
                first_instance_scheduled = self.course_scheduled_vars[instances[0][0]]
                self.model.Add(sum(slot_num_vars.values()) == first_instance_scheduled)

    def _add_professor_conflict_constraints(self):
        """Prevent professors from teaching multiple courses at the same time"""
        # Group course instances by time slot
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            for time_slot in self.time_slots_by_day.get(day, []):
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

    def _add_consecutive_slot_constraints(self):
        """Prevent professors from teaching in consecutive time slots"""
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
            day_slots = sorted(
                self.time_slots_by_day.get(day, []),
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
                                
                                # This variable is 1 if the course is assigned to this professor and time slot 1
                                assignment_var1 = self.model.NewBoolVar(
                                    f"prof_{prof_id}_slot_{slot1_id}_course_{course_instance_id}"
                                )
                                self.model.AddBoolAnd([prof_var, slot1_var]).OnlyEnforceIf(assignment_var1)
                                self.model.AddBoolOr([prof_var.Not(), slot1_var.Not()]).OnlyEnforceIf(assignment_var1.Not())
                                
                                courses_at_slot1.append(assignment_var1)
                            
                            if slot2_id in slot_vars:
                                slot2_var = slot_vars[slot2_id]
                                
                                # This variable is 1 if the course is assigned to this professor and time slot 2
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
    
    def _add_time_slot_duration_constraints(self):
        """Ensure courses are assigned to time slots with matching duration"""
        # This is handled during variable creation - we only create time slot variables
        # for slots with matching duration
        pass
    
    def _add_day_pattern_constraints(self):
        """Enforce valid day patterns for multi-class courses"""
        # Group course instances by course
        course_instances = {}
        for course_instance_id in self.course_scheduled_vars:
            course_id = course_instance_id.split('_')[0]
            instance = int(course_instance_id.split('_')[1])
            
            if course_id not in course_instances:
                course_instances[course_id] = []
            course_instances[course_id].append((course_instance_id, instance))
        
        # For each course with multiple instances
        for course_id, instances in course_instances.items():
            if len(instances) > 1:
                # Sort by instance number
                instances.sort(key=lambda x: x[1])
                
                # Get the number of classes
                num_classes = len(instances)
                
                # Define valid day patterns
                valid_patterns = []
                if num_classes == 2:
                    valid_patterns = [
                        ["Monday", "Wednesday"],
                        ["Tuesday", "Thursday"]
                    ]
                elif num_classes == 3:
                    valid_patterns = [
                        ["Monday", "Wednesday", "Thursday"]
                    ]
                
                # Enforce valid day patterns
                for pattern in valid_patterns:
                    # Create a variable that is 1 if this pattern is chosen
                    pattern_var = self.model.NewBoolVar(f"pattern_{course_id}_{'-'.join(pattern)}")
                    
                    # Create implications: If pattern is chosen, each instance must be on the correct day
                    for i, (instance_id, _) in enumerate(instances):
                        if i < len(pattern):
                            day = pattern[i]
                            day_var = self.course_day_vars[instance_id][day]
                            
                            # If pattern is chosen, this instance must be on this day
                            self.model.AddImplication(pattern_var, day_var)
                            
                            # If pattern is chosen, this instance cannot be on other days
                            for other_day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
                                if other_day != day:
                                    other_day_var = self.course_day_vars[instance_id][other_day]
                                    self.model.AddImplication(pattern_var, other_day_var.Not())
                
                # At least one valid pattern must be chosen
                self.model.Add(sum(pattern_var for pattern in valid_patterns) == 1)
                
                # Link day variables to time slot variables
                for instance_id, _ in instances:
                    for day in ["Monday", "Tuesday", "Wednesday", "Thursday"]:
                        day_var = self.course_day_vars[instance_id][day]
                        
                        # Get all time slots for this day
                        day_slots = [
                            slot_id for slot_id, slot in self.time_slot_dict.items() 
                            if slot['day_of_week'] == day
                        ]
                        
                        # If this day is chosen, one of its time slots must be chosen
                        day_slot_vars = []
                        for slot_id in day_slots:
                            if slot_id in self.course_timeslot_vars[instance_id]:
                                day_slot_vars.append(self.course_timeslot_vars[instance_id][slot_id])
                        
                        if day_slot_vars:
                            self.model.Add(sum(day_slot_vars) == day_var)
                        else:
                            # If no time slots available for this day, it can't be chosen
                            self.model.Add(day_var == 0)
    
    def _add_time_slot_consistency_constraints(self):
        """Ensure all instances of a multi-class course use the same time slot number"""
        # Group course instances by course
        course_instances = {}
        for course_instance_id in self.course_scheduled_vars:
            course_id = course_instance_id.split('_')[0]
            instance = int(course_instance_id.split('_')[1])
            
            if course_id not in course_instances:
                course_instances[course_id] = []
            course_instances[course_id].append((course_instance_id, instance))
        
        # For each course with multiple instances
        for course_id, instances in course_instances.items():
            if len(instances) > 1:
                # Group time slots by their number (e.g., TS1, TS2)
                time_slot_groups = {}
                for slot_id, slot in self.time_slot_dict.items():
                    # Extract time slot number from ID (e.g., TS1-MON -> 1)
                    match = slot_id.split('-')[0]
                    slot_num = match
                    
                    if slot_num not in time_slot_groups:
                        time_slot_groups[slot_num] = []
                    time_slot_groups[slot_num].append(slot_id)
                
                # For each time slot number
                for slot_num, slot_ids in time_slot_groups.items():
                    # Create a variable that is 1 if this time slot number is chosen
                    slot_num_var = self.model.NewBoolVar(f"course_{course_id}_slot_num_{slot_num}")
                    
                    # For each instance
                    for instance_id, _ in instances:
                        # Get all variables for this instance and slot number
                        instance_slot_vars = [
                            self.course_timeslot_vars[instance_id][slot_id]
                            for slot_id in slot_ids
                            if slot_id in self.course_timeslot_vars[instance_id]
                        ]
                        
                        if instance_slot_vars:
                            # If this slot number is chosen, exactly one of its time slots must be chosen
                            self.model.Add(sum(instance_slot_vars) == slot_num_var)
                            
                            # If this slot number is not chosen, none of its time slots can be chosen
                            for var in instance_slot_vars:
                                self.model.AddImplication(slot_num_var.Not(), var.Not())
                
                # Exactly one time slot number must be chosen
                self.model.Add(sum(slot_num_var for slot_num in time_slot_groups) == 1)
    
    def _add_core_course_separation_constraints(self):
        """Try to separate core courses into different time slots when possible"""
        # This is a soft constraint implemented in the objective function
        pass

    def _add_day_distribution_constraints(self):
        """Balance course distribution across days"""
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday"]
        
        # Count courses per day
        day_counts = {}
        for day in valid_days:
            day_counts[day] = self.model.NewIntVar(0, len(self.courses) * 3, f"day_count_{day}")
            
            # Sum courses assigned to this day
            day_course_vars = []
            for course_instance_id in self.course_scheduled_vars:
                if day in self.course_day_vars[course_instance_id]:
                    day_course_vars.append(self.course_day_vars[course_instance_id][day])
            
            self.model.Add(day_counts[day] == sum(day_course_vars))
        
        # Track max and min counts for measuring imbalance
        max_day_count = self.model.NewIntVar(0, len(self.courses) * 3, "max_day_count")
        min_day_count = self.model.NewIntVar(0, len(self.courses) * 3, "min_day_count")
        
        # Set max_day_count to be the maximum of all day counts
        for day in valid_days:
            self.model.Add(max_day_count >= day_counts[day])
        
        # Set min_day_count to be the minimum of all day counts
        for day in valid_days:
            self.model.Add(min_day_count <= day_counts[day])
        
        # Create imbalance variable (max - min)
        # Store as instance variable to be accessible in _add_objective_function
        self.day_imbalance = self.model.NewIntVar(0, len(self.courses) * 3, "day_imbalance")
        self.model.Add(self.day_imbalance == max_day_count - min_day_count)
        
        # Limit imbalance to at most 2 courses
        self.model.Add(self.day_imbalance <= 2)

    def _add_objective_function(self):
        """Define the objective function for optimization"""
        # Maximize the number of scheduled courses, with higher weight for core courses
        objective_terms = []
        
        for course_instance_id, scheduled_var in self.course_scheduled_vars.items():
            course_id = course_instance_id.split('_')[0]
            course = self.course_dict[course_id]
            
            # Higher weight for core courses
            weight = 2 if course.get('is_core', False) else 1
            objective_terms.append(scheduled_var * weight)
        
        # Minimize day imbalance (with negative coefficient)
        objective_terms.append(self.day_imbalance * -5)  # Higher weight for balanced days
        
        self.model.Maximize(sum(objective_terms))

    def _extract_solution(self, solver, status, solve_time):
        """Extract the solution from the solved model"""
        result = {
            "success": True,
            "result": {
                "scheduled_courses": [],
                "conflicts": [],
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
        
        for course in self.courses:
            if course.get('is_core', False):
                core_total += 1
        
        for course_instance_id, scheduled_var in self.course_scheduled_vars.items():
            if solver.Value(scheduled_var) == 1:
                course_id = course_instance_id.split('_')[0]
                instance = int(course_instance_id.split('_')[1])
                course = self.course_dict[course_id]
                
                # Find assigned professor
                assigned_prof_id = None
                for prof_id, prof_var in self.course_professor_vars[course_instance_id].items():
                    if solver.Value(prof_var) == 1:
                        assigned_prof_id = prof_id
                        break
                
                # Find assigned time slot
                assigned_slot_id = None
                assigned_day = None
                
                for slot_id, slot_var in self.course_timeslot_vars[course_instance_id].items():
                    if solver.Value(slot_var) == 1:
                        assigned_slot_id = slot_id
                        assigned_day = self.time_slot_dict[slot_id]['day_of_week']
                        break
                
                if assigned_prof_id and assigned_slot_id:
                    scheduled_count += 1
                    if course.get('is_core', False):
                        core_scheduled += 1
                    
                    # Track courses by time slot for conflict detection
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
                        "class_instance": instance,
                        "num_classes": course.get('num_classes', 1),
                        "course_data": course,
                        "professor_data": self.professor_dict.get(assigned_prof_id, {}),
                        "time_slot_data": self.time_slot_dict.get(assigned_slot_id, {})
                    })
        
        # Check for conflicts
        conflict_id = 1
        
        # Check for time slot conflicts (multiple core courses in the same time slot)
        for slot_key, courses in courses_by_timeslot.items():
            core_courses = [c for c in courses if c["is_core"]]
            if len(core_courses) > 1:
                day, slot_id = slot_key.split('_')
                
                result["result"]["conflicts"].append({
                    "conflict": {
                        "conflict_id": f"CONF-{conflict_id:08d}",
                        "schedule_id": self.schedule_id,
                        "timeslot_id": slot_id,
                        "day_of_week": day,
                        "conflict_type": "TIME_SLOT_CONFLICT",
                        "description": f"Multiple core courses scheduled at the same time slot: {', '.join([c['course_id'] for c in core_courses])}",
                        "is_resolved": False
                    },
                    "scheduled_courses": [
                        next((sc for sc in result["result"]["scheduled_courses"] 
                              if sc["course_id"] == c["course_id"] and sc["day_of_week"] == day and sc["timeslot_id"] == slot_id), None)
                        for c in core_courses
                    ],
                    "conflict_courses": [
                        {"conflict_course_id": f"CC-{conflict_id:08d}-{i+1}", 
                         "conflict_id": f"CONF-{conflict_id:08d}",
                         "scheduled_course_id": f"SC-{c['course_instance_id']}"}
                        for i, c in enumerate(core_courses)
                    ]
                })
                
                conflict_id += 1
        
        # Check for professor conflicts (same professor teaching multiple courses at once)
        for slot_key, professors in professors_by_timeslot.items():
            for prof_id, courses in professors.items():
                if len(courses) > 1:
                    day, slot_id = slot_key.split('_')
                    
                    result["result"]["conflicts"].append({
                        "conflict": {
                            "conflict_id": f"CONF-{conflict_id:08d}",
                            "schedule_id": self.schedule_id,
                            "timeslot_id": slot_id,
                            "day_of_week": day,
                            "conflict_type": "TIME_SLOT_CONFLICT",
                            "description": f"Professor {prof_id} is scheduled to teach multiple courses at the same time",
                            "is_resolved": False
                        },
                        "scheduled_courses": [
                            next((sc for sc in result["result"]["scheduled_courses"] 
                                  if sc["course_id"] == c.split('_')[0] and sc["day_of_week"] == day and sc["timeslot_id"] == slot_id), None)
                            for c in courses
                        ],
                        "conflict_courses": [
                             # Check for professor conflicts (continued)
                            {"conflict_course_id": f"CC-{conflict_id:08d}-{i+1}", 
                             "conflict_id": f"CONF-{conflict_id:08d}",
                             "scheduled_course_id": f"SC-{c}"}
                            for i, c in enumerate(courses)
                        ]
                    })
                    
                    conflict_id += 1
        
        # Check for unscheduled courses
        unscheduled_courses = []
        for course in self.courses:
            course_id = course['course_id']
            num_classes = course.get('num_classes', 1)
            
            scheduled_instances = 0
            for instance in range(1, num_classes + 1):
                instance_id = f"{course_id}_{instance}"
                if instance_id in self.course_scheduled_vars and self.solver.Value(self.course_scheduled_vars[instance_id]) == 1:
                    scheduled_instances += 1
            
            if scheduled_instances < num_classes:
                unscheduled_courses.append(course)
                
                # Create NO_AVAILABLE_SLOT conflict for each unscheduled instance
                for instance in range(scheduled_instances + 1, num_classes + 1):
                    instance_id = f"{course_id}_{instance}"

                    # Find a qualified professor for this course
                    qualified_prof = None
                    for prof in self.professors:
                        if self._can_professor_teach_course(prof['professor_id'], course_id):
                            qualified_prof = prof['professor_id']
                            break

                    result["result"]["conflicts"].append({
                        "conflict": {
                            "conflict_id": f"CONF-{conflict_id:08d}",
                            "schedule_id": self.schedule_id,
                            "timeslot_id": "TS1-MON",  # Default
                            "day_of_week": "Monday",   # Default
                            "conflict_type": "NO_AVAILABLE_SLOT",
                            "description": f"Could not schedule course {course_id} (instance {instance}) due to constraints",
                            "is_resolved": False
                        },
                        "scheduled_course": {
                            "scheduled_course_id": f"SC-{instance_id}",
                            "schedule_id": self.schedule_id,
                            "course_id": course_id,
                            "professor_id": qualified_prof if qualified_prof else "UNASSIGNED",  # Default value
                            "timeslot_id": "TS1-MON",   # Default value
                            "day_of_week": "Monday",    # Default value
                            "is_override": False,
                            "class_instance": instance,
                            "num_classes": num_classes
                        },
                        "conflict_course": {
                            "conflict_course_id": f"CC-{conflict_id:08d}",
                            "conflict_id": f"CONF-{conflict_id:08d}",
                            "scheduled_course_id": f"SC-{instance_id}"
                        }
                    })
                                        
                    conflict_id += 1
        
        # Update statistics
        result["result"]["statistics"].update({
            "total_courses": len(self.courses),
            "scheduled_courses": scheduled_count,
            "unscheduled_courses": len(unscheduled_courses),
            "unresolved_conflicts": len(result["result"]["conflicts"]),
            "core_courses": core_total,
            "core_courses_scheduled": core_scheduled
        })
        
        # Count courses by day for statistics
        day_counts = {}
        for sc in result["result"]["scheduled_courses"]:
            day = sc["day_of_week"]
            day_counts[day] = day_counts.get(day, 0) + 1
        
        result["result"]["statistics"]["courses_by_day"] = day_counts
        
        return result

    def _add_simple_objective(self, model):
        """Define an enhanced objective function that balances course scheduling with distribution"""
        objective_terms = []

        # Maximize scheduled courses, with higher weight for core courses
        for course_instance_id, scheduled_var in self.course_scheduled_vars.items():
            course_id = course_instance_id.split('_')[0]
            course = self.course_dict[course_id]
            
            # Higher weight for core courses
            weight = 2 if course.get('is_core', False) else 1
            objective_terms.append(scheduled_var * weight)
        
        # Minimize day imbalance (with negative coefficient)
        if hasattr(self, 'day_imbalance'):
            # Higher weight to prioritize balanced days
            objective_terms.append(self.day_imbalance * -5)
        
        # Minimize the maximum number of courses per timeslot
        # Add a stronger penalty for timeslot clustering
        if hasattr(self, 'max_courses_per_timeslot'):
            objective_terms.append(self.max_courses_per_timeslot * -8)
        
        # Add penalties for using scarce time slots
        if hasattr(self, 'duration_scarcity'):
            for course_instance_id, slot_vars in self.course_timeslot_vars.items():
                course_id = course_instance_id.split('_')[0]
                course_duration = self.course_dict[course_id]['duration_minutes']
                scarcity = self.duration_scarcity.get(course_duration, 1.0)
                
                for slot_id, slot_var in slot_vars.items():
                    # Multiply by scarcity to prioritize using less scarce time slots
                    # Slight negative weight to discourage using scarce slots
                    objective_terms.append(slot_var * -0.5 * scarcity)
        
        model.Maximize(sum(objective_terms))
        
    def _report_infeasibility(self, status, solve_time):
        """Report why the model is infeasible"""
        # Check if there are any courses with no available time slots
        courses_without_slots = []
        for course in self.courses:
            course_id = course['course_id']
            course_duration = course['duration_minutes']
            matching_slots = [
                slot for slot in self.time_slots 
                if slot['duration_minutes'] == course_duration
            ]
            if not matching_slots:
                courses_without_slots.append({
                    "course_id": course_id,
                    "duration": course_duration,
                    "available_durations": list(set(slot['duration_minutes'] for slot in self.time_slots))
                })


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
                    "department_id": course.get('department_id'),
                    "available_departments": list(set(p.get('department_id') for p in self.professors))
                })
        """Report why the model is infeasible"""
        return {
            "success": False,
            "error": f"The scheduling problem is infeasible or could not be solved within the time limit",
            "debug_info": {
                "num_courses": len(self.courses),
                "num_professors": len(self.professors),
                "num_time_slots": len(self.time_slots)
            },
            "status": self._get_status_string(status),
            "solver_time": solve_time
        }
        
    def _get_status_string(self, status):
        """Convert solver status to string representation"""
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
        """Check if a professor can teach a course based on qualifications"""
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
        """Check if a professor is available at a given time slot"""
        # If we have availability data, use it
        if professor_id in self.professor_availability:
            if day in self.professor_availability[professor_id]:
                return timeslot_id in self.professor_availability[professor_id][day]
            return False
        
        # Otherwise, assume professors are available at all times
        return True