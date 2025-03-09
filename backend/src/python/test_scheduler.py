#!/usr/bin/env python3
"""
Test script for the course scheduler
This allows testing the scheduler with sample data without Node.js
"""
import json
import argparse
from course_scheduler import CourseScheduler

def create_sample_data():
    """Create a sample dataset for testing"""
    return {
        "scheduleId": "SCH-12345678",
        "courses": [
            {
                "course_id": "COURSE-001",
                "course_name": "Introduction to Computer Science",
                "department_id": "DEPT-CS",
                "duration_minutes": 55,
                "is_core": True,
                "department_name": "Computer Science",
                "program_ids": ["PROG-CS-BS", "PROG-CS-MS"]
            },
            {
                "course_id": "COURSE-002",
                "course_name": "Data Structures",
                "department_id": "DEPT-CS",
                "duration_minutes": 55,
                "is_core": True,
                "department_name": "Computer Science",
                "program_ids": ["PROG-CS-BS"]
            },
            {
                "course_id": "COURSE-003",
                "course_name": "Algorithms",
                "department_id": "DEPT-CS",
                "duration_minutes": 85,
                "is_core": True,
                "department_name": "Computer Science",
                "program_ids": ["PROG-CS-MS"]
            },
            {
                "course_id": "COURSE-004",
                "course_name": "Database Systems",
                "department_id": "DEPT-CS",
                "duration_minutes": 85,
                "is_core": False,
                "department_name": "Computer Science",
                "program_ids": ["PROG-CS-BS", "PROG-CS-MS"]
            },
            {
                "course_id": "COURSE-005",
                "course_name": "Machine Learning",
                "department_id": "DEPT-CS",
                "duration_minutes": 180,
                "is_core": False,
                "department_name": "Computer Science",
                "program_ids": ["PROG-CS-MS"]
            }
        ],
        "professors": [
            {
                "professor_id": "PROF-001",
                "department_id": "DEPT-CS",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com"
            },
            {
                "professor_id": "PROF-002",
                "department_id": "DEPT-CS",
                "first_name": "Jane",
                "last_name": "Smith",
                "email": "jane.smith@example.com"
            }
        ],
        "timeSlots": [
            {
                "timeslot_id": "TS-001",
                "name": "Morning 1",
                "start_time": "09:10:00",
                "end_time": "10:05:00",
                "duration_minutes": 55,
                "day_of_week": "Monday"
            },
            {
                "timeslot_id": "TS-002",
                "name": "Morning 2",
                "start_time": "10:20:00",
                "end_time": "11:15:00",
                "duration_minutes": 55,
                "day_of_week": "Monday"
            },
            {
                "timeslot_id": "TS-003",
                "name": "Afternoon 1",
                "start_time": "12:45:00",
                "end_time": "14:05:00",
                "duration_minutes": 80,
                "day_of_week": "Monday"
            },
            {
                "timeslot_id": "TS-004",
                "name": "Evening",
                "start_time": "17:30:00",
                "end_time": "20:30:00",
                "duration_minutes": 180,
                "day_of_week": "Monday"
            },
            {
                "timeslot_id": "TS-005",
                "name": "Morning 1",
                "start_time": "09:10:00",
                "end_time": "10:05:00",
                "duration_minutes": 55,
                "day_of_week": "Tuesday"
            },
            {
                "timeslot_id": "TS-006",
                "name": "Afternoon 1",
                "start_time": "12:45:00",
                "end_time": "14:05:00",
                "duration_minutes": 80,
                "day_of_week": "Tuesday"
            }
        ],
        "professorAvailability": [
            {
                "professor_id": "PROF-001",
                "timeslot_id": "TS-001",
                "day_of_week": "Monday",
                "is_available": True
            },
            {
                "professor_id": "PROF-001",
                "timeslot_id": "TS-002",
                "day_of_week": "Monday",
                "is_available": True
            },
            {
                "professor_id": "PROF-001",
                "timeslot_id": "TS-003",
                "day_of_week": "Monday",
                "is_available": False
            },
            {
                "professor_id": "PROF-001",
                "timeslot_id": "TS-004",
                "day_of_week": "Monday",
                "is_available": True
            },
            {
                "professor_id": "PROF-001",
                "timeslot_id": "TS-005",
                "day_of_week": "Tuesday",
                "is_available": False
            },
            {
                "professor_id": "PROF-001",
                "timeslot_id": "TS-006",
                "day_of_week": "Tuesday",
                "is_available": True
            },
            {
                "professor_id": "PROF-002",
                "timeslot_id": "TS-001",
                "day_of_week": "Monday",
                "is_available": False
            },
            {
                "professor_id": "PROF-002",
                "timeslot_id": "TS-002",
                "day_of_week": "Monday",
                "is_available": True
            },
            {
                "professor_id": "PROF-002",
                "timeslot_id": "TS-003",
                "day_of_week": "Monday",
                "is_available": True
            },
            {
                "professor_id": "PROF-002",
                "timeslot_id": "TS-004",
                "day_of_week": "Monday",
                "is_available": True
            },
            {
                "professor_id": "PROF-002",
                "timeslot_id": "TS-005",
                "day_of_week": "Tuesday",
                "is_available": True
            },
            {
                "professor_id": "PROF-002",
                "timeslot_id": "TS-006",
                "day_of_week": "Tuesday",
                "is_available": False
            }
        ]
    }

def main():
    """Main function to run the test"""
    parser = argparse.ArgumentParser(description='Test the course scheduler')
    parser.add_argument('--input', help='Input JSON file (optional)')
    parser.add_argument('--output', help='Output JSON file (optional)')
    args = parser.parse_args()
    
    if args.input:
        # Load data from file
        with open(args.input, 'r') as f:
            data = json.load(f)
    else:
        # Use sample data
        data = create_sample_data()
    
    # Initialize the scheduler
    scheduler = CourseScheduler(data)
    
    # Build and solve the model
    scheduler.build_model()
    solution = scheduler.solve()
    
    # Output the solution
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(solution, f, indent=2)
    else:
        print(json.dumps(solution, indent=2))

if __name__ == "__main__":
    main()