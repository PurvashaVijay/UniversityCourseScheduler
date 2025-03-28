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
  Chip,
  OutlinedInput,
  Typography
} from '@mui/material';
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
    semesters: [],
    course_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Filter courses based on selected department
  const filteredCourses = formData.department_id 
    ? courses.filter(course => course.department_id === formData.department_id)
    : [];

  useEffect(() => {
    if (professor) {
      setFormData({
        ...professor,
        // Initialize with empty arrays if not present
        semesters: professor.semesters || [],
        course_ids: professor.course_ids || []
      });
    } else {
      // For new professors, reset the form
      setFormData({
        professor_id: '',
        department_id: departments.length > 0 ? departments[0].department_id : '',
        first_name: '',
        last_name: '',
        email: '',
        password_hash: '',
        semesters: [],
        course_ids: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
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

  const handleSemesterChange = (semester: string) => {
    const currentSemesters = [...(formData.semesters || [])];
    const index = currentSemesters.indexOf(semester);
    
    if (index > -1) {
      // Remove semester if already selected
      currentSemesters.splice(index, 1);
    } else {
      // Add semester if not selected
      currentSemesters.push(semester);
    }
    
    setFormData({
      ...formData,
      semesters: currentSemesters
    });
  };

  const handleCourseChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    
    // On autofill we get a stringified value.
    const courseIds = typeof value === 'string' ? value.split(',') : value;
    
    setFormData({
      ...formData,
      course_ids: courseIds
    });
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
      const professorData: Professor = {
        ...formData,
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
          
          <Grid item xs={12}>
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Semester Availability
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.semesters?.includes('Fall') || false}
                      onChange={() => handleSemesterChange('Fall')}
                    />
                  }
                  label="Fall"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.semesters?.includes('Spring') || false}
                      onChange={() => handleSemesterChange('Spring')}
                    />
                  }
                  label="Spring"
                />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="courses-select-label">Courses</InputLabel>
              <Select
                labelId="courses-select-label"
                multiple
                value={formData.course_ids || []}
                onChange={handleCourseChange}
                input={<OutlinedInput label="Courses" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const course = courses.find(c => c.course_id === value);
                      return <Chip key={value} label={course ? course.course_name : value} />;
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 48 * 4.5 + 8,
                      width: 250,
                    },
                  },
                }}
              >
                {filteredCourses.map((course) => (
                  <MenuItem key={course.course_id} value={course.course_id}>
                    <Checkbox checked={(formData.course_ids || []).indexOf(course.course_id) > -1} />
                    <ListItemText 
                      primary={course.course_name} 
                      secondary={`${course.course_id} (${course.is_core ? 'Core' : 'Elective'})`} 
                    />
                  </MenuItem>
                ))}
                {filteredCourses.length === 0 && (
                  <MenuItem disabled>
                    {formData.department_id 
                      ? 'No courses available for this department' 
                      : 'Please select a department first'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
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