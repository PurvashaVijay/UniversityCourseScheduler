// ProfessorForm.tsx 
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
  Checkbox,
  FormControlLabel,
  ListItemText,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Professor } from '../../../services/professorService';
import professorService from '../../../services/professorService';
import { Department } from '../../../services/departmentService';
import { Course } from '../../../services/courseService';
import { SelectChangeEvent } from '@mui/material/Select';

interface ProfessorFormProps {
  open: boolean;
  professor: Professor | null;
  departments: Department[];
  courses: Course[];
  onClose: () => void;
  onSave: (professor: Professor) => void;
}

// Interface for professor assignment
interface ProfessorAssignment {
  professor_id: string;
  professor_name: string;
  semester: string;
}

// Interface for course semester information
interface CourseSemesterInfo {
  availableSemesters: string[];
  assignedProfessors: ProfessorAssignment[];
}

// Interface for course selection with semester information
interface CourseSelection {
  courseId: string;
  selectedSemesters: string[];
  disabledSemesters: {
    [semester: string]: {
      disabled: boolean;
      reason: string;
    };
  };
}

const ProfessorForm: React.FC<ProfessorFormProps> = ({
  open,
  professor,
  departments,
  courses,
  onClose,
  onSave
}) => {
  // Log all props for debugging
  console.log('ProfessorForm rendered with props:', { open, professor, departments });
  
  const [formData, setFormData] = useState<Professor>({
    professor_id: '',
    department_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password_hash: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // State to manage course selections with their respective semesters
  const [courseSelections, setCourseSelections] = useState<CourseSelection[]>([]);

  // State to track course semester info
  const [courseSemesterInfo, setCourseSemesterInfo] = useState<{
    [courseId: string]: CourseSemesterInfo;
  }>({});

  // State to track loading state
  const [loading, setLoading] = useState<{[courseId: string]: boolean}>({});
  
  // Filter courses based on selected department
  const filteredCourses = formData.department_id
    ? courses.filter(course => course.department_id === formData.department_id)
    : [];

  // Fetch course semester data
  const fetchCourseSemesterData = useCallback(async (courseId: string) => {
    if (!courseId) return;
    
    // Set loading state for this course
    setLoading(prev => ({ ...prev, [courseId]: true }));
    
    try {
      // Fetch data about available semesters and professor assignments
      const data = await professorService.getCourseSemesters(courseId);
      
      // Update state with the fetched data
      setCourseSemesterInfo(prev => ({
        ...prev,
        [courseId]: {
          availableSemesters: data.available_semesters || ['Fall', 'Spring'],
          assignedProfessors: data.assigned_professors || []
        }
      }));
    } catch (error) {
      console.error(`Error fetching semester data for course ${courseId}:`, error);
      // Set default values if there's an error
      setCourseSemesterInfo(prev => ({
        ...prev,
        [courseId]: {
          availableSemesters: ['Fall', 'Spring'],
          assignedProfessors: []
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [courseId]: false }));
    }
  }, []);

  useEffect(() => {
    // Add comprehensive debugging
    console.log('Professor in useEffect:', professor);
    console.log('Professor type:', typeof professor);
    
    if (professor) {
      // Log all keys and values
      console.log('Professor keys:', Object.keys(professor));
      console.log('Professor values:', Object.values(professor));
      
      // Try to access course_ids in different ways
      console.log('Direct course_ids:', professor.course_ids);
      console.log('Bracket course_ids:', professor['course_ids']);
      
      setFormData({
        ...professor,
      });
      
      // Debug log to see if course_ids exists
      console.log('Course IDs from professor:', professor.course_ids);
      
      // Create a comprehensive set of all semesters from all sources
      const allSemesters = new Set<string>();
      
      // Add from direct professor.semesters
      if (professor.semesters && Array.isArray(professor.semesters)) {
        professor.semesters.forEach(semester => allSemesters.add(semester));
      }
      
      // Also check course_semesters
      if (professor.course_semesters) {
        Object.values(professor.course_semesters).forEach(semesters => {
          if (Array.isArray(semesters)) {
            semesters.forEach(semester => allSemesters.add(semester));
          }
        });
      }
      
      // Also check individual course professor_course associations
      if (professor.courses && Array.isArray(professor.courses)) {
        professor.courses.forEach(course => {
          if (course.professor_course?.semester) {
            allSemesters.add(course.professor_course.semester);
          }
        });
      }
      
      console.log('All semesters collected:', Array.from(allSemesters));
      
      // Check if professor has course_ids
      if (professor.course_ids && Array.isArray(professor.course_ids) && professor.course_ids.length > 0) {
        console.log('Professor data for course selections:', professor);
        
        // Create a mapping of course_id -> array of semesters
        const courseSemestersMap: {[courseId: string]: string[]} = {};
        
        // If we have courses from the API
        if (professor.courses && Array.isArray(professor.courses)) {
          // Process each course's semester data
          professor.courses.forEach(course => {
            const courseId = course.course_id;
            const semester = course.professor_course?.semester;
            
            if (courseId && semester) {
              if (!courseSemestersMap[courseId]) {
                courseSemestersMap[courseId] = [];
              }
              
              // Add semester if not already in the array
              if (!courseSemestersMap[courseId].includes(semester)) {
                courseSemestersMap[courseId].push(semester);
              }
            }
          });
        }
        
        // Also check if we have course_semesters data directly
        if (professor.course_semesters) {
          Object.keys(professor.course_semesters).forEach(courseId => {
            const semesters = professor.course_semesters![courseId];
            if (!courseSemestersMap[courseId]) {
              courseSemestersMap[courseId] = [];
            }
            
            // Add each semester if not already in the array
            semesters.forEach(semester => {
              if (!courseSemestersMap[courseId].includes(semester)) {
                courseSemestersMap[courseId].push(semester);
              }
            });
          });
        }
        
        console.log('Course semesters map created:', courseSemestersMap);
        
        // Now create the course selections
        const selections = professor.course_ids.map(courseId => {
          // Get the semesters for this course from our map
          // Fall back to all collected semesters, and finally to ['Fall'] if nothing else
          const semesters = 
            (courseSemestersMap[courseId] && courseSemestersMap[courseId].length > 0) 
              ? courseSemestersMap[courseId] 
              : (allSemesters.size > 0)
                ? Array.from(allSemesters)
                : ['Fall'];
          
          return {
            courseId,
            selectedSemesters: semesters,
            disabledSemesters: {}
          };
        });
        
        console.log('Setting course selections with proper semesters:', selections);
        setCourseSelections(selections);
        
        // Fetch semester data for each course
        selections.forEach(selection => {
          if (selection.courseId) {
            fetchCourseSemesterData(selection.courseId);
          }
        });
      } else {
        console.log('No course IDs found, setting empty selections');
        setCourseSelections([]);
      }
    } else {
      // For new professors, reset the form
      setFormData({
        professor_id: '',
        department_id: departments.length > 0 ? departments[0].department_id : '',
        first_name: '',
        last_name: '',
        email: '',
        password_hash: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setCourseSelections([]);
    }
    
    setErrors({});
  }, [professor, departments, fetchCourseSemesterData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev: Professor) => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error for this field when user types
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  // Add a new course selection
  const handleAddCourse = () => {
    setCourseSelections([...courseSelections, { 
      courseId: '', 
      selectedSemesters: [],
      disabledSemesters: {}
    }]);
  };

  // Remove a course selection
  const handleRemoveCourse = (index: number) => {
    const updatedSelections = [...courseSelections];
    updatedSelections.splice(index, 1);
    setCourseSelections(updatedSelections);
  };

  // Update a specific course selection
  const handleCourseChange = (index: number, courseId: string) => {
    const updatedSelections = [...courseSelections];
    updatedSelections[index] = {
      ...updatedSelections[index],
      courseId,
      selectedSemesters: []
    };
    setCourseSelections(updatedSelections);
    
    // Fetch semester data for this course
    if (courseId) {
      fetchCourseSemesterData(courseId);
    }
  };

  // Handle semester selection for a specific course
  const handleSemesterChange = (index: number, semester: string) => {
    const updatedSelections = [...courseSelections];
    const currentSelection = updatedSelections[index];
    
    // Check if the semester is disabled
    if (currentSelection.disabledSemesters[semester]?.disabled) {
      return; // Do nothing if the semester is disabled
    }
    
    const currentSemesters = [...currentSelection.selectedSemesters];
    
    const semesterIndex = currentSemesters.indexOf(semester);
    
    if (semesterIndex > -1) {
      // Remove semester if already selected
      currentSemesters.splice(semesterIndex, 1);
    } else {
      // Add semester if not selected
      currentSemesters.push(semester);
    }
    
    updatedSelections[index] = {
      ...currentSelection,
      selectedSemesters: currentSemesters
    };
    
    setCourseSelections(updatedSelections);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.department_id) {
      newErrors.department_id = 'Department is required';
    }
    
    // Generate a professor_id if creating a new professor
    if (!professor && !formData.professor_id) {
      // We can either generate an ID here or let the backend generate it
      // For consistency with other forms, let's generate one
      formData.professor_id = `PROF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Build course_semesters object
      const course_semesters: {[courseId: string]: string[]} = {};
      
      courseSelections.forEach(selection => {
        if (selection.courseId && selection.selectedSemesters.length > 0) {
          course_semesters[selection.courseId] = selection.selectedSemesters;
        }
      });
      
      // Extract course IDs
      const courseIds = courseSelections
        .filter(selection => selection.courseId !== '')
        .map(selection => selection.courseId);
      
      console.log('Course selections at submission:', courseSelections);
      console.log('Course IDs being submitted:', courseIds);
      console.log('Course semesters being submitted:', course_semesters);
      
      const professorData: any = {
        ...formData,
        course_ids: courseIds,
        course_semesters: course_semesters,
        updated_at: new Date().toISOString()
      };
      
      console.log('Submitting professor data:', professorData);
      onSave(professorData as Professor);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {professor ? 'Edit Professor' : 'Add New Professor'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              name="first_name"
              label="First Name"
              fullWidth
              value={formData.first_name}
              onChange={handleChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="last_name"
              label="Last Name"
              fullWidth
              value={formData.last_name}
              onChange={handleChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.department_id}>
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                label="Department"
                required
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.department_id && (
                <FormHelperText>{errors.department_id}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          {/* Custom Professor ID field for new professors */}
          {!professor && (
            <Grid item xs={12}>
              <TextField
                name="professor_id"
                label="Professor ID (optional)"
                fullWidth
                value={formData.professor_id}
                onChange={handleChange}
                helperText="Leave blank for auto-generated ID"
              />
            </Grid>
          )}
          
          {/* Password field removed */}
          
          {/* Multiple Course Selection Section with Per-Course Semester Selection */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">Assigned Courses</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddCourse}
                  variant="outlined"
                  size="small"
                  disabled={!formData.department_id}
                >
                  Add Course
                </Button>
              </Box>
              
              {courseSelections.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No courses assigned. Click "Add Course" to assign courses.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {courseSelections.map((selection, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FormControl fullWidth>
                            <InputLabel id={`course-select-label-${index}`}>Course</InputLabel>
                            <Select
                              labelId={`course-select-label-${index}`}
                              value={selection.courseId}
                              onChange={(e) => handleCourseChange(index, e.target.value)}
                              label="Course"
                              disabled={!formData.department_id}
                            >
                              <MenuItem value="">
                                <em>Select a course</em>
                              </MenuItem>
                              {filteredCourses.map((course) => (
                                <MenuItem
                                  key={course.course_id}
                                  value={course.course_id}
                                  disabled={courseSelections.some(
                                    s => s.courseId === course.course_id && courseSelections.indexOf(s) !== index
                                  )}
                                >
                                  <ListItemText
                                    primary={course.course_name}
                                    secondary={`${course.course_id} (${course.is_core ? 'Core' : 'Elective'})`}
                                  />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveCourse(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        
                        {/* Semester selection for this course */}
                        {selection.courseId && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                              Semester Availability:
                            </Typography>
                            
                            {courseSemesterInfo[selection.courseId] ? (
                              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                                {courseSemesterInfo[selection.courseId].availableSemesters.map(semester => {
                                  // Find if any professors are assigned to this course-semester
                                  const assignedProf = courseSemesterInfo[selection.courseId].assignedProfessors.find(
                                    prof => prof.semester === semester && prof.professor_id !== professor?.professor_id
                                  );
                                  
                                  const isDisabled = Boolean(assignedProf);
                                  const disabledReason = isDisabled ? `Already assigned to ${assignedProf?.professor_name}` : '';
                                  
                                  return (
                                    <Tooltip
                                      key={semester}
                                      title={isDisabled ? disabledReason : ''}
                                      placement="right"
                                    >
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={selection.selectedSemesters.includes(semester)}
                                            onChange={() => handleSemesterChange(index, semester)}
                                            size="small"
                                            disabled={isDisabled}
                                          />
                                        }
                                        label={
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography>{semester}</Typography>
                                            {isDisabled && (
                                              <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                (Already assigned)
                                              </Typography>
                                            )}
                                          </Box>
                                        }
                                      />
                                    </Tooltip>
                                  );
                                })}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Loading available semesters...
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
              
              {filteredCourses.length === 0 && formData.department_id && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No courses available for this department
                </Typography>
              )}
            </Box>
          </Grid>
          
          {professor && (
            <Grid item xs={12}>
              <TextField
                name="professor_id"
                label="Professor ID"
                fullWidth
                value={formData.professor_id}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfessorForm;