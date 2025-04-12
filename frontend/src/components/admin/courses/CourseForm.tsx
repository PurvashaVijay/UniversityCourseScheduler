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
  Checkbox,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
  FormGroup,
  FormLabel,
  TextField
} from '@mui/material';

import { Autocomplete, Chip, FormHelperText } from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { TextInput, NumberInput } from '../../../components/common/FormComponents';

// Import services
import departmentService from '../../../services/departmentService';
import programService from '../../../services/programService';
import courseService, { Course } from '../../../services/courseService';

interface ProgramAssociation {
  program_id: string;
  name: string;
  department_id: string;
  is_core: boolean;
  num_classes: number;
}


const CourseForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  // Get programId from query param if present (for new courses)
  const queryParams = new URLSearchParams(location.search);
  const initialProgramId = queryParams.get('programId') || '';
  
  const [programs, setPrograms] = useState<any[]>([]);
  const [programAssociations, setProgramAssociations] = useState<ProgramAssociation[]>([]);
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [course, setCourse] = useState<{
    course_id: string;
    program_id: string;
    department_id: string;
    name: string;
    description: string;
    duration_minutes: number | '';
    is_core: boolean;
    numClasses: number; // Added numClasses field
    semesters: string[];
  }>({
    course_id: '',
    program_id: initialProgramId,
    department_id: '',
    name: '',
    description: '',
    duration_minutes: 55,
    is_core: false, // Kept for backward compatibility
    numClasses: 1, // Default to 1
    semesters: []
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await programService.getAllPrograms();
        setPrograms(data);
        setAllPrograms(data);
        
        // If we have programs and an initialProgramId, set the department_id
        if (data.length > 0 && initialProgramId) {
          const selectedProgram = data.find(p => p.program_id === initialProgramId);
          if (selectedProgram) {
            setCourse(prevCourse => ({
              ...prevCourse,
              department_id: selectedProgram.department_id
            }));
          }
        }
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
    
    if (isEditing && id) {
      const loadCourse = async () => {
        try {
          console.log(`Loading course with ID: ${id}`);
          const data = await courseService.getCourseById(id);
          
          if (data) {
            // Log the received data for debugging
            console.log('Loaded course data:', data);
            
            // Ensure semesters are always handled as an array
            const loadedSemesters = Array.isArray(data.semesters) ? data.semesters : 
                                  (data.semesters ? [data.semesters] : []);
            
            // Set semester checkboxes
            setSelectedSemesters(loadedSemesters);
            
            // Ensure all required fields are set
            setCourse({
              course_id: data.course_id || '',
              program_id: data.program_id || (data.programs && data.programs.length > 0 ? data.programs[0].program_id : ''),
              department_id: data.department_id || '',
              name: data.course_name || data.name || '',
              description: data.description || '',
              duration_minutes: typeof data.duration_minutes === 'number' ? data.duration_minutes : 55,
              is_core: Boolean(data.is_core),
              numClasses: data.numClasses || 1, // Default to 1 if not provided
              semesters: loadedSemesters  // Set the semesters here too
            });

            // Add this section to handle program associations:
            if (data.programs && Array.isArray(data.programs)) {
              // Transform the data to ensure we have complete program association data
              const associations = data.programs.map(prog => ({
                program_id: prog.program_id,
                name: prog.name || '',
                department_id: prog.department_id || '',
                is_core: Boolean(prog.is_core), // Ensure this is correctly cast to boolean
                num_classes: prog.num_classes || 1
              }));
              
              console.log('Processed program associations:', associations);
              setProgramAssociations(associations);
            }
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
      // For new courses, set an empty course_id instead of generating one
      setCourse(prevCourse => ({
        ...prevCourse,
        course_id: '', // Leave empty for user input
        program_id: initialProgramId || ''
      }));
      setLoading(false);
    }
  }, [id, isEditing, navigate, initialProgramId]);

  // Add this new useEffect to initialize program associations with primary program
  useEffect(() => {
    // For new courses, when program_id changes, update program associations
    if (!isEditing && course.program_id && programs.length > 0) {
      const selectedProgram = programs.find(p => p.program_id === course.program_id);
      
      if (selectedProgram && !programAssociations.some(p => p.program_id === course.program_id)) {
        setProgramAssociations(prev => [
          ...prev,
          {
            program_id: course.program_id,
            name: selectedProgram.name || '',
            department_id: selectedProgram.department_id || '',
            is_core: course.is_core,
            num_classes: course.numClasses || 1
          }
        ]);
      }
    }
  }, [course.program_id, course.is_core, course.numClasses, isEditing, programs, programAssociations]);

  // Update course.semesters when selectedSemesters changes
  useEffect(() => {
    setCourse(prev => ({
      ...prev,
      semesters: selectedSemesters
    }));
  }, [selectedSemesters]);

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
    
    if (!course.department_id) {
      newErrors.department_id = 'Department ID is required (should be set automatically)';
    }
    
    if (course.duration_minutes === '') {
      newErrors.duration_minutes = 'Duration is required';
    } else if (typeof course.duration_minutes === 'number' && course.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duration must be greater than 0';
    }
    
    if (course.semesters.length === 0) {
      newErrors.semesters = 'At least one semester must be selected';
    }
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSemesterChange = (semester: string) => {
    setSelectedSemesters(prev => {
      if (prev.includes(semester)) {
        return prev.filter(s => s !== semester);
      } else {
        return [...prev, semester];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    try {
      setSaving(true);
      
      // Log what we're about to send for debugging
      console.log('About to submit course data:', course);
    
      // Create a properly typed object for the API
      const courseData = {
        ...course,
        semesters: selectedSemesters,
        course_name: course.name, // Ensure course_name is set for backend compatibility
        duration_minutes: Number(course.duration_minutes), // Force conversion to number
        // For backward compatibility, keep is_core but don't use it for program associations
        program_associations: [ 
          // Include the primary program association with its specific settings
          ...(course.program_id && !programAssociations.some(p => p.program_id === course.program_id) 
            ? [{
                program_id: course.program_id,
                name: programs.find(p => p.program_id === course.program_id)?.name || '',
                department_id: course.department_id,
                is_core: false, // Default to false - will be set by program associations
                num_classes: course.numClasses || 1
              }] 
            : []),
          ...programAssociations
        ],
        // Add the numClasses field for backward compatibility
        numClasses: course.numClasses
      };

      console.log('Submitting course data:', courseData);
    
      if (isEditing) {
        await courseService.updateCourse(id!, courseData);
      } else {
        await courseService.createCourse(courseData);
      }
    
      setSnackbar({
        open: true,
        message: `Course ${isEditing ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    
      // Navigate back after a brief delay
      setTimeout(() => {
        navigate('/admin/courses');
      }, 1500);
    } catch (error) {
        console.error('Error saving course:', error);
        let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} course`;
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        setSnackbar({
          open: true,
          message: errorMessage,
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
    
    // Find the selected program to get its department_id
    const selectedProgram = programs.find(p => p.program_id === newProgramId);
    const departmentId = selectedProgram ? selectedProgram.department_id : '';
    
    setCourse({
      ...course,
      program_id: newProgramId,
      department_id: departmentId // Add the department_id
    });
    
    // Clear any program_id error
    if (errors.program_id) {
      setErrors({
        ...errors,
        program_id: ''
      });
    }
    // Add the selected program to program associations if it doesn't exist
    if (newProgramId && !programAssociations.some(p => p.program_id === newProgramId) && selectedProgram) {
      setProgramAssociations(prev => [
        ...prev,
        {
          program_id: newProgramId,
          name: selectedProgram.name || '',
          department_id: departmentId || '',
          is_core: course.is_core,
          num_classes: course.numClasses || 1
        }
      ]);
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

  // Modified to handle numClasses changes
  const handleNumClassesChange = (value: number) => {
    setCourse({
      ...course,
      numClasses: value
    });
  };

  const handleProgramAssociationChange = (programId: string, field: 'is_core' | 'num_classes', value: boolean | number) => {
    setProgramAssociations(prev => 
      prev.map(p => 
        p.program_id === programId 
          ? { ...p, [field]: value }
          : p
      )
    );
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
            
            {/* Replaced Core Course toggle with Number of Classes dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="num-classes-global-label">
                  Number of Classes
                </InputLabel>
                <Select
                  labelId="num-classes-global-label"
                  value={course.numClasses || 1}
                  label="Number of Classes"
                  onChange={(e) => handleNumClassesChange(Number(e.target.value))}
                >
                  <MenuItem value={1}>Single (1)</MenuItem>
                  <MenuItem value={2}>Dual (2)</MenuItem>
                  <MenuItem value={3}>Triple (3)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" sx={{ mt: 2, mb: 2 }}>
                <FormLabel component="legend">Semester</FormLabel>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedSemesters.includes('Fall')}
                        onChange={() => handleSemesterChange('Fall')}
                      />
                    }
                    label="Fall"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedSemesters.includes('Spring')}
                        onChange={() => handleSemesterChange('Spring')}
                      />
                    }
                    label="Spring"
                  />
                </FormGroup>
              </FormControl>
              {errors.semesters && (
                <Typography color="error" variant="caption">
                  {errors.semesters}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Program Associations</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which programs this course is associated with and specify if it's core for each program
                and the number of classes.
              </Typography>
  
              <Autocomplete
                multiple
                id="program-associations"
                options={allPrograms}
                disableCloseOnSelect
                getOptionLabel={(option) => `${option.name} (${option.department_id})`}
                value={allPrograms.filter(p => 
                  programAssociations.some(pa => pa.program_id === p.program_id)
                )}
                onChange={(_, newValue) => {
                  // Update program associations based on selected programs
                  setProgramAssociations(prev => {
                    // Keep existing associations for programs that are still selected
                      const existing = prev.filter(p => 
                        newValue.some(nv => nv.program_id === p.program_id)
                      );
        
                      // Add new associations
                      const newAssociations = newValue
                        .filter(nv => !existing.some(e => e.program_id === nv.program_id))
                        .map(nv => ({
                          program_id: nv.program_id,
                          name: nv.name,
                          department_id: nv.department_id,
                          is_core: false,
                          num_classes: 1
                        }));
        
                      return [...existing, ...newAssociations];
                    });
                  }}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.name} ({option.department_id})
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Associated Programs"
                      placeholder="Select programs"
                    />
                  )}
                  sx={{ mb: 2 }}
                />
  
                {programAssociations.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Program Settings
                    </Typography>
                  {programAssociations.map((association) => (
                    <Box 
                      key={association.program_id} 
                      sx={{ 
                        mb: 2, 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        // Highlight the primary program with a different border
                        borderColor: association.program_id === course.program_id ? '#00539F' : '#e0e0e0',
                        borderWidth: association.program_id === course.program_id ? 2 : 1,
                      }}
                    >
                      <Typography variant="subtitle2">
                        {association.name} ({association.department_id})
                        {association.program_id === course.program_id && (
                          <Chip 
                            label="Primary Program" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={association.is_core}
                                onChange={(e) => handleProgramAssociationChange(
                                  association.program_id,
                                  'is_core',
                                  e.target.checked
                                )}
                              />
                            }
                            label="Core Course in this Program"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel id={`num-classes-${association.program_id}`}>
                              Number of Classes
                            </InputLabel>
                            <Select
                              labelId={`num-classes-${association.program_id}`}
                              value={association.num_classes}
                              label="Number of Classes"
                              onChange={(e) => handleProgramAssociationChange(
                                association.program_id,
                                'num_classes',
                                Number(e.target.value)
                              )}
                            >
                              <MenuItem value={1}>Single (1)</MenuItem>
                              <MenuItem value={2}>Dual (2)</MenuItem>
                              <MenuItem value={3}>Triple (3)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Paper>
              )}
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