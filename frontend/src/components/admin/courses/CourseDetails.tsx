// src/components/admin/courses/CourseDetails.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
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
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { Link, useNavigate, useParams } from 'react-router-dom';
import courseService, { Course } from '../../../services/courseService';

const CourseDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [course, setCourse] = useState<Partial<Course> & { 
    program?: any, 
    numClasses?: number 
  }>({});
  
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await courseService.getCourseById(id!);
        if (data) {
          // Process the data before setting it to state
          setCourse({
            ...data,
            // Ensure consistent naming
            name: data.name || data.course_name,
            // Ensure semesters is always an array
            semesters: Array.isArray(data.semesters) ? data.semesters : (data.semesters ? [data.semesters] : []),
            // Ensure numClasses is set
            numClasses: data.numClasses || 1
          });
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
      const result = await courseService.deleteCourse(id!);
      
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

  if (!course.course_id) {
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
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Course ID
            </Typography>
            <Typography variant="h6">
              {course.course_id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Program
            </Typography>
            <Typography variant="h6">
              {course.program?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {course.program_id}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="h6">
              {course.duration_minutes} minutes
            </Typography>
          </Grid> 
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Number of Classes
            </Typography>
            <Typography variant="h6">
              {course.numClasses || 1}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Semester
            </Typography>
            <Typography variant="h6">
              {Array.isArray(course.semesters) 
                ? course.semesters.join(', ') 
                : course.semesters || 'Not specified'}
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

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Program Associations
        </Typography>
  
        {course.programs && course.programs.length > 0 ? (
          <Grid container spacing={2}>
            {course.programs.map((program: any) => (
              <Grid item xs={12} md={6} key={program.program_id}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {program.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Department: {program.department_id}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {program.is_core === true && (
                        <Chip 
                          label="Core Course" 
                          color="primary" 
                          size="small"
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      )}
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    component={Link}
                    to={`/admin/programs/${program.program_id}`}
                  >
                    View Program
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            This course is not associated with any programs
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