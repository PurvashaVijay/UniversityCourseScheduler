#!/usr/bin/env python3
"""
Scheduler Interface - A simple script to run the course scheduler
This script is called by the Node.js backend
"""
import json
import sys
import traceback
from course_scheduler import CourseScheduler

def run_scheduler(input_json):
    """Run the scheduler with the given input JSON"""
    try:
        # Parse the input data
        print(f"Received data of length: {len(input_json)}", file=sys.stderr)
        data = json.loads(input_json)

        # Log input data summary for debugging
        print(f"Processing schedule for ID: {data.get('scheduleId')}", file=sys.stderr)
        print(f"Data contains: {len(data.get('courses', []))} courses, " + 
            f"{len(data.get('professors', []))} professors, " +
            f"{len(data.get('timeSlots', []))} time slots", file=sys.stderr)
        
        # Initialize the scheduler
        scheduler = CourseScheduler(data)
        
        # Build and solve the model
        scheduler.build_model()
        solution = scheduler.solve()
        
        # Return the solution as JSON
        result = {
            "success": True,
            "result": solution
        }
        return json.dumps(result)
    except Exception as e:
        # Capture and return any errors
        error_traceback = traceback.format_exc()
        print(f"Error in scheduler: {str(e)}", file=sys.stderr)
        print(error_traceback, file=sys.stderr)
        return json.dumps({
            "success": False,
            "error": str(e),
            "traceback": error_traceback
        })

if __name__ == "__main__":
    # Read input from stdin (for Node.js to pipe data in)
    input_json = sys.stdin.read()
    
    # Run the scheduler
    output_json = run_scheduler(input_json)
    
    # Output the result to stdout (for Node.js to capture)
    print(output_json)