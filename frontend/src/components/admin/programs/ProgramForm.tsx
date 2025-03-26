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
import { TextInput } from '../../../components/common/FormComponents';
//import { v4 as uuidv4 } from 'uuid';
import programService from '../../../services/programService';
import departmentService from '../../../services/departmentService';

const ProgramForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
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
        const data = await departmentService.getAllDepartments();
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
      
    if (isEditing && id) {
      const loadProgram = async () => {
        try {
          setLoading(true);
          const data = await programService.getProgramById(id);
          if (data) {
            setProgram({
              program_id: data.program_id,
              department_id: data.department_id,
              name: data.name,
              description: data.description || ''
            });
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
      // For new programs, set an empty program_id instead of generating one
      setProgram(prevProgram => ({
        ...prevProgram,
        program_id: '', // Changed from auto-generated to empty
        department_id: initialDepartmentId
      }));
    }
  }, [id, isEditing, navigate, initialDepartmentId]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!program.program_id.trim()) {
      newErrors.program_id = 'Program ID is required';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(program.program_id)) {
      newErrors.program_id = 'Program ID can only contain letters, numbers, hyphens, and underscores';
    }
    
    if (!program.name.trim()) {
      newErrors.name = 'Program name is required';
    }

    if (!program.department_id) {
      newErrors.department_id = 'Department is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

// In ProgramForm.tsx, update the handleSubmit function:

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!validateForm()) {
      return;
    }
  
    try {
      setSaving(true);
      console.log('Submitting program data:', program);  // Add this line to debug
    
      if (isEditing && id) {
        console.log(`Updating program with ID: ${id}`, program);
        // Make sure you're passing the correct ID format
        await programService.updateProgram(id, {
          name: program.name,
          description: program.description,
          department_id: program.department_id // Make sure to include this
        });
      } else {
        console.log('Creating new program:', program);
        await programService.createProgram(program);
      }
    
      setSnackbar({
        open: true,
        message: `Program ${isEditing ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    
      // Navigate back after a brief delay
      setTimeout(() => {
        navigate('/admin/programs');
      }, 1500);
    } catch (error) {
      console.error('Error saving program:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} program`,
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