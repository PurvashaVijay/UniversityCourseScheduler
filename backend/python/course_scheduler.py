#!/usr/bin/env python3
"""
Course Scheduler using Google OR-Tools
This script takes JSON input data and generates an optimal course schedule
"""
import json
import sys
import uuid
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
        self.schedule_id = data['scheduleId']
        
        # Create lookup dictionaries for faster access
        self.course_dict = {course['course_id']: course for course in self.courses}
        self.professor_dict = {prof['professor_id']: prof for prof in self.professors}
        self.time_slot_dict = {slot['timeslot_id']: slot for slot in self.time_slots}
        
        # Group availability by professor
        self.availability_by_professor = {}
        for avail in self.professor_availability:
            prof_id = avail['professor_id']
            if prof_id not in self.availability_by_professor:
                self.availability_by_professor[prof_id] = []
            self.availability_by_professor[prof_id].append(avail)

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
        
        # Set objective function
        self.set_objective()
    
    def create_variables(self):
        """Create the decision variables for the model"""
        self.course_professor = {}  # course_id -> professor_id assignment
        self.course_time_slot = {}  # course_id -> time_slot_id assignment
        self.course_day = {}        # course_id -> day_of_week assignment
        
        # Create course to professor assignment variables
        for course in self.courses:
            course_id = course['course_id']
            self.course_professor[course_id] = {}
            
            for prof in self.professors:
                prof_id = prof['professor_id']
                # A boolean variable that is 1 if course is assigned to professor
                self.course_professor[course_id][prof_id] = self.model.NewBoolVar(
                    f'course_{course_id}_prof_{prof_id}')
        
        # Create course to time slot assignment variables
        for course in self.courses:
            course_id = course['course_id']
            self.course_time_slot[course_id] = {}
            self.course_day[course_id] = {}
            
            for ts in self.time_slots:
                time_id = ts['timeslot_id']
                day = ts['day_of_week']
                
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
    
    def add_professor_assignment_constraints(self):
        """Add constraints for professor assignments"""
        # Each course must be assigned to exactly one professor
        for course in self.courses:
            course_id = course['course_id']
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
        # Each course must be assigned to exactly one time slot if it's scheduled
        for course in self.courses:
            course_id = course['course_id']
            
            # Link course_scheduled to the sum of time slot assignments
            time_slot_sum = sum(self.course_time_slot[course_id].values())
            self.model.Add(time_slot_sum == 1).OnlyEnforceIf(self.course_scheduled[course_id])
            self.model.Add(time_slot_sum == 0).OnlyEnforceIf(self.course_scheduled[course_id].Not())
            
            # Link day variables to time slot assignments
            for ts in self.time_slots:
                time_id = ts['timeslot_id']
                day = ts['day_of_week']
                
                # If this time slot is assigned, the corresponding day must be assigned
                self.model.AddImplication(
                    self.course_time_slot[course_id][time_id], 
                    self.course_day[course_id][day])
        
        # Ensure a course is only assigned one day (derived from time slot)
        for course in self.courses:
            course_id = course['course_id']
            
            # At most one day can be assigned to a course
            self.model.Add(sum(self.course_day[course_id].values()) <= 1)
            
            # If a course is scheduled, exactly one day must be assigned
            self.model.Add(sum(self.course_day[course_id].values()) == 1).OnlyEnforceIf(
                self.course_scheduled[course_id])
    
    def add_professor_availability_constraints(self):
        """Add constraints for professor availability"""
        for course in self.courses:
            course_id = course['course_id']
            
            for prof in self.professors:
                prof_id = prof['professor_id']
                
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
                
                # If the time slot duration doesn't match the course duration (within 10 min),
                # the course cannot be assigned to this time slot
                if abs(slot_duration - course_duration) > 10:
                    self.model.Add(self.course_time_slot[course_id][time_id] == 0)
    
    def add_core_course_priority_constraints(self):
        """Add constraints to prioritize core courses"""
        # Create variables to track conflicts between core courses
        core_conflicts = []
        core_courses = [c for c in self.courses if c['is_core']]
        
        # Prevent conflicts between core courses
        for i, course1 in enumerate(core_courses):
            for course2 in core_courses[i+1:]:
                course1_id = course1['course_id']
                course2_id = course2['course_id']
                
                # For each time slot
                for ts in self.time_slots:
                    time_id = ts['timeslot_id']
                    
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
                    
                    core_conflicts.append(conflict)
        
        # We want no conflicts between core courses
        self.model.Add(sum(core_conflicts) == 0)
    
    def add_cross_program_course_constraints(self):
        """Add constraints for cross-program courses"""
        # Group courses by their cross-program relationships
        # This would require additional data that isn't fully represented in the schema
        # For now, we'll implement a placeholder that can be expanded later
        
        # Cross-program courses with a single section must be at the same time across programs
        # For courses with multiple sections, we would need section identifiers
        pass
    
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
        
        # The objective is to maximize the weighted sum of scheduled courses
        objective_terms = []
        for course_id, weight in course_weights.items():
            objective_terms.append(weight * self.course_scheduled[course_id])
        
        self.model.Maximize(sum(objective_terms))
    
    def solve(self):
        """Solve the constraint programming model"""
        self.solver = cp_model.CpSolver()
        self.solver.parameters.max_time_in_seconds = 120  # Set a time limit
        
        self.status = self.solver.Solve(self.model)
        
        if self.status == cp_model.OPTIMAL or self.status == cp_model.FEASIBLE:
            return self.extract_solution()
        else:
            return {"error": "No feasible solution found"}
    
    def extract_solution(self):
        """Extract the solution from the solved model"""
        scheduled_courses = []
        conflicts = []
        
        # Process each course
        for course in self.courses:
            course_id = course['course_id']
            
            # Check if the course was scheduled
            if self.solver.Value(self.course_scheduled[course_id]):
                # Find which professor was assigned
                assigned_prof_id = None
                for prof_id, var in self.course_professor[course_id].items():
                    if self.solver.Value(var):
                        assigned_prof_id = prof_id
                        break
                
                # Find which time slot was assigned
                assigned_time_id = None
                for time_id, var in self.course_time_slot[course_id].items():
                    if self.solver.Value(var):
                        assigned_time_id = time_id
                        break
                
                # Find the day of week from the time slot
                day_of_week = self.time_slot_dict[assigned_time_id]['day_of_week']
                
                # Create a scheduled course entry
                scheduled_course = {
                    "scheduled_course_id": f"SC-{str(uuid.uuid4())[:8]}",
                    "schedule_id": self.schedule_id,
                    "course_id": course_id,
                    "professor_id": assigned_prof_id,
                    "timeslot_id": assigned_time_id,
                    "day_of_week": day_of_week,
                    "is_override": False,
                    "course_data": course,
                    "professor_data": self.professor_dict[assigned_prof_id],
                    "time_slot_data": self.time_slot_dict[assigned_time_id]
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
                
                # Randomly select a professor (matching original logic)
                import random
                random_prof = random.choice(self.professors)
                random_prof_id = random_prof['professor_id']
                
                # Create conflict record
                conflict = {
                    "conflict_id": conflict_id,
                    "schedule_id": self.schedule_id,
                    "timeslot_id": default_time_id,
                    "day_of_week": default_day,
                    "conflict_type": "NO_AVAILABLE_SLOT",
                    "description": f"No suitable time slot found for course {course['course_name']} that matches duration and professor availability",
                    "is_resolved": False
                }
                
                # Create a scheduled course for the conflict
                scheduled_course_id = f"SC-{str(uuid.uuid4())[:8]}"
                scheduled_course = {
                    "scheduled_course_id": scheduled_course_id,
                    "schedule_id": self.schedule_id,
                    "course_id": course_id,
                    "professor_id": random_prof_id,
                    "timeslot_id": default_time_id,
                    "day_of_week": default_day,
                    "is_override": False,
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
        
        return {
            "scheduled_courses": scheduled_courses,
            "conflicts": conflicts,
            "statistics": {
                "total_courses": len(self.courses),
                "scheduled_courses": len(scheduled_courses),
                "unresolved_conflicts": len(conflicts),
                "core_courses": sum(1 for c in self.courses if c['is_core']),
                "core_courses_scheduled": sum(1 for sc in scheduled_courses 
                                              if self.course_dict[sc['course_id']]['is_core']),
                "solver_status": self.get_status_string(),
                "solver_time": self.solver.WallTime()
            }
        }
    
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


if __name__ == "__main__":
    main()