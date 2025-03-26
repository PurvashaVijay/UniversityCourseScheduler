// src/components/admin/programs/ProgramDetails.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Grid,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
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
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import programService from '../../../services/programService';
// Add this right after the import in ProgramDetails.tsx
console.log('programService imported:', programService);


const ProgramDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  console.log("Program detail page loaded with ID:", id); // Add this debug line
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    // And modify the loadProgram function with debugging:
    const loadProgram = async () => {
      try {
        setLoading(true);
        console.log('Attempting to load program with ID:', id);
        console.log('getProgramById function:', programService.getProgramById);
    
        const data = await programService.getProgramById(id!);
        console.log('Program data loaded:', data);
    
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
          message: error instanceof Error ? error.message : 'Failed to load program details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
  
    if (id) {
      loadProgram();
    }
  }, [id, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEdit = () => {
    navigate(`/admin/programs/${id}/edit`);
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      console.log(`Trying to delete program with ID: ${id}`);
      await programService.deleteProgram(id!);
      
      setSnackbar({
        open: true,
        message: 'Program deleted successfully',
        severity: 'success'
      });
      
      // Navigate back after a brief delay
      setTimeout(() => {
        navigate('/admin/programs');
      }, 1500);
    } catch (error) {
      console.error('Error deleting program:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete program',
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

  if (!program) {
    return (
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" color="error">
          Program not found
        </Typography>
        <Button component={Link} to="/admin/programs" sx={{ mt: 2 }}>
          Back to Programs
        </Button>
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
          {program.name}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Program Details
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
              Program ID
            </Typography>
            <Typography variant="h6">
              {program.program_id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Department
            </Typography>
            <Typography variant="h6">
              {program.department?.name || program.department_id}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="h6">
              {program.name}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography>
              {program.description || 'No description provided'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Courses" />
        </Tabs>
      </Box>

      <Paper sx={{ p: 3 }}>
        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Courses
              </Typography>
              <Button
                variant="contained"
                size="small"
                component={Link}
                to={`/admin/courses/new?programId=${program.program_id}`}
                sx={{ bgcolor: '#00539F' }}
              >
                Add Course
              </Button>
            </Box>
            
            {program.courses && program.courses.length > 0 ? (
              <List>
                {program.courses.map((course: any) => (
                  <ListItem key={course.course_id} disablePadding divider>
                    <ListItemButton component={Link} to={`/admin/courses/${course.course_id}`}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {course.course_name || course.name}
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
                No courses found for this program
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Program"
        message="Are you sure you want to delete this program? This action cannot be undone and will also remove all course associations."
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

export default ProgramDetails;