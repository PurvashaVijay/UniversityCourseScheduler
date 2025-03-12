// src/pages/professor/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Button,
  Chip,
} from '@mui/material';
import { 
  AccessTime as AccessTimeIcon, 
  Event as EventIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// This would be replaced with actual API calls
const fetchProfessorDashboardData = async (professorId: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    coursesThisSemester: [
      { id: 'COURSE-1', name: 'Introduction to Computer Science', day: 'Monday', timeSlot: '9:10 AM - 10:05 AM' },
      { id: 'COURSE-2', name: 'Data Structures', day: 'Wednesday', timeSlot: '11:30 AM - 12:25 PM' },
      { id: 'COURSE-3', name: 'Algorithm Design', day: 'Friday', timeSlot: '1:30 PM - 3:40 PM' },
    ],
    availabilityStatus: {
      submitted: true,
      lastUpdated: '2024-08-15T14:30:00Z',
    },
    currentSemester: {
      name: 'Fall 2024',
      startDate: '2024-09-01',
      endDate: '2024-12-15',
    }
  };
};

const ProfessorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        const data = await fetchProfessorDashboardData(user.id);
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.firstName} {user?.lastName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Availability Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccessTimeIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Availability Status</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Chip 
                    label={dashboardData.availabilityStatus.submitted ? "Submitted" : "Not Submitted"} 
                    color={dashboardData.availabilityStatus.submitted ? "success" : "error"} 
                    sx={{ mb: 1 }}
                  />
                  {dashboardData.availabilityStatus.submitted && (
                    <Typography variant="body2" color="text.secondary">
                      Last updated: {new Date(dashboardData.availabilityStatus.lastUpdated).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <Button 
                  variant={dashboardData.availabilityStatus.submitted ? "outlined" : "contained"} 
                  color="primary"
                  href="/professor/availability"
                >
                  {dashboardData.availabilityStatus.submitted ? "Update Availability" : "Set Availability"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Semester Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SchoolIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Current Semester</Typography>
              </Box>
              
              <Typography variant="body1">{dashboardData.currentSemester.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(dashboardData.currentSemester.startDate).toLocaleDateString()} - 
                {new Date(dashboardData.currentSemester.endDate).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Courses This Semester */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              My Courses This Semester
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData.coursesThisSemester.length > 0 ? (
              <Grid container spacing={2}>
                {dashboardData.coursesThisSemester.map((course: any) => (
                  <Grid item xs={12} sm={6} md={4} key={course.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">{course.name}</Typography>
                        <Box display="flex" alignItems="center" mt={1}>
                          <EventIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {course.day}, {course.timeSlot}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2">No courses assigned for this semester yet.</Typography>
            )}
            
            <Box mt={3}>
              <Button variant="outlined" color="primary" href="/professor/schedule">
                View Full Schedule
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfessorDashboard;