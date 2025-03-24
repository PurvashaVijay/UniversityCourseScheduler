// src/components/admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Paper, 
  Button,
  Divider
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Import services
import departmentService from '../../services/departmentService';
import programService from '../../services/programService';
import courseService from '../../services/courseService';
import professorService from '../../services/professorService';
import scheduleService from '../../services/scheduleService';
import conflictService from '../../services/conflictService';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from backend with error handling for each service
        let departments: any[] = [];
        try {
          departments = await departmentService.getAllDepartments();
        } catch (error) {
          console.error('Error fetching departments:', error);
        }
        
        let programs: any[] = [];
        try {
          programs = await programService.getAllPrograms();
        } catch (error) {
          console.error('Error fetching programs:', error);
        }
        
        let courses: any[] = [];
        try {
          courses = await courseService.getAllCourses();
        } catch (error) {
          console.error('Error fetching courses:', error);
        }
        
        let professors: any[] = [];
        try {
          professors = await professorService.getAllProfessors();
        } catch (error) {
          console.error('Error fetching professors:', error);
        }
        
        // For scheduleService, we need to handle the case where the needed methods may not exist
        let activeSchedules = 0;
        try {
          const schedules = await scheduleService.getAllSchedules();
          activeSchedules = schedules.filter(s => s.is_active).length || 0;
        } catch (error) {
          console.error('Error fetching schedules:', error);
        }
        
        let conflicts: any[] = [];
        try {
          conflicts = await conflictService.getAllConflicts();
        } catch (error) {
          console.error('Error fetching conflicts:', error);
        }
        
        setData({
          departments: departments.length,
          programs: programs.length,
          courses: courses.length,
          professors: professors.length,
          activeSchedules: activeSchedules,
          pendingConflicts: conflicts.filter((c: any) => !c.is_resolved).length || 0,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
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
    color = '#00539F' 
  }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    link: string; 
    color?: string;
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
          {loading ? '...' : value}
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Departments"
            value={data.departments}
            icon={<SchoolIcon />}
            link="/admin/departments"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Programs"
            value={data.programs}
            icon={<ClassIcon />}
            link="/admin/programs"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Courses"
            value={data.courses}
            icon={<ClassIcon />}
            link="/admin/courses"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Professors"
            value={data.professors}
            icon={<PersonIcon />}
            link="/admin/professors"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Active Schedules"
            value={data.activeSchedules}
            icon={<ScheduleIcon />}
            link="/admin/schedules"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <DashboardCard
            title="Pending Conflicts"
            value={data.pendingConflicts}
            icon={<WarningIcon />}
            link="/admin/schedules/conflicts"
            color="#f44336"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              component={Link} 
              to="/admin/courses/new"
              sx={{ bgcolor: '#00539F' }}
            >
              Add New Course
            </Button>
            <Button 
              variant="contained" 
              component={Link} 
              to="/admin/professors/new"
              sx={{ bgcolor: '#00539F' }}
            >
              Add New Professor
            </Button>
            <Button 
              variant="contained" 
              component={Link} 
              to="/admin/schedules/generate"
              sx={{ bgcolor: '#00539F' }}
            >
              Generate New Schedule
            </Button>
            <Button 
              variant="contained" 
              component={Link} 
              to="/admin/active-schedule"
              sx={{ bgcolor: '#00539F' }}
            >
              View Active Schedule
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;