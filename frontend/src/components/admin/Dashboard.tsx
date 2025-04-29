// src/components/admin/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import dashboardService from '../../services/dashboardService';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    departments: 0,
    programs: 0,
    courses: 0,
    professors: 0,
    activeSchedules: 0,
    pendingConflicts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await dashboardService.getDashboardStats();
        setData(dashboardData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const DashboardCard = ({ 
    title, 
    value, 
    icon, 
    link, 
    color = '#00539F',
    isLoading
  }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    link: string; 
    color?: string;
    isLoading: boolean;
  }) => (
    <Card sx={{ 
      minHeight: 150, 
      display: 'flex', 
      flexDirection: 'column',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: 3
      }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6" component="div" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ 
            backgroundColor: color, 
            borderRadius: '50%', 
            width: 40, 
            height: 40, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white'
          }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
          {isLoading ? <CircularProgress size={24} /> : value}
        </Typography>
      </CardContent>
      <Divider />
      <Box sx={{ p: 1 }}>
        <Button 
          component={Link} 
          to={link} 
          size="small" 
          sx={{ color: color }}
        >
          View Details
        </Button>
      </Box>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back, {user?.first_name} {user?.last_name}
        </Typography>
      </Box>

      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Departments"
            value={data.departments}
            icon={<SchoolIcon />}
            link="/admin/departments"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Programs"
            value={data.programs}
            icon={<ClassIcon />}
            link="/admin/programs"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Courses"
            value={data.courses}
            icon={<ClassIcon />}
            link="/admin/courses"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Professors"
            value={data.professors}
            icon={<PersonIcon />}
            link="/admin/professors"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Active Schedules"
            value={data.activeSchedules}
            icon={<ScheduleIcon />}
            link="/admin/schedules"
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Pending Conflicts"
            value={data.pendingConflicts}
            icon={<WarningIcon />}
            link="/admin/schedules"
            color="#f44336"
            isLoading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;