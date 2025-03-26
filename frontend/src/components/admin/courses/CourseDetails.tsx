// src/components/admin/courses/CourseDetails.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  //Divider, 
  Grid,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
//import { Link, useNavigate, useParams } from 'react-router-dom';
//import ConfirmDialog from '../../common/ConfirmDialog';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { Link, useNavigate, useParams } from 'react-router-dom';

// Mock API functions
const fetchCourseDetails = async (id: string) => {
  // This would be an API call to get a specific course
  const coursesMap: { [key: string]: any } = {
    'COURSE-001': {
      id: 'COURSE-001',
      course_id: 'CS101',
      program_id: 'PROG-001',
      name: 'Introduction to Programming',
      description: 'Basic programming concepts and an introduction to Python programming language. Topics include variables, data types, control structures, functions, and basic algorithms.',
      duration_minutes: 55,
      is_core: true,
      semesters: ['Fall'], // Add semester
      program: { program_id: 'PROG-001', name: 'Bachelor of Science in Computer Science' },
      prerequisites: []
    },
    'COURSE-002': {
      id: 'COURSE-002',
      course_id: 'CS201',
      program_id: 'PROG-001',
      name: 'Data Structures',
      description: 'Advanced data structures including arrays, linked lists, stacks, queues, trees, and graphs. Implementation and analysis of fundamental algorithms.',
      duration_minutes: 55,
      is_core: true,
      semesters: ['Spring'], // Add semester
      program: { program_id: 'PROG-001', name: 'Bachelor of Science in Computer Science' },
      prerequisites: [
        { course_id: 'CS101', name: 'Introduction to Programming' }
      ]
    }
  };
  
  return coursesMap[id] || null;
};

const deleteCourse = async (id: string) => {
  console.log('Deleting course:', id);
  // This would be an API call to delete the course
  return { success: true };
};

const CourseDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await fetchCourseDetails(id!);
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
              message: 'Failed to load course details',
              severity: 'error'
            });
          } finally {
            setLoading(false);
          }
        };
    
        loadCourse();
      }, [id, navigate]);
    
      const handleEdit = () => {
        navigate(`/admin/courses/${id}/edit`);
      };
      
      const handleDelete = () => {
        setDeleteDialogOpen(true);
      };
    
      const handleDeleteConfirm = async () => {
        try {
          const result = await deleteCourse(id!);
          
          if (result.success) {
            setSnackbar({
              open: true,
              message: 'Course deleted successfully',
              severity: 'success'
            });
            
            // Navigate back after a brief delay
            setTimeout(() => {
              navigate('/admin/courses');
            }, 1500);
          }
        } catch (error) {
          console.error('Error deleting course:', error);
          setSnackbar({
            open: true,
            message: 'Failed to delete course',
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
    
      if (!course) {
        return (
          <Box sx={{ my: 4 }}>
            <Typography variant="h5" color="error">
              Course not found
            </Typography>
            <Button component={Link} to="/admin/courses" sx={{ mt: 2 }}>
              Back to Courses
            </Button>
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
              {course.name}
            </Typography>
          </Breadcrumbs>
    
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h4" component="h1" sx={{ mr: 2 }}>
                {course.name}
              </Typography>
              {course.is_core && (
                <Chip 
                  label="Core Course" 
                  color="primary" 
                  sx={{ bgcolor: '#00539F' }} 
                />
              )}
            </Box>
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
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Course ID
                </Typography>
                <Typography variant="h6">
                  {course.course_id}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Program
                </Typography>
                <Typography variant="h6">
                  {course.program.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.program_id}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="h6">
                  {course.duration_minutes} minutes
                </Typography>
              </Grid> 
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Semester
                </Typography>
                <Typography variant="h6">
                  {Array.isArray(course.semesters) 
                    ? course.semesters.join(', ') 
                    : course.semester || 'Not specified'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
    
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Prerequisites
            </Typography>
            
            {course.prerequisites && course.prerequisites.length > 0 ? (
              <Grid container spacing={2}>
                {course.prerequisites.map((prerequisite: any) => (
                  <Grid item xs={12} md={6} key={prerequisite.course_id}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {prerequisite.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {prerequisite.course_id}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        component={Link}
                        to={`/admin/courses/${prerequisite.course_id}`}
                      >
                        View
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No prerequisites for this course
              </Typography>
            )}
          </Paper>
    
          <ConfirmDialog
            open={deleteDialogOpen}
            title="Delete Course"
            message="Are you sure you want to delete this course? This action cannot be undone."
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
    
    export default CourseDetails;