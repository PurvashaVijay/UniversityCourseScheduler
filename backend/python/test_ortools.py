# test_ortools.py
try:
    from ortools.sat.python import cp_model
    print("OR-Tools is installed and working!")
    
    # Create a simple model
    model = cp_model.CpModel()
    print("Successfully created a CP model")
except ImportError as e:
    print(f"Error importing OR-Tools: {e}")