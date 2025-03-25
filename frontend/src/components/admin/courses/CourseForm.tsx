// src/components/admin/courses/CourseForm.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  Snackbar, 
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
//import { TextInput, NumberInput } from '../../common/FormComponents';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { TextInput, NumberInput } from '../../../components/common/FormComponents';
import { v4 as uuidv4 } from 'uuid';

// Mock functions for API calls
const fetchPrograms = async () => {
  // This would be an API call to get all programs
  return [
    { id: 'PROG-001', program_id: 'PROG-001', name: 'Bachelor of Science in Computer Science', department_id: 'DEPT-001' },
    { id: 'PROG-002', program_id: 'PROG-002', name: 'Master of Science in Computer Science', department_id: 'DEPT-001' },
    { id: 'PROG-003', program_id: 'PROG-003', name: 'Bachelor of Economics', department_id: 'DEPT-002' },
    { id: 'PROG-004', program_id: 'PROG-004', name: 'Master of Economics', department_id: 'DEPT-002' },
    { id: 'PROG-005', program_id: 'PROG-005', name: 'Bachelor of Mathematics', department_id: 'DEPT-003' }
  ];
};

const fetchCourse = async (id: string) => {
  // This would be an API call to get a specific course
  const coursesMap: { [key: string]: any } = {
    'COURSE-001': { 
      id: 'COURSE-001', 
      course_id: 'CS101', 
      program_id: 'PROG-001', 
      name: 'Introduction to Programming', 
      duration_minutes: 55, 
      is_core: true 
    },
    'COURSE-002': { 
      id: 'COURSE-002', 
      course_id: 'CS201', 
      program_id: 'PROG-001', 
      name: 'Data Structures',  
      duration_minutes: 55, 
      is_core: true 
    },
    'COURSE-005': { 
      id: 'COURSE-005', 
      course_id: 'CS501', 
      program_id: 'PROG-002', 
      name: 'Advanced Algorithms',  
      duration_minutes: 80, 
      is_core: true 
    }
  };
  
  return coursesMap[id] || null;
};

const saveCourse = async (course: any) => {
  console.log('Saving course:', course);
  // This would be an API call to save the course
  return { success: true, course };
};

const CourseForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  // Get programId from query param if present (for new courses)
  const queryParams = new URLSearchParams(location.search);
  const initialProgramId = queryParams.get('programId') || '';
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [course, setCourse] = useState({
    course_id: '',
    program_id: initialProgramId,
    name: '',
    description: '',
    duration_minutes: 55 as number | '',
    is_core: false
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await fetchPrograms();
        setPrograms(data);
      } catch (error) {
        console.error('Error loading programs:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load programs',
          severity: 'error'
        });
      }
    };

    loadPrograms();
    
    if (isEditing) {
      const loadCourse = async () => {
        try {
          const data = await fetchCourse(id!);
          if (data) {
            setCourse(data);
          } else {
            setSnackbar({
              open: true,
              message: 'Course not found',
              severity: 'error'
            });
            navigate('/admin/courses');
          }
        } catch (error) {
          console.error('Error loading course:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load course',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      };

      loadCourse();
    } else {
      // For new courses, generate a unique ID if not editing
      setCourse(prevCourse => ({
        ...prevCourse,
        course_id: `COURSE-${uuidv4().substring(0, 6)}`
      }));
    }
  }, [id, isEditing, navigate, initialProgramId]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!course.course_id.trim()) {
      newErrors.course_id = 'Course ID is required';
    }
    
    if (!course.name.trim()) {
      newErrors.name = 'Course name is required';
    }
    
    if (!course.program_id) {
      newErrors.program_id = 'Program is required';
    }
    
    if (course.duration_minutes === '') {
      newErrors.duration_minutes = 'Duration is required';
    } else if (typeof course.duration_minutes === 'number' && course.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      const result = await saveCourse(course);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Course ${isEditing ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
        
        // Navigate back after a brief delay
        setTimeout(() => {
          navigate('/admin/courses');
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} course`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCourse({
      ...course,
      [field]: e.target.value
    });
    
    // Clear the error for this field if it exists
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const handleProgramChange = (event: SelectChangeEvent) => {
    const newProgramId = event.target.value;
    setCourse({
      ...course,
      program_id: newProgramId
    });
    
    // Clear any program_id error
    if (errors.program_id) {
      setErrors({
        ...errors,
        program_id: ''
      });
    }
  };

  const handleDurationChange = (value: number | '') => {
    setCourse({
      ...course,
      duration_minutes: value
    });
    
    // Clear any duration error
    if (errors.duration_minutes) {
      setErrors({
        ...errors,
        duration_minutes: ''
      });
    }
  };

  const handleCoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCourse({
      ...course,
      is_core: event.target.checked
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} to="/admin/courses" underline="hover" color="inherit">
          Courses
        </MuiLink>
        <Typography color="text.primary">
          {isEditing ? 'Edit Course' : 'New Course'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Edit Course' : 'New Course'}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/admin/courses"
        >
          Back to List
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextInput
                id="course_id"
                label="Course ID"
                value={course.course_id}
                onChange={handleChange('course_id')}
                error={errors.course_id}
                required
                disabled={isEditing} // ID can't be changed once created
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" error={!!errors.program_id}>
                <InputLabel id="program-select-label">Program *</InputLabel>
                <Select
                  labelId="program-select-label"
                  id="program_id"
                  value={course.program_id}
                  label="Program *"
                  onChange={handleProgramChange}
                  disabled={isEditing} // Can't change program once created
                  required
                >
                  <MenuItem value="">
                    <em>Please select a program</em>
                  </MenuItem>
                  {programs.map((prog) => (
                    <MenuItem key={prog.program_id} value={prog.program_id}>
                      {prog.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.program_id && (
                  <Typography color="error" variant="caption">
                    {errors.program_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextInput
                id="name"
                label="Course Name"
                value={course.name}
                onChange={handleChange('name')}
                error={errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <NumberInput
                id="duration_minutes"
                label="Duration (minutes)"
                value={course.duration_minutes}
                onChange={handleDurationChange}
                error={errors.duration_minutes}
                required
                min={1}
                max={300}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={course.is_core}
                    onChange={handleCoreChange}
                    color="primary"
                  />
                }
                label="Core Course"
              />
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{ bgcolor: '#00539F' }}
              >
                {saving ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                    Saving...
                  </>
                ) : (
                  'Save Course'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseForm;
