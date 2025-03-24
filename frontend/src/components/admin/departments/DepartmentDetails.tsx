// src/components/admin/departments/DepartmentDetails.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Chip,
  Grid,
  Button,
  List,
  ListItem,
  ListItemButton, 
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  Tabs,
  Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
//import { Link, useNavigate, useParams } from 'react-router-dom';
//import ConfirmDialog from '../../common/ConfirmDialog';
// To
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

// Mock API functions
const fetchDepartmentDetails = async (id: string) => {
  // In a real app, this would fetch from your API
  return {
    department_id: id,
    name: 'Sample Department',
    description: 'This is a sample department description.',
    programs: [
      { program_id: 'PROG-001', name: 'Bachelor of Science' },
      { program_id: 'PROG-002', name: 'Master of Science' }
    ],
    courses: [
      { course_id: 'CS101', course_name: 'Introduction to Programming', is_core: true },
      { course_id: 'CS201', course_name: 'Data Structures', is_core: true },
      { course_id: 'CS301', course_name: 'Algorithms', is_core: false }
    ],
    professors: [
      { professor_id: 'PROF-001', first_name: 'John', last_name: 'Doe' },
      { professor_id: 'PROF-002', first_name: 'Jane', last_name: 'Smith' }
    ]
  };
};

const deleteDepartment = async (id: string) => {
  console.log('Deleting department:', id);
  // In a real app, this would call your API
  return { success: true };
};

const DepartmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const loadDepartment = async () => {
      try {
        const data = await fetchDepartmentDetails(id!);
        setDepartment(data);
      } catch (error) {
        console.error('Error loading department:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load department details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadDepartment();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/admin/departments/${id}/edit`);
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteDepartment(id!);
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Department deleted successfully',
          severity: 'success'
        });
        
        // Navigate back after a brief delay
        setTimeout(() => {
          navigate('/admin/departments');
        }, 1500);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete department',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!department) {
    return (
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" color="error">
          Department not found
        </Typography>
        <Button component={Link} to="/admin/departments" sx={{ mt: 2 }}>
          Back to Departments
        </Button>
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
          {department.name}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Department Details
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Department ID
            </Typography>
            <Typography variant="h6">
              {department.department_id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="h6">
              {department.name}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography>
              {department.description || 'No description provided'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Programs" />
          <Tab label="Courses" />
          <Tab label="Professors" />
        </Tabs>
      </Box>

      <Paper sx={{ p: 3 }}>
        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Programs
              </Typography>
              <Button
                variant="contained"
                size="small"
                component={Link}
                to={`/admin/programs/new?departmentId=${department.department_id}`}
                sx={{ bgcolor: '#00539F' }}
              >
                Add Program
              </Button>
            </Box>
            
            {department.programs && department.programs.length > 0 ? (
              <List>
                {department.programs.map((program: any) => (
                  <ListItem key={program.program_id} disablePadding divider>
                  <ListItemButton component={Link} to={`/admin/programs/${program.program_id}`}>
                    <ListItemText
                      primary={program.name}
                      secondary={`ID: ${program.program_id}`}
                    />
                  </ListItemButton>
                </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No programs found for this department
              </Typography>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Courses
              </Typography>
              <Button
                variant="contained"
                size="small"
                component={Link}
                to={`/admin/courses/new?departmentId=${department.department_id}`}
                sx={{ bgcolor: '#00539F' }}
              >
                Add Course
              </Button>
            </Box>
            
            {department.courses && department.courses.length > 0 ? (
              <List>
                {department.courses.map((course: any) => (
                  <ListItem key={course.course_id} disablePadding>
                  <ListItemButton component={Link} to={`/admin/courses/${course.course_id}`}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {course.course_name}
                          {course.is_core && (
                            <Chip 
                              label="Core" 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1, bgcolor: '#00539F' }} 
                            />
                          )}
                        </Box>
                      }
                      secondary={`ID: ${course.course_id}`}
                    />
                  </ListItemButton>
                </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No courses found for this department
              </Typography>
            )}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Professors
              </Typography>
              <Button
                variant="contained"
                size="small"
                component={Link}
                to={`/admin/professors/new?departmentId=${department.department_id}`}
                sx={{ bgcolor: '#00539F' }}
              >
                Add Professor
              </Button>
            </Box>
            
            {department.professors && department.professors.length > 0 ? (
              <List>
                {department.professors.map((professor: any) => (
                  <ListItem key={professor.professor_id} disablePadding divider>
                  <ListItemButton component={Link} to={`/admin/professors/${professor.professor_id}`}>
                    <ListItemText
                      primary={`${professor.first_name} ${professor.last_name}`}
                      secondary={`ID: ${professor.professor_id}`}
                    />
                  </ListItemButton>
                </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No professors found for this department
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone and will also delete all associated programs, courses, and professor assignments."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Delete"
        severity="error"
      />

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

export default DepartmentDetails;