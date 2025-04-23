"""
Implementation of various scheduling constraints for the OR-Tools scheduler
"""

from ortools.sat.python import cp_model

class ConstraintManager:
    """Manager class for implementing and enforcing scheduling constraints"""
    
    def __init__(self, model, course_vars, professor_vars, timeslot_vars, day_vars, scheduled_vars):
        """
        Initialize the constraint manager
        
        Args:
            model: The CP-SAT model
            course_vars: Dictionary of course variables
            professor_vars: Dictionary of professor assignment variables
            timeslot_vars: Dictionary of time slot assignment variables
            day_vars: Dictionary of day assignment variables
            scheduled_vars: Dictionary of course scheduling status variables
        """
        self.model = model
        self.course_vars = course_vars
        self.professor_vars = professor_vars
        self.timeslot_vars = timeslot_vars
        self.day_vars = day_vars
        self.scheduled_vars = scheduled_vars
    
    def add_professor_qualification_constraint(self, course_instance_id, qualified_professors):
        """
        Add constraint to ensure courses are only assigned to qualified professors
        
        Args:
            course_instance_id: ID of the course instance
            qualified_professors: List of professors qualified to teach this course
        """
        # Each course must be assigned exactly one professor if scheduled
        professor_sum = []
        for prof_id in qualified_professors:
            if prof_id in self.professor_vars.get(course_instance_id, {}):
                professor_sum.append(self.professor_vars[course_instance_id][prof_id])
        
        if professor_sum:
            scheduled_var = self.scheduled_vars[course_instance_id]
            self.model.Add(sum(professor_sum) == scheduled_var)
    
    def add_professor_availability_constraint(self, course_instance_id, prof_id, slot_id, is_available):
        """
        Add constraint to ensure professors are only assigned when available
        
        Args:
            course_instance_id: ID of the course instance
            prof_id: ID of the professor
            slot_id: ID of the time slot
            is_available: Whether the professor is available
        """
        if not is_available:
            if (prof_id in self.professor_vars.get(course_instance_id, {}) and 
                slot_id in self.timeslot_vars.get(course_instance_id, {})):
                prof_var = self.professor_vars[course_instance_id][prof_id]
                slot_var = self.timeslot_vars[course_instance_id][slot_id]
                
                # Professor can't teach this course at this time slot
                self.model.Add(prof_var + slot_var <= 1)
    
    def add_professor_conflict_constraint(self, prof_id, course_time_vars):
        """
        Add constraint to prevent professors from teaching multiple courses at once
        
        Args:
            prof_id: ID of the professor
            course_time_vars: List of (course_instance_id, time_slot_var) tuples
        """
        if len(course_time_vars) <= 1:
            return
        
        # For each course instance and time slot
        for i, (course1_id, slot1_var) in enumerate(course_time_vars):
            prof1_var = self.professor_vars[course1_id][prof_id]
            
            for j, (course2_id, slot2_var) in enumerate(course_time_vars[i+1:], i+1):
                if course1_id != course2_id:
                    prof2_var = self.professor_vars[course2_id][prof_id]
                    
                    # Either the professor is not assigned to one of the courses,
                    # or the courses are not scheduled at the same time
                    self.model.Add(prof1_var + prof2_var + slot1_var + slot2_var <= 3)
    
    def add_consecutive_slot_constraint(self, prof_id, course1_id, slot1_id, course2_id, slot2_id):
        """
        Add constraint to prevent professors from teaching in consecutive slots
        
        Args:
            prof_id: ID of the professor
            course1_id: ID of the first course instance
            slot1_id: ID of the first time slot
            course2_id: ID of the second course instance
            slot2_id: ID of the second time slot
        """
        if (prof_id in self.professor_vars.get(course1_id, {}) and 
            prof_id in self.professor_vars.get(course2_id, {}) and
            slot1_id in self.timeslot_vars.get(course1_id, {}) and
            slot2_id in self.timeslot_vars.get(course2_id, {})):
            
            prof1_var = self.professor_vars[course1_id][prof_id]
            prof2_var = self.professor_vars[course2_id][prof_id]
            slot1_var = self.timeslot_vars[course1_id][slot1_id]
            slot2_var = self.timeslot_vars[course2_id][slot2_id]
            
            # Either the professor is not assigned to both courses,
            # or the courses are not scheduled in consecutive slots
            self.model.Add(prof1_var + prof2_var + slot1_var + slot2_var <= 3)
    
    def add_day_pattern_constraint(self, course_id, instances, patterns):
        """
        Add constraint to enforce valid day patterns for multi-class courses
        
        Args:
            course_id: ID of the course
            instances: List of course instance IDs
            patterns: List of valid day patterns
        """
        if len(instances) <= 1 or not patterns:
            return
        
        # Create variables for each pattern
        pattern_vars = []
        for i, pattern in enumerate(patterns):
            pattern_var = self.model.NewBoolVar(f"pattern_{course_id}_{i}")
            pattern_vars.append(pattern_var)
            
            # For each instance, constrain its day based on the pattern
            for instance_idx, instance_id in enumerate(instances):
                if instance_idx < len(pattern):
                    day = pattern[instance_idx]
                    
                    if day in self.day_vars.get(instance_id, {}):
                        day_var = self.day_vars[instance_id][day]
                        
                        # If this pattern is chosen, this instance must be on this day
                        self.model.AddImplication(pattern_var, day_var)
                        
                        # And not on other days
                        for other_day in self.day_vars.get(instance_id, {}):
                            if other_day != day:
                                other_day_var = self.day_vars[instance_id][other_day]
                                self.model.AddImplication(pattern_var, other_day_var.Not())
        
        # Exactly one pattern must be chosen
        self.model.Add(sum(pattern_vars) == 1)
    
    def add_time_slot_consistency_constraint(self, course_id, instances, slot_groups):
        """
        Add constraint to ensure all instances of a course use the same time slot
        
        Args:
            course_id: ID of the course
            instances: List of course instance IDs
            slot_groups: Dictionary of slot groups by number
        """
        if len(instances) <= 1 or not slot_groups:
            return
        
        # Create variables for each slot group
        slot_group_vars = []
        for group_name, slots in slot_groups.items():
            group_var = self.model.NewBoolVar(f"slot_group_{course_id}_{group_name}")
            slot_group_vars.append(group_var)
            
            # For each instance, constrain its time slots based on the group
            for instance_id in instances:
                # Get all slot variables in this group for this instance
                instance_slot_vars = []
                for slot_id in slots:
                    if slot_id in self.timeslot_vars.get(instance_id, {}):
                        instance_slot_vars.append(self.timeslot_vars[instance_id][slot_id])
                
                if instance_slot_vars:
                    # If this group is chosen, exactly one of its slots must be chosen
                    self.model.Add(sum(instance_slot_vars) == group_var)
        
        # Exactly one slot group must be chosen
        if slot_group_vars:
            self.model.Add(sum(slot_group_vars) == 1)
            