"""
Interface script to run the CourseScheduler from Node.js

This script:
1. Reads JSON input from stdin
2. Runs the CourseScheduler with the input data
3. Returns the schedule or error as JSON to stdout
"""

import sys
import json
import traceback
# Redirect library loading messages to stderr
class StderrRedirector:
    def __init__(self, stderr):
        self.stderr = stderr
    
    def write(self, message):
        if message.startswith('load '):
            self.stderr.write(message)
        else:
            sys.__stdout__.write(message)
    
    def flush(self):
        self.stderr.flush()

# Replace standard output temporarily
sys.stdout = StderrRedirector(sys.stderr)

from course_scheduler import CourseScheduler

def main():
    try:
        # Reset stdout for normal output
        sys.stdout = sys.__stdout__
        
        # Read JSON input from stdin
        input_json = sys.stdin.read()
        data = json.loads(input_json)
        
        # Initialize and run the scheduler
        scheduler = CourseScheduler(data)
        result = scheduler.solve()
        
        # Return JSON result to stdout
        print(json.dumps(result))
        
    except Exception as e:
        # Reset stdout if it wasn't already
        sys.stdout = sys.__stdout__
        
        # Return error as JSON
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()