// src/components/admin/schedule/ActiveSchedule.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  //CalendarViewWeek as CalendarIcon
} from '@mui/icons-material';
import scheduleService from '../../../services/scheduleService';
import semesterService from '../../../services/semesterService';
import { SelectChangeEvent } from '@mui/material/Select';

const ActiveSchedule: React.FC = () => {
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [viewMode, setViewMode] = useState<string>('week');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentDay, setCurrentDay] = useState<number>(0); // 0 = Monday, etc.
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { id: 1, start: '09:10', end: '10:05' },
    { id: 2, start: '10:20', end: '11:15' },
    { id: 3, start: '11:30', end: '12:25' },
    { id: 4, start: '12:45', end: '14:05' },
    { id: 5, start: '13:30', end: '14:50' },
    { id: 6, start: '17:30', end: '20:30' },
    { id: 7, start: '18:00', end: '21:00' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch available semesters
        const semestersData = await semesterService.getAllSemesters();
        setSemesters(semestersData);
        
        // Set current semester if available
        if (semestersData.length > 0) {
          const currentSemester = semestersData.find((s: any) => s.is_current) || semestersData[0];
          setSelectedSemester(currentSemester.semester_id);
          
          // Fetch active schedule for the semester
          const scheduleData = await scheduleService.getActiveSchedule(currentSemester.semester_id);
          setActiveSchedule(scheduleData);
        }
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError('Failed to load schedule data. Please ensure your backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch schedule when semester changes
  useEffect(() => {
    if (selectedSemester) {
      const fetchSchedule = async () => {
        try {
          setLoading(true);
          const scheduleData = await scheduleService.getActiveSchedule(selectedSemester);
          setActiveSchedule(scheduleData);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching schedule for semester:', err);
          setError('Failed to load schedule for selected semester.');
          setLoading(false);
        }
      };
      
      fetchSchedule();
    }
  }, [selectedSemester]);

  const handleSemesterChange = (event: SelectChangeEvent) => {
    setSelectedSemester(event.target.value as string);
  };

  const handleViewModeChange = (event: React.ChangeEvent<{}>, newValue: string) => {
    setViewMode(newValue);
  };

  const handleDayChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setCurrentDay(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Helper function to get background color based on course type
  const getCourseColor = (course: any) => {
    if (course.is_core) {
      return 'rgba(25, 118, 210, 0.8)'; // Blue for core courses
    }
    return 'rgba(76, 175, 80, 0.8)'; // Green for electives
  };

  // Helper function to check if a course has conflicts
  const hasConflict = (course: any) => {
    return course.conflicts && course.conflicts.length > 0;
  };

  // Filter courses based on search term
  const filterCourses = (courses: any[]) => {
    if (!searchTerm) return courses;
    
    const search = searchTerm.toLowerCase();
    return courses.filter(course => 
      course.course_name.toLowerCase().includes(search) ||
      course.course_id.toLowerCase().includes(search) ||
      (course.professor_name && course.professor_name.toLowerCase().includes(search))
    );
  };

  // Render course block
  const renderCourseBlock = (course: any) => {
    return (
      <Box
        key={course.scheduled_course_id}
        sx={{
          backgroundColor: getCourseColor(course),
          color: 'white',
          p: 1,
          borderRadius: 1,
          mb: 1,
          position: 'relative',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
          }
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" noWrap>
          {course.course_name}
        </Typography>
        <Typography variant="caption" display="block" noWrap>
          {course.course_id}
        </Typography>
        <Typography variant="caption" display="block" noWrap>
          Prof. {course.professor_name || 'TBA'}
        </Typography>
        <Typography variant="caption" display="block" noWrap>
          Room: {course.room || 'TBA'}
        </Typography>
        
        {hasConflict(course) && (
          <Tooltip title="This course has scheduling conflicts">
            <WarningIcon 
              sx={{ 
                position: 'absolute', 
                top: 5, 
                right: 5, 
                color: 'orange',
                fontSize: 20
              }} 
            />
          </Tooltip>
        )}
      </Box>
    );
  };

  // Render weekly view
  const renderWeekView = () => {
    if (!activeSchedule || !activeSchedule.courses || activeSchedule.courses.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No schedule data available for this semester.</Typography>
        </Paper>
      );
    }

    const filteredCourses = filterCourses(activeSchedule.courses);

    return (
      <Paper sx={{ mt: 2, overflowX: 'auto' }}>
        <Box sx={{ minWidth: 800 }}>
          <Grid container>
            {/* Time slots column */}
            <Grid item xs={1}>
              <Box sx={{ borderRight: 1, borderColor: 'divider', height: '100%', pt: 7 }}>
                {timeSlots.map(slot => (
                  <Box 
                    key={slot.id} 
                    sx={{ 
                      height: 120, 
                      p: 1, 
                      borderBottom: 1, 
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="caption">
                      {slot.start} - {slot.end}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Days columns */}
            {daysOfWeek.map((day, index) => (
              <Grid item xs key={day}>
                <Box sx={{ borderRight: index < 4 ? 1 : 0, borderColor: 'divider' }}>
                  {/* Day header */}
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderBottom: 1, 
                      borderColor: 'divider',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      bgcolor: 'grey.100'
                    }}
                  >
                    <Typography variant="subtitle1">{day}</Typography>
                  </Box>

                  {/* Time slots */}
                  {timeSlots.map(slot => {
                    const courseForSlot = filteredCourses.filter((course: any) => 
                      course.day_of_week === day && 
                      course.time_slot_id === `TS${slot.id}-${day.substring(0, 3).toUpperCase()}`
                    );

                    return (
                      <Box 
                        key={`${day}-${slot.id}`}
                        sx={{ 
                          height: 120, 
                          p: 1, 
                          borderBottom: 1, 
                          borderColor: 'divider',
                          overflow: 'auto'
                        }}
                      >
                        {courseForSlot.map((course: any) => renderCourseBlock(course))}
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    );
  };

  // Render day view
  const renderDayView = () => {
    if (!activeSchedule || !activeSchedule.courses || activeSchedule.courses.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No schedule data available for this semester.</Typography>
        </Paper>
      );
    }

    const day = daysOfWeek[currentDay];
    const filteredCourses = filterCourses(activeSchedule.courses)
      .filter((course: any) => course.day_of_week === day);

    return (
      <Paper sx={{ mt: 2 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {day}'s Schedule
          </Typography>
          <Grid container spacing={2}>
            {timeSlots.map(slot => {
              const courseForSlot = filteredCourses.filter((course: any) => 
                course.time_slot_id === `TS${slot.id}-${day.substring(0, 3).toUpperCase()}`
              );

              return (
                <Grid item xs={12} key={slot.id}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderLeft: 4, 
                      borderColor: courseForSlot.length > 0 ? 'primary.main' : 'grey.300'
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary">
                      {slot.start} - {slot.end}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {courseForSlot.length > 0 ? (
                        courseForSlot.map((course: any) => renderCourseBlock(course))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No courses scheduled
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Active Schedule
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="semester-select-label">Semester</InputLabel>
                  <Select
                    labelId="semester-select-label"
                    value={selectedSemester}
                    onChange={handleSemesterChange}
                    label="Semester"
                  >
                    {semesters.map((semester: any) => (
                      <MenuItem key={semester.semester_id} value={semester.semester_id}>
                        {semester.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Courses"
                  variant="outlined"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by course name, ID, or professor"
                  InputProps={{
                    endAdornment: <SearchIcon color="action" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                <Tooltip title="The Active Schedule shows the current finalized schedule for the selected semester">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Filter courses">
                  <IconButton>
                    <FilterIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={viewMode} onChange={handleViewModeChange}>
            <Tab label="Week View" value="week" />
            <Tab label="Day View" value="day" />
          </Tabs>
        </Box>

        {viewMode === 'day' && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentDay} onChange={handleDayChange}>
              {daysOfWeek.map((day, index) => (
                <Tab key={day} label={day} value={index} />
              ))}
            </Tabs>
          </Box>
        )}

        {viewMode === 'week' ? renderWeekView() : renderDayView()}

        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(25, 118, 210, 0.8)', mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Core Course</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.8)', mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Elective Course</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ color: 'orange', fontSize: 16, mr: 1 }} />
            <Typography variant="caption">Scheduling Conflict</Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default ActiveSchedule;