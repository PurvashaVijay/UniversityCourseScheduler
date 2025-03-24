// src/components/admin/departments/DepartmentForm.tsx
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
  Link as MuiLink
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { TextInput } from '../../../components/common/FormComponents';
import { v4 as uuidv4 } from 'uuid';
import departmentService from '../../../services/departmentService';

const DepartmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [department, setDepartment] = useState({
    department_id: '',
    name: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (isEditing) {
      const loadDepartment = async () => {
        try {
          setLoading(true);
          const data = await departmentService.getDepartmentById(id!);
          setDepartment(data);
        } catch (error) {
          console.error('Error loading department:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load department',
            severity: 'error'
          });
        } finally {
          setLoading(false);
        }
      };

      loadDepartment();
    } else {
      // For new departments, generate a unique ID
      setDepartment(prevDept => ({
        ...prevDept,
        department_id: `DEPT-${uuidv4().substring(0, 8).toUpperCase()}`
      }));
      setLoading(false);
    }
  }, [id, isEditing]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!department.name.trim()) {
      newErrors.name = 'Department name is required';
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
    
      if (isEditing) {
        await departmentService.updateDepartment(id!, department);
      } else {
        await departmentService.createDepartment(department);
      }
    
      setSnackbar({
        open: true,
        message: `Department ${isEditing ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
    
      // Navigate back after a brief delay
      setTimeout(() => {
        navigate('/admin/departments');
      }, 1500);
    } catch (error) {
      console.error('Error saving department:', error);
      setSnackbar({
        open: true,
        message: `Failed to ${isEditing ? 'update' : 'create'} department`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepartment({
      ...department,
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
        <MuiLink component={Link} to="/admin/departments" underline="hover" color="inherit">
          Departments
        </MuiLink>
        <Typography color="text.primary">
          {isEditing ? 'Edit Department' : 'New Department'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Edit Department' : 'New Department'}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          component={Link}
          to="/admin/departments"
        >
          Back to List
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextInput
                id="department_id"
                label="Department ID"
                value={department.department_id}
                onChange={handleChange('department_id')}
                error={errors.department_id}
                required
                disabled={isEditing} // ID can't be changed once created
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextInput
                id="name"
                label="Department Name"
                value={department.name}
                onChange={handleChange('name')}
                error={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextInput
                id="description"
                label="Description"
                value={department.description}
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
                  'Save Department'
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

export default DepartmentForm;