import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import { 
  School as SchoolIcon, 
  Group as GroupIcon, 
  Book as BookIcon, 
  Warning as WarningIcon 
} from '@mui/icons-material';

// This would be replaced with actual API calls
const fetchDashboardData = async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    departmentCount: 5,
    programCount: 12,
    courseCount: 78,
    professorCount: 60,
    conflictCount: 8,
    currentSemester: {
      name: 'Fall 2024',
      startDate: '2024-09-01',
      endDate: '2024-12-15',
    },
    recentConflicts: [
      { id: 'CONF-1', type: 'TIME_SLOT_CONFLICT', description: 'Professor Smith has two courses at the same time' },
      { id: 'CONF-2', type: 'NO_AVAILABLE_SLOT', description: 'No suitable time slot for Advanced Algorithms' },
    ]
  };
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

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
        Current Semester: {dashboardData.currentSemester.name}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SchoolIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">{dashboardData.departmentCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Departments</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BookIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">{dashboardData.courseCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Courses</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <GroupIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">{dashboardData.professorCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Professors</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon fontSize="large" color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">{dashboardData.conflictCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Scheduling Conflicts</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Conflicts Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Conflicts
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData.recentConflicts.length > 0 ? (
              dashboardData.recentConflicts.map((conflict: any) => (
                <Box key={conflict.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error">
                    {conflict.type}
                  </Typography>
                  <Typography variant="body2">
                    {conflict.description}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2">No conflicts to display</Typography>
            )}
          </Paper>
        </Grid>

        {/* Schedule Status Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Schedule Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                Current Semester: {dashboardData.currentSemester.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(dashboardData.currentSemester.startDate).toLocaleDateString()} - 
                {new Date(dashboardData.currentSemester.endDate).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1">
                Quick Actions:
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item>
                  <Button variant="contained" color="primary">
                    Generate Schedule
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="outlined">
                    View Current Schedule
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;