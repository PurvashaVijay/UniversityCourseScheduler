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
        data = json.loads(input_json)
        
        # Initialize the scheduler
        scheduler = CourseScheduler(data)
        
        # Build and solve the model
        scheduler.build_model()
        solution = scheduler.solve()
        
        # Return the solution as JSON
        return json.dumps({
            "success": True,
            "result": solution
        })
    except Exception as e:
        # Capture and return any errors
        error_traceback = traceback.format_exc()
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