// src/components/admin/programs/ProgramForm.tsx

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
  SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { TextInput } from '../../common/FormComponents';
import { v4 as uuidv4 } from 'uuid';

// Mock functions for API calls
const fetchDepartments = async () => {
  // This would be an API call to get departments
  return [
    { id: 'DEPT-001', department_id: 'DEPT-001', name: 'Computer Science', description: 'CS Department' },
    { id: 'DEPT-002', department_id: 'DEPT-002', name: 'Economics', description: 'Economics Department' },
    { id: 'DEPT-003', department_id: 'DEPT-003', name: 'Mathematics', description: 'Mathematics Department' },
    { id: 'DEPT-004', department_id: 'DEPT-004', name: 'Physics', description: 'Physics Department' },
    { id: 'DEPT-005', department_id: 'DEPT-005', name: 'Business Administration', description: 'Business Administration Department' },
  ];
};

const fetchProgram = async (id: string) => {
  // This would be an API call to get a specific program
  // Mock data for demonstration
  const programsMap: { [key: string]: any } = {
    'PROG-001': { program_id: 'PROG-001', department_id: 'DEPT-001', name: 'Bachelor of Science in Computer Science', description: 'BS in CS program' },
    'PROG-002': { program_id: 'PROG-002', department_id: 'DEPT-001', name: 'Master of Science in Computer Science', description: 'MS in CS program' },
    'PROG-003': { program_id: 'PROG-003', department_id: 'DEPT-002', name: 'Bachelor of Economics', description: 'Economics undergraduate program' },
    'PROG-004': { program_id: 'PROG-004', department_id: 'DEPT-002', name: 'Master of Economics', description: 'Economics graduate program' },
    'PROG-005': { program_id: 'PROG-005', department_id: 'DEPT-003', name: 'Bachelor of Mathematics', description: 'Mathematics undergraduate program' },
    'PROG-006': { program_id: 'PROG-006', department_id: 'DEPT-003', name: 'Master of Mathematics', description: 'Mathematics graduate program' },
    'PROG-007': { program_id: 'PROG-007', department_id: 'DEPT-004', name: 'Bachelor of Physics', description: 'Physics undergraduate program' },
    'PROG-008': { program_id: 'PROG-008', department_id: 'DEPT-004', name: 'Master of Physics', description: 'Physics graduate program' },
    'PROG-009': { program_id: 'PROG-009', department_id: 'DEPT-005', name: 'Bachelor of Business Administration', description: 'BBA program' },
    'PROG-010': { program_id: 'PROG-010', department_id: 'DEPT-005', name: 'Master of Business Administration', description: 'MBA program' }
  };
  
  return programsMap[id] || null;
};

const saveProgram = async (program: any) => {
  console.log('Saving program:', program);
  // This would be an API call to save the program
  return { success: true, program };
};

const ProgramForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  // Get departmentId from query param if present (for new programs)
  const queryParams = new URLSearchParams(location.search);
  const initialDepartmentId = queryParams.get('departmentId') || '';
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [program, setProgram] = useState({
    program_id: '',
    department_id: initialDepartmentId,
    name: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await fetchDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error loading departments:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load departments',
          severity: 'error'
        });
      }
    };

    loadDepartments();
    
    if (isEditing) {
      const loadProgram = async () => {
        try {
          const data = await fetchProgram(id!);
          if (data) {
            setProgram(data);
          } else {
            setSnackbar({
              open: true,
              message: 'Program not found',
              severity: 'error'
            });
            navigate('/admin/programs');
          }
        } catch (error) {
          console.error('Error loading program:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load program',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      };

      loadProgram();
    } else {
      // For new programs, generate a unique ID
      setProgram(prevProgram => ({
        ...prevProgram,
        program_id: `PROG-${uuidv4().substring(0, 8)}`
      }));
    }
  }, [id, isEditing, navigate, initialDepartmentId]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!program.name.trim()) {
      newErrors.name = 'Program name is required';
    }
    
    if (!program.department_id) {
      newErrors.department_id = 'Department is required';
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
      const result = await saveProgram(program);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Program ${isEditing ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
        
        // Navigate back after a brief delay
        setTimeout(() => {
          navigate('/admin/programs');
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving program:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} program`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgram({
      ...program,
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

  const handleDepartmentChange = (event: SelectChangeEvent) => {
    const newDepartmentId = event.target.value;
    setProgram({
      ...program,
      department_id: newDepartmentId
    });
    
    // Clear any department_id error
    if (errors.department_id) {
      setErrors({
        ...errors,
        department_id: ''
      });
    }
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
        <MuiLink component={Link} to="/admin/programs" underline="hover" color="inherit">
          Programs
        </MuiLink>
        <Typography color="text.primary">
          {isEditing ? 'Edit Program' : 'New Program'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Edit Program' : 'New Program'}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/admin/programs"
        >
          Back to List
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextInput
                id="program_id"
                label="Program ID"
                value={program.program_id}
                onChange={handleChange('program_id')}
                error={errors.program_id}
                required
                disabled={isEditing} // ID can't be changed once created
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" error={!!errors.department_id}>
                <InputLabel id="department-select-label">Department *</InputLabel>
                <Select
                  labelId="department-select-label"
                  id="department_id"
                  value={program.department_id}
                  label="Department *"
                  onChange={handleDepartmentChange}
                  disabled={isEditing} // Can't change department once created
                  required
                >
                  <MenuItem value="">
                    <em>Please select a department</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.department_id} value={dept.department_id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.department_id && (
                  <Typography color="error" variant="caption">
                    {errors.department_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextInput
                id="name"
                label="Program Name"
                value={program.name}
                onChange={handleChange('name')}
                error={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextInput
                id="description"
                label="Description"
                value={program.description}
                onChange={handleChange('description')}
                error={errors.description}
                multiline
                rows={4}
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
                  'Save Program'
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

export default ProgramForm;