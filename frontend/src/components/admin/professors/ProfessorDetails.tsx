//  ProfessorDetails.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip
} from '@mui/material';
import professorService, { Professor, ProfessorAvailability } from '../../../services/professorService';
import departmentService, { Department } from '../../../services/departmentService';
import courseService, { Course } from '../../../services/courseService';
import ProfessorAvailabilityTab from './ProfessorAvailabilityTab';
import { ArrowBack, School as SemesterIcon } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`professor-tabpanel-${index}`}
      aria-labelledby={`professor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfessorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [availabilities, setAvailabilities] = useState<ProfessorAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch professor details
        const professorData = await professorService.getProfessorById(id);
        setProfessor(professorData);
        
        // Fetch department details
        const departmentData = await departmentService.getDepartmentById(professorData.department_id);
        setDepartment(departmentData);
        
        // Fetch all courses for this department
        const allCoursesData = await courseService.getAllCourses();
        
        // Filter courses assigned to this professor
        if (professorData.course_ids && professorData.course_ids.length > 0) {
          const professorCourses = allCoursesData.filter(
            course => professorData.course_ids?.includes(course.course_id)
          );
          setAssignedCourses(professorCourses);
        }
        
        // Fetch professor availability
        const availabilityData = await professorService.getProfessorAvailability(id);
        setAvailabilities(availabilityData);
        
      } catch (err) {
        setError('Failed to fetch professor details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGoBack = () => {
    navigate('/admin/professors');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Render course chips with tooltips
  const renderCourseChips = (courses: Course[]) => {
    if (courses.length === 0) {
      return <Typography variant="body2" color="text.secondary">No courses assigned</Typography>;
    }
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, my: 1 }}>
        {courses.map(course => (
          <Tooltip
            key={course.course_id}
            title={`${course.course_id} - ${course.is_core ? 'Core' : 'Elective'} - ${course.duration_minutes} mins`}
          >
            <Chip
              label={course.course_name}
              color={course.is_core ? "primary" : "default"}
              size="medium"
              sx={{ fontWeight: course.is_core ? 'medium' : 'normal' }}
            />
          </Tooltip>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !professor) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error || 'Professor not found'}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
          sx={{ mb: 2 }}
        >
          Back to Professors
        </Button>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                {`${professor.first_name} ${professor.last_name}`}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                ID: {professor.professor_id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Email: {professor.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Department: {department?.name || 'Unknown Department'}
              </Typography>
              
              {/* Show semester tags */}
              {professor.semesters && professor.semesters.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">Semesters:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {professor.semesters.map(semester => (
                      <Chip
                        key={semester}
                        label={semester}
                        color={semester === 'Fall' ? 'warning' : 'success'}
                        size="small"
                        icon={<SemesterIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Display assigned courses chips */}
              {assignedCourses.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1">Assigned Courses:</Typography>
                  {renderCourseChips(assignedCourses)}
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Created: {formatDate(professor.created_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last Updated: {formatDate(professor.updated_at)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Profile" />
            <Tab label="Courses" />
            <Tab label="Availability" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Professor Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  <ListItem divider>
                    <ListItemText
                      primary="Full Name"
                      secondary={`${professor.first_name} ${professor.last_name}`}
                    />
                  </ListItem>
                  <ListItem divider>
                    <ListItemText
                      primary="Email"
                      secondary={professor.email}
                    />
                  </ListItem>
                  <ListItem divider>
                    <ListItemText
                      primary="Department"
                      secondary={department?.name || 'Unknown Department'}
                    />
                  </ListItem>
                  <ListItem divider>
                    <ListItemText
                      primary="Professor ID"
                      secondary={professor.professor_id}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Semesters"
                      secondary={
                        professor.semesters && professor.semesters.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {professor.semesters.map(semester => (
                              <Chip
                                key={semester}
                                label={semester}
                                color={semester === 'Fall' ? 'warning' : 'success'}
                                size="small"
                              />
                            ))}
                          </Box>
                        ) : 'No semesters assigned'
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assigned Courses
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {assignedCourses.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Course ID</TableCell>
                          <TableCell>Course Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Semester</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignedCourses.map((course) => (
                          <TableRow key={course.course_id}>
                            <TableCell>{course.course_id}</TableCell>
                            <TableCell>{course.course_name}</TableCell>
                            <TableCell>{course.is_core ? 'Core' : 'Elective'}</TableCell>
                            <TableCell>{course.duration_minutes} minutes</TableCell>
                            <TableCell>
                              {course.semester ? (
                                <Chip
                                  label={course.semester}
                                  color={course.semester === 'Fall' ? 'warning' : 'success'}
                                  size="small"
                                />
                              ) : 'Not specified'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    No courses assigned to this professor yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ProfessorAvailabilityTab
              professorId={professor.professor_id}
              availabilities={availabilities}
              onAvailabilityChange={(newAvailabilities) => setAvailabilities(newAvailabilities)}
            />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfessorDetails;