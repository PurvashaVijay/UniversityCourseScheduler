// src/components/admin/schedules/ScheduleView.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Tooltip,
  TextField
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

// Import services
import scheduleService from '../../../services/scheduleService';
import departmentService from '../../../services/departmentService';
import programService from '../../../services/programService';


const ScheduleView: React.FC = () => {
  const navigate = useNavigate();
  
  // State variables
  const [schedule, setSchedule] = useState<any>(null);
  const [scheduledCourses, setScheduledCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<string>('week');
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolvedConflicts, setShowResolvedConflicts] = useState<boolean>(false);
  
  // Days and time slots for schedule display
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { id: 1, name: 'Time Slot 1', start: '09:10', end: '10:05' },
    { id: 2, name: 'Time Slot 2', start: '10:20', end: '11:15' },
    { id: 3, name: 'Time Slot 3', start: '11:30', end: '12:25' },
    { id: 4, name: 'Time Slot 4', start: '12:45', end: '14:05' },
    { id: 5, name: 'Time Slot 5', start: '13:30', end: '14:50' },
    { id: 6, name: 'Time Slot 6', start: '17:30', end: '20:30' },
    { id: 7, name: 'Time Slot 7', start: '18:00', end: '21:00' }
  ];

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock semester data for now, replace with API call when ready
        const semestersData = [
          { semester_id: 'SEM-001', name: 'Fall 2023', is_current: true },
          { semester_id: 'SEM-002', name: 'Spring 2024', is_current: false }
        ];
        
        // Get departments and programs
        let departmentsData = [];
        let programsData = [];
        
        try {
          departmentsData = await departmentService.getAllDepartments();
        } catch (err) {
          console.error("Error fetching departments:", err);
          departmentsData = [
            { department_id: 'DEPT-001', name: 'Computer Science', description: 'Department of Computer Science' },
            { department_id: 'DEPT-002', name: 'Data Science', description: 'Department of Data Science' },
            { department_id: 'DEPT-003', name: 'Business', description: 'Department of Business' }
          ];
        }
        
        try {
          programsData = await programService.getAllPrograms();
        } catch (err) {
          console.error("Error fetching programs:", err);
          programsData = [
            { program_id: 'PROG-001', department_id: 'DEPT-001', name: 'Computer Science', description: 'Master of Science in Computer Science' },
            { program_id: 'PROG-002', department_id: 'DEPT-002', name: 'Data Science', description: 'Master of Science in Data Science' },
            { program_id: 'PROG-003', department_id: 'DEPT-003', name: 'MBA', description: 'Master of Business Administration' }
          ];
        }
        
        setSemesters(semestersData);
        setDepartments(departmentsData);
        setPrograms(programsData);
        
        // Set current semester if available
        if (semestersData.length > 0) {
          const currentSemester = semestersData.find((s: any) => s.is_current) || semestersData[0];
          setSelectedSemester(currentSemester.semester_id);
          
          try {
            const scheduleData = await scheduleService.getActiveSchedule(currentSemester.semester_id);
            const conflictsData = await scheduleService.getScheduleConflicts(scheduleData.schedule_id);
            
            setSchedule(scheduleData);
            setScheduledCourses(scheduleData.courses || []);
            setFilteredCourses(scheduleData.courses || []);
            setConflicts(conflictsData);
          } catch (err) {
            console.error("Error fetching schedule data:", err);
            setError("Failed to load schedule data. The backend may not be running.");
          }
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please ensure your backend server is running.');
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
          const conflictsData = await scheduleService.getScheduleConflicts(scheduleData.schedule_id);
          
          setSchedule(scheduleData);
          setScheduledCourses(scheduleData.courses || []);
          setFilteredCourses(scheduleData.courses || []);
          setConflicts(conflictsData);
          
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
  
  // Apply filters when department, program, or search term changes
  useEffect(() => {
    if (!scheduledCourses.length) return;
    
    let filtered = [...scheduledCourses];
    
    // Filter by department
    if (selectedDepartment) {
      filtered = filtered.filter(course => 
        course.department_id === selectedDepartment
      );
    }
    
    // Filter by program
    if (selectedProgram) {
      filtered = filtered.filter(course => 
        course.program_ids?.includes(selectedProgram)
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.course_name.toLowerCase().includes(search) ||
        course.course_id.toLowerCase().includes(search) ||
        (course.professor_name && course.professor_name.toLowerCase().includes(search))
      );
    }
    
    setFilteredCourses(filtered);
  }, [scheduledCourses, selectedDepartment, selectedProgram, searchTerm]);
  
  const handleDepartmentChange = (event: SelectChangeEvent) => {
    const deptId = event.target.value as string;
    setSelectedDepartment(deptId);
    
    // Reset program selection when department changes
    setSelectedProgram('');
  };
  
  const handleProgramChange = (event: SelectChangeEvent) => {
    setSelectedProgram(event.target.value as string);
  };
  
  const handleSemesterChange = (event: SelectChangeEvent) => {
    setSelectedSemester(event.target.value as string);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleViewModeChange = (event: React.SyntheticEvent, newValue: string) => {
    setViewMode(newValue);
  };
  
  const handleDayChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentDay(newValue);
  };
  
  const handleRefresh = async () => {
    if (!selectedSemester || !schedule) return;
    
    setLoading(true);
    try {
      const scheduleData = await scheduleService.getActiveSchedule(selectedSemester);
      const conflictsData = await scheduleService.getScheduleConflicts(scheduleData.schedule_id);
      
      setSchedule(scheduleData);
      setScheduledCourses(scheduleData.courses || []);
      setFilteredCourses(scheduleData.courses || []);
      setConflicts(conflictsData);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateSchedule = () => {
    navigate('/admin/schedules/generate');
  };

  // Function to determine background color for course blocks
  const getCourseColor = (course: any) => {
    if (course.is_override) return 'rgba(255, 152, 0, 0.8)'; // Orange for overrides
    if (course.is_core) return 'rgba(25, 118, 210, 0.8)'; // Blue for core courses
    return 'rgba(76, 175, 80, 0.8)'; // Green for electives
  };

  // Helper function to check if a course has conflicts
  const hasConflict = (course: any) => {
    return conflicts.some(conflict => 
      conflict.courses.some((c: any) => c.scheduled_course_id === course.scheduled_course_id) &&
      !conflict.is_resolved
    );
  };

  // Function to find courses for a specific timeslot and day
  const getCoursesForTimeSlot = (timeSlotId: number, day: string) => {
    return filteredCourses.filter(course => 
      course.day_of_week === day && 
      course.time_slot_id === `TS${timeSlotId}-${day.substring(0, 3).toUpperCase()}`
    );
  };

  // Function to accept a conflict
  const handleAcceptConflict = async (conflictId: string) => {
    try {
      await scheduleService.resolveConflict(conflictId, {
        action: 'ACCEPT',
        notes: 'Conflict accepted by administrator'
      });
      
      // Update local state
      setConflicts(conflicts.map(conflict => 
        conflict.conflict_id === conflictId 
          ? { ...conflict, is_resolved: true, resolution_notes: 'Conflict accepted by administrator' }
          : conflict
      ));
    } catch (err) {
      console.error("Error accepting conflict:", err);
      setError("Failed to accept conflict");
    }
  };

  // Function to override a conflict
  const handleOverrideConflict = async (conflictId: string) => {
    // In a real implementation, this would open a dialog to collect details
    try {
      // Simplified implementation for now
      setConflicts(conflicts.map(conflict => 
        conflict.conflict_id === conflictId 
          ? { ...conflict, is_resolved: true, resolution_notes: 'Conflict overridden by administrator' }
          : conflict
      ));
    } catch (err) {
      console.error("Error overriding conflict:", err);
      setError("Failed to override conflict");
    }
  };

  // Function to render a course block in the timetable
  const renderCourseBlock = (course: any) => {
    const courseHasConflict = hasConflict(course);
    
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
        
        {courseHasConflict && (
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
    if (!filteredCourses.length) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No schedule data available or no courses match your filters.</Typography>
        </Paper>
      );
    }

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
                <Box sx={{ borderRight: index < daysOfWeek.length - 1 ? 1 : 0, borderColor: 'divider' }}>
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
                    const coursesForSlot = getCoursesForTimeSlot(slot.id, day);

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
                        {coursesForSlot.map(course => renderCourseBlock(course))}
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
    if (!filteredCourses.length) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No schedule data available or no courses match your filters.</Typography>
        </Paper>
      );
    }

    const day = daysOfWeek[currentDay];
    const dayFilteredCourses = filteredCourses.filter(course => course.day_of_week === day);

    return (
      <Paper sx={{ mt: 2 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {day}'s Schedule
          </Typography>
          <Grid container spacing={2}>
            {timeSlots.map(slot => {
              const coursesForSlot = dayFilteredCourses.filter(course => 
                course.time_slot_id === `TS${slot.id}-${day.substring(0, 3).toUpperCase()}`
              );

              return (
                <Grid item xs={12} key={slot.id}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderLeft: 4, 
                      borderColor: coursesForSlot.length > 0 ? 'primary.main' : 'grey.300'
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary">
                      {slot.start} - {slot.end}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {coursesForSlot.length > 0 ? (
                        coursesForSlot.map(course => renderCourseBlock(course))
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

  // Function to render the conflicts section
  const renderConflicts = () => {
    const displayConflicts = showResolvedConflicts 
      ? conflicts 
      : conflicts.filter(conflict => !conflict.is_resolved);
    
    if (displayConflicts.length === 0) {
      return (
        <Alert severity="success" sx={{ mt: 3 }}>
          No unresolved conflicts in this schedule.
        </Alert>
      );
    }
    
    return (
      <Paper sx={{ mt: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Conflicts ({displayConflicts.length})
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setShowResolvedConflicts(!showResolvedConflicts)}
          >
            {showResolvedConflicts ? 'Hide Resolved' : 'Show Resolved'}
          </Button>
        </Box>
        
        <Grid container spacing={2}>
          {displayConflicts.map(conflict => (
            <Grid item xs={12} key={conflict.conflict_id}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  borderLeft: 4, 
                  borderColor: conflict.is_resolved ? 'success.main' : 'warning.main'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {conflict.conflict_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {conflict.description}
                    </Typography>
                    <Typography variant="body2">
                      Time: {conflict.day_of_week}, {conflict.time_slot?.name || 'Unknown time slot'}
                    </Typography>
                    
                    {conflict.courses && conflict.courses.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Affected Courses:
                        </Typography>
                        {conflict.courses.map((course: any) => (
                          <Typography key={course.scheduled_course_id} variant="body2" sx={{ ml: 2 }}>
                            • {course.course_name} (Prof. {course.professor_name})
                          </Typography>
                        ))}
                      </Box>
                    )}
                    
                    {conflict.is_resolved && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="success.contrastText">
                          <strong>Resolution:</strong> {conflict.resolution_notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {!conflict.is_resolved && (
                    <Box>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        size="small" 
                        onClick={() => handleOverrideConflict(conflict.conflict_id)}
                        sx={{ mr: 1 }}
                      >
                        Override
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleAcceptConflict(conflict.conflict_id)}
                      >
                        Accept
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Schedule
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateSchedule}
            >
              Generate New Schedule
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        
        {/* Filters */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="department-select-label">Department</InputLabel>
                  <Select
                    labelId="department-select-label"
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    label="Department"
                  >
                    <MenuItem value="">
                      <em>All Departments</em>
                    </MenuItem>
                    {departments.map((department) => (
                      <MenuItem key={department.department_id} value={department.department_id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="program-select-label">Program</InputLabel>
                  <Select
                    labelId="program-select-label"
                    value={selectedProgram}
                    onChange={handleProgramChange}
                    label="Program"
                    disabled={!selectedDepartment}
                  >
                    <MenuItem value="">
                      <em>All Programs</em>
                    </MenuItem>
                    {programs
                      .filter(program => !selectedDepartment || program.department_id === selectedDepartment)
                      .map((program) => (
                        <MenuItem key={program.program_id} value={program.program_id}>
                          {program.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  variant="outlined"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search courses"
                  InputProps={{
                    endAdornment: <SearchIcon color="action" />
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* View Mode Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={viewMode} onChange={handleViewModeChange}>
            <Tab label="Week View" value="week" />
            <Tab label="Day View" value="day" />
          </Tabs>
        </Box>

        {/* Day Selection Tabs (for Day View) */}
        {viewMode === 'day' && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentDay} onChange={handleDayChange}>
              {daysOfWeek.map((day, index) => (
                <Tab key={day} label={day} value={index} />
              ))}
            </Tabs>
          </Box>
        )}
        
        {/* Schedule Display */}
        {viewMode === 'week' ? renderWeekView() : renderDayView()}
        
        {/* Conflicts */}
        {renderConflicts()}
        
        {/* Legend */}
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(25, 118, 210, 0.8)', mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Core Course</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(76, 175, 80, 0.8)', mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Elective Course</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(255, 152, 0, 0.8)', mr: 1, borderRadius: 1 }} />
            <Typography variant="caption">Overridden Course</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <WarningIcon sx={{ color: 'orange', fontSize: 16, mr: 1 }} />
            <Typography variant="caption">Scheduling Conflict</Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default ScheduleView;