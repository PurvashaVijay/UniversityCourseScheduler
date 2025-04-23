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
  Tooltip,
  Alert
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
        console.log('Fetching professor details for ID:', id);
        
        // Fetch professor details
        const professorData = await professorService.getProfessorById(id);
        console.log('Professor data received:', professorData);
        
        // Log to see what semesters we actually have
        console.log('Professor semesters in details view:', professorData.semesters);
        
        setProfessor(professorData);
        
        // Department data should already be included in the professor details
        if (professorData.department) {
          setDepartment(professorData.department);
        } else if (professorData.department_id) {
          try {
            const departmentData = await departmentService.getDepartmentById(professorData.department_id);
            setDepartment(departmentData);
          } catch (deptErr) {
            console.error('Error fetching department:', deptErr);
          }
        }
        
        // Set assigned courses directly from the response
        if (professorData.courses && professorData.courses.length > 0) {
          console.log('Courses data found:', professorData.courses);
          setAssignedCourses(professorData.courses);
        } else {
          console.log('No courses data in response');
          setAssignedCourses([]);
        }
        
        // Fetch professor availability
        try {
          const availabilityData = await professorService.getProfessorAvailability(id);
          setAvailabilities(availabilityData);
        } catch (availErr) {
          console.error('Error fetching availability:', availErr);
        }
        
      } catch (err) {
        console.error('Error fetching professor details:', err);
        setError('Failed to fetch professor details');
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
              label={course.course_name || course.course_id}
              color={course.is_core ? "primary" : "default"}
              size="medium"
              sx={{ fontWeight: course.is_core ? 'medium' : 'normal' }}
            />
          </Tooltip>
        ))}
      </Box>
    );
  };

  // Collect all unique semesters from all courses
  const getAllSemesters = () => {
    const allSemesters = new Set<string>();
    
    // Add semesters from professor.semesters if available
    if (professor?.semesters && Array.isArray(professor.semesters)) {
      professor.semesters.forEach(semester => allSemesters.add(semester));
    }
    
    // Add from professor.course_semesters if available
    if (professor?.course_semesters) {
      Object.values(professor.course_semesters).forEach(semesters => {
        if (Array.isArray(semesters)) {
          semesters.forEach(semester => allSemesters.add(semester));
        }
      });
    }
    
    // Also add semesters from each course's professor_course association
    if (assignedCourses && assignedCourses.length > 0) {
      assignedCourses.forEach(course => {
        const semester = course.professor_course?.semester || course.semester;
        if (semester) {
          allSemesters.add(semester);
        }
      });
    }
    
    return Array.from(allSemesters);
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
        <Alert severity="error">{error || 'Professor not found'}</Alert>
      </Box>
    );
  }

  // Get all unique semesters
  const allSemesters = getAllSemesters();

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
              
              {/* Show semester tags - updated to use allSemesters */}
              {allSemesters.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">Semesters:</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {allSemesters.map(semester => (
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
                        allSemesters.length > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            {allSemesters.map(semester => (
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
                              {(() => {
                                // Get all semesters for this specific course from all sources
                                const courseSemesters = new Set<string>();
                                
                                // Check direct semester assignment on the course
                                if (course.semester) {
                                  courseSemesters.add(course.semester);
                                }
                                
                                // Check professor_course association
                                if (course.professor_course?.semester) {
                                  courseSemesters.add(course.professor_course.semester);
                                }
                                
                                // Also check course_semesters if available
                                if (professor.course_semesters && professor.course_semesters[course.course_id]) {
                                  professor.course_semesters[course.course_id].forEach(sem => 
                                    courseSemesters.add(sem)
                                  );
                                }
                                
                                // If we have allSemesters but no course-specific semesters, use allSemesters
                                if (courseSemesters.size === 0 && allSemesters.length > 0) {
                                  allSemesters.forEach(sem => courseSemesters.add(sem));
                                }
                                
                                // Convert set to array for rendering
                                const semestersArray = Array.from(courseSemesters);
                                
                                return semestersArray.length > 0 ? (
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {semestersArray.map(sem => (
                                      <Chip
                                        key={sem}
                                        label={sem}
                                        color={sem === 'Fall' ? 'warning' : 'success'}
                                        size="small"
                                      />
                                    ))}
                                  </Box>
                                ) : (
                                  'Not specified'
                                );
                              })()}
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