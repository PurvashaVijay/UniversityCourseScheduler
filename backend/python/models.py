"""
Python class representations of the database entities
"""

class Course:
    """Representation of a course"""
    def __init__(self, data):
        self.course_id = data.get('course_id')
        self.department_id = data.get('department_id')
        self.course_name = data.get('course_name')
        self.duration_minutes = data.get('duration_minutes')
        self.is_core = data.get('is_core', False)
        self.program_ids = data.get('program_ids', [])
        self.num_classes = data.get('num_classes', 1)
        
    def __str__(self):
        return f"Course {self.course_id}: {self.course_name} ({self.duration_minutes} min)"

class Professor:
    """Representation of a professor"""
    def __init__(self, data):
        self.professor_id = data.get('professor_id')
        self.department_id = data.get('department_id')
        self.first_name = data.get('first_name')
        self.last_name = data.get('last_name') 
        self.email = data.get('email')
        
    def __str__(self):
        return f"Professor {self.professor_id}: {self.first_name} {self.last_name}"

class TimeSlot:
    """Representation of a time slot"""
    def __init__(self, data):
        self.timeslot_id = data.get('timeslot_id')
        self.name = data.get('name')
        self.start_time = data.get('start_time')
        self.end_time = data.get('end_time')
        self.duration_minutes = data.get('duration_minutes')
        self.day_of_week = data.get('day_of_week')
        
    def __str__(self):
        return f"TimeSlot {self.timeslot_id}: {self.day_of_week} {self.start_time}-{self.end_time} ({self.duration_minutes} min)"

class ProfessorAvailability:
    """Representation of a professor's availability"""
    def __init__(self, data):
        self.availability_id = data.get('availability_id')
        self.professor_id = data.get('professor_id')
        self.timeslot_id = data.get('timeslot_id')
        self.day_of_week = data.get('day_of_week')
        self.is_available = data.get('is_available', True)
        
    def __str__(self):
        return f"Availability: Professor {self.professor_id} on {self.day_of_week} at {self.timeslot_id} - {'Available' if self.is_available else 'Unavailable'}"

class CourseProgram:
    """Representation of a course-program relationship"""
    def __init__(self, data):
        self.course_program_id = data.get('course_program_id')
        self.course_id = data.get('course_id')
        self.program_id = data.get('program_id')
        self.is_required = data.get('is_required', False)
        self.num_classes = data.get('num_classes', 1)
        
    def __str__(self):
        return f"CourseProgram: Course {self.course_id} in Program {self.program_id} - {'Required' if self.is_required else 'Elective'}, {self.num_classes} classes"

class ScheduledCourse:
    """Representation of a scheduled course"""
    def __init__(self, data):
        self.scheduled_course_id = data.get('scheduled_course_id')
        self.schedule_id = data.get('schedule_id')
        self.course_id = data.get('course_id')
        self.professor_id = data.get('professor_id')
        self.timeslot_id = data.get('timeslot_id')
        self.day_of_week = data.get('day_of_week')
        self.is_override = data.get('is_override', False)
        self.class_instance = data.get('class_instance', 1)
        self.num_classes = data.get('num_classes', 1)
        
    def __str__(self):
        return f"ScheduledCourse: {self.course_id} on {self.day_of_week} at {self.timeslot_id} with Professor {self.professor_id}"

class Conflict:
    """Representation of a scheduling conflict"""
    def __init__(self, data):
        self.conflict_id = data.get('conflict_id')
        self.schedule_id = data.get('schedule_id')
        self.timeslot_id = data.get('timeslot_id')
        self.day_of_week = data.get('day_of_week')
        self.conflict_type = data.get('conflict_type')
        self.description = data.get('description')
        self.is_resolved = data.get('is_resolved', False)
        
    def __str__(self):
        return f"Conflict {self.conflict_id}: {self.conflict_type} - {self.description}"