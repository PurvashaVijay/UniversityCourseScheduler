// ProfessorForm.tsx 
import React, { useState, useEffect } from 'react';
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
  //Divider,
  Paper
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Professor } from '../../../services/professorService';
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

// Interface for course selection with semester information
interface CourseSelection {
  courseId: string;
  semesters: string[];
}

const ProfessorForm: React.FC<ProfessorFormProps> = ({
  open,
  professor,
  departments,
  courses,
  onClose,
  onSave
}) => {
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
  
  // Filter courses based on selected department
  const filteredCourses = formData.department_id
    ? courses.filter(course => course.department_id === formData.department_id)
    : [];

  useEffect(() => {
    if (professor) {
      setFormData({
        ...professor,
      });
      
      // Initialize course selections from existing data
      if (professor.course_ids && professor.course_ids.length > 0) {
        const selections: CourseSelection[] = professor.course_ids.map(courseId => {
          // Check if this course has semester information
          const courseSemesters = professor.semesters || [];
          return {
            courseId,
            semesters: courseSemesters
          };
        });
        setCourseSelections(selections);
      } else {
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
  }, [professor, departments]);

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
    setCourseSelections([...courseSelections, { courseId: '', semesters: [] }]);
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
      courseId
    };
    setCourseSelections(updatedSelections);
  };

  // Handle semester selection for a specific course
  const handleSemesterChange = (index: number, semester: string) => {
    const updatedSelections = [...courseSelections];
    const currentSemesters = [...updatedSelections[index].semesters];
    
    const semesterIndex = currentSemesters.indexOf(semester);
    
    if (semesterIndex > -1) {
      // Remove semester if already selected
      currentSemesters.splice(semesterIndex, 1);
    } else {
      // Add semester if not selected
      currentSemesters.push(semester);
    }
    
    updatedSelections[index] = {
      ...updatedSelections[index],
      semesters: currentSemesters
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Extract course IDs and collect all semesters
      const courseIds = courseSelections
        .filter(selection => selection.courseId !== '')
        .map(selection => selection.courseId);
      
      // Collect all unique semesters from all course selections
      const allSemesters = courseSelections
        .filter(selection => selection.courseId !== '')
        .flatMap(selection => selection.semesters)
        .filter((value, index, self) => self.indexOf(value) === index);
      
      const professorData: Professor = {
        ...formData,
        course_ids: courseIds,
        semesters: allSemesters,
        updated_at: new Date().toISOString()
      };
      
      onSave(professorData);
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
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selection.semesters.includes('Fall')}
                                    onChange={() => handleSemesterChange(index, 'Fall')}
                                    size="small"
                                  />
                                }
                                label="Fall"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selection.semesters.includes('Spring')}
                                    onChange={() => handleSemesterChange(index, 'Spring')}
                                    size="small"
                                  />
                                }
                                label="Spring"
                              />
                            </Box>
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