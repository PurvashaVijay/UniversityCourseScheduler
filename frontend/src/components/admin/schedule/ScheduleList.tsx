// src/components/admin/schedule/ScheduleList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import scheduleService, { Schedule, ScheduledCourse, TimeSlot } from '../../../services/scheduleService';
import semesterService from '../../../services/semesterService';

interface Semester {
  semester_id: string;
  name: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

type ViewMode = 'day' | 'week';

interface ScheduleListProps {
  selectedScheduleId?: string;
  forceRefresh?: number; // A counter that when incremented will force a refresh
  onScheduleDeleted?: () => void; // New callback for when a schedule is deleted
}

const ScheduleList: React.FC<ScheduleListProps> = ({ 
  selectedScheduleId, 
  forceRefresh = 0,
  onScheduleDeleted 
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  // Changed default view mode to 'week' instead of 'day'
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  
  // New state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string>('');
  const [scheduleNameToDelete, setScheduleNameToDelete] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Load semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const data = await semesterService.getAllSemesters();
        setSemesters(data);
        
        if (data.length > 0) {
          // Select the most recent semester by default
          const sortedSemesters = [...data].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setSelectedSemester(sortedSemesters[0].semester_id);
        }
      } catch (error) {
        console.error('Error fetching semesters:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load semesters',
          severity: 'error'
        });
      }
    };

    fetchSemesters();
  }, []);

  // Load schedules for selected semester
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedSemester) return;
      
      try {
        setLoading(true);
        console.log('Fetching schedules for semester:', selectedSemester);
        console.log('Current forceRefresh value:', forceRefresh);
        
        const data = await scheduleService.getSchedulesBySemester(selectedSemester);
        console.log('Fetched schedules:', data);
        setSchedules(data);
        
        // If there's a selected schedule ID from props, use it
        if (selectedScheduleId && data.some(s => s.schedule_id === selectedScheduleId)) {
          console.log('Setting selected schedule to selectedScheduleId:', selectedScheduleId);
          setSelectedSchedule(selectedScheduleId);
        } else if (data.length > 0) {
          console.log('Setting selected schedule to first schedule:', data[0].schedule_id);
          setSelectedSchedule(data[0].schedule_id);
        } else {
          console.log('No schedules found, clearing selected schedule');
          setSelectedSchedule('');
          setScheduledCourses([]);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load schedules for semester',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    // Add more detailed logging
    console.log('Schedules useEffect triggered');
    console.log('Selected semester:', selectedSemester);
    console.log('Selected schedule ID from props:', selectedScheduleId);
    console.log('ForceRefresh value:', forceRefresh);
    
    fetchSchedules();
  }, [selectedSemester, selectedScheduleId, forceRefresh]);

  // Load all time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const data = await scheduleService.getAllTimeSlots();
        setTimeSlots(data);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load time slots',
          severity: 'error'
        });
      }
    };

    fetchTimeSlots();
  }, []);

  // Load scheduled courses for selected schedule
  useEffect(() => {
    const fetchScheduledCourses = async () => {
      if (!selectedSchedule) return;
      
      try {
        setLoadingCourses(true);
        console.log('Fetching scheduled courses for schedule:', selectedSchedule);
        
        const data = await scheduleService.getScheduledCourses(selectedSchedule);
        console.log('Fetched scheduled courses:', data.length);
        setScheduledCourses(data);
      } catch (error) {
        console.error('Error fetching scheduled courses:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load scheduled courses',
          severity: 'error'
        });
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchScheduledCourses();
  }, [selectedSchedule]);

  const handleSemesterChange = (event: any) => {
    setSelectedSemester(event.target.value);
  };

  const handleScheduleChange = (event: any) => {
    setSelectedSchedule(event.target.value);
  };

  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
    if (newViewMode) {
      setViewMode(newViewMode);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // New functions for schedule deletion
  const handleDeleteClick = (scheduleId: string, scheduleName: string) => {
    setScheduleToDelete(scheduleId);
    setScheduleNameToDelete(scheduleName);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setScheduleToDelete('');
    setScheduleNameToDelete('');
  };

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    
    try {
      setDeleteLoading(true);
      await scheduleService.deleteSchedule(scheduleToDelete);
      
      setSnackbar({
        open: true,
        message: 'Schedule deleted successfully',
        severity: 'success'
      });
      
      // Remove the deleted schedule from state
      const updatedSchedules = schedules.filter(s => s.schedule_id !== scheduleToDelete);
      setSchedules(updatedSchedules);
      
      // Update selected schedule if the deleted one was selected
      if (selectedSchedule === scheduleToDelete) {
        if (updatedSchedules.length > 0) {
          setSelectedSchedule(updatedSchedules[0].schedule_id);
        } else {
          setSelectedSchedule('');
          setScheduledCourses([]);
        }
      }
      
      // Call the callback if provided
      if (onScheduleDeleted) {
        onScheduleDeleted();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete schedule',
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
      handleCloseDeleteDialog();
    }
  };

  // Helper function to get time slots for a specific day
  const getTimeSlotsForDay = (day: string) => {
    return timeSlots
      .filter(slot => slot.day_of_week === day)
      .sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.start_time}`).getTime();
        const timeB = new Date(`1970-01-01T${b.start_time}`).getTime();
        return timeA - timeB;
      });
  };

  // Helper function to get courses scheduled for a specific time slot and day
  const getCoursesForTimeSlot = (timeslotId: string, day: string) => {
    return scheduledCourses.filter(
      course => course.timeslot_id === timeslotId && course.day_of_week === day
    );
  };

  // Get all unique time slots across all days sorted by start time
  const getUniqueTimeSlots = () => {
    // Map to store unique time slots by time range
    // Key format: "start_time-end_time"
    const uniqueSlots = new Map<string, TimeSlot[]>();
    
    // Group time slots by time range (regardless of day)
    timeSlots.forEach(slot => {
      const timeKey = `${slot.start_time}-${slot.end_time}`;
      if (!uniqueSlots.has(timeKey)) {
        uniqueSlots.set(timeKey, []);
      }
      uniqueSlots.get(timeKey)?.push(slot);
    });
    
    // Convert the map to array and sort by start time
    return Array.from(uniqueSlots.entries())
      .map(([_, slots]) => slots[0]) // Take the first slot from each group
      .sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.start_time}`).getTime();
        const timeB = new Date(`1970-01-01T${b.start_time}`).getTime();
        return timeA - timeB;
      });
  };

  // Find the timeslot ID for a specific time range and day
  const getTimeslotIdForTimeAndDay = (timeStart: string, timeEnd: string, day: string) => {
    const slot = timeSlots.find(
      s => s.start_time === timeStart && s.end_time === timeEnd && s.day_of_week === day
    );
    return slot?.timeslot_id;
  };

  // Render a schedule cell (containing courses for a specific time slot and day)
  const renderScheduleCell = (timeslotId: string, day: string) => {
    // Early return if timeslotId is undefined (may happen in week view for some combinations)
    if (!timeslotId) return <Box sx={{ height: '100%', minHeight: '60px' }}></Box>;
    
    const courses = getCoursesForTimeSlot(timeslotId, day);
    
    if (courses.length === 0) {
      return <Box sx={{ height: '100%', minHeight: '60px' }}></Box>;
    }
    
    return (
      <Box sx={{ p: 1 }}>
        {courses.map((course, index) => {
          // Safely check if course has is_core property through the course object
          const isCoreClass = course.course && 'is_core' in course.course ? 
            Boolean(course.course.is_core) : false;
            
          return (
            <Box 
              key={course.scheduled_course_id}
              sx={{ 
                mb: index !== courses.length - 1 ? 1 : 0,
                p: 1,
                borderRadius: 1,
                bgcolor: course.is_override ? '#fff3cd' : (isCoreClass ? '#e3f2fd' : '#f1f8e9')
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {course.course_id} - {course.course?.course_name || 'Unnamed Course'}
              </Typography>
              <Typography variant="caption" display="block">
                Prof: {course.professor?.first_name || ''} {course.professor?.last_name || ''}
              </Typography>
              {course.is_override && (
                <Chip 
                  label="Manual Override" 
                  size="small"
                  color="warning"
                  sx={{ mt: 0.5, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  // Render the day view (current view)
  const renderDayView = () => {
    return (
      <Box sx={{ mt: 2 }}>
        {DAYS_OF_WEEK.map((day, dayIndex) => {
          const dayTimeSlots = getTimeSlotsForDay(day);
          
          if (dayTimeSlots.length === 0) return null;
          
          return (
            <Box key={day} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                borderBottom: '2px solid #00539F', 
                pb: 1,
                color: '#00539F',
                fontWeight: 'bold'
              }}>
                {day}
              </Typography>
              
              <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell width="20%">Time Slot</TableCell>
                      <TableCell>Scheduled Courses</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dayTimeSlots.map((slot, index) => (
                      <TableRow 
                        key={slot.timeslot_id}
                        sx={{
                          borderBottom: index < dayTimeSlots.length - 1 ? '1px solid #e0e0e0' : 'none',
                          '&:nth-of-type(odd)': { bgcolor: '#fafafa' }
                        }}
                      >
                        <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {slot.name}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {renderScheduleCell(slot.timeslot_id, day)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Add space between days */}
              {dayIndex < DAYS_OF_WEEK.length - 1 && (
                <Box sx={{ height: '30px' }} />
              )}
            </Box>
          );
        })}
      </Box>
    );
  };

  // Render the new week view
  const renderWeekView = () => {
    const uniqueTimeSlots = getUniqueTimeSlots();
    
    return (
      <Box sx={{ mt: 2 }}>
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell width="15%" sx={{ borderBottom: '2px solid #00539F' }}>Time Slot</TableCell>
                {DAYS_OF_WEEK.map(day => (
                  <TableCell 
                    key={day} 
                    align="center" 
                    width={`${85/DAYS_OF_WEEK.length}%`}
                    sx={{ 
                      borderBottom: '2px solid #00539F',
                      color: '#00539F',
                      fontWeight: 'bold'
                    }}
                  >
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {uniqueTimeSlots.map((timeSlot, index) => (
                <TableRow 
                  key={`${timeSlot.start_time}-${timeSlot.end_time}`}
                  sx={{
                    borderBottom: index < uniqueTimeSlots.length - 1 ? '1px solid #e0e0e0' : 'none',
                    '&:nth-of-type(odd)': { bgcolor: '#fafafa' }
                  }}
                >
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {timeSlot.name}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {timeSlot.start_time.substring(0, 5)} - {timeSlot.end_time.substring(0, 5)}
                    </Typography>
                  </TableCell>
                  
                  {DAYS_OF_WEEK.map((day, dayIndex) => {
                    const timeslotId = getTimeslotIdForTimeAndDay(
                      timeSlot.start_time, 
                      timeSlot.end_time, 
                      day
                    );
                    
                    return (
                      <TableCell 
                        key={`${timeSlot.start_time}-${day}`} 
                        sx={{ 
                          minWidth: '150px',
                          borderRight: dayIndex < DAYS_OF_WEEK.length - 1 ? '1px solid #e0e0e0' : 'none'
                        }}
                      >
                        {timeslotId && renderScheduleCell(timeslotId, day)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Custom rendering of the MenuItem with a delete button
  const renderScheduleMenuItem = (schedule: Schedule) => (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        width: '100%',
        pr: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {schedule.is_final && (
          <ListItemIcon sx={{ minWidth: 32 }}>
            <CheckCircleIcon color="success" fontSize="small" />
          </ListItemIcon>
        )}
        <ListItemText>
          {schedule.name}
        </ListItemText>
      </Box>
      
      <IconButton
        size="small"
        color="error"
        onClick={(event) => {
          event.stopPropagation(); // Prevent the MenuItem from being selected
          handleDeleteClick(schedule.schedule_id, schedule.name);
        }}
        sx={{ 
          visibility: 'hidden', 
          '.MuiMenuItem-root:hover &': { visibility: 'visible' } 
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <Box>
      <Card sx={{ mb: 4, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Course Schedule
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <FormControl fullWidth sx={{ flex: 1 }}>
              <InputLabel id="semester-select-label">Semester</InputLabel>
              <Select
                labelId="semester-select-label"
                id="semester-select"
                value={selectedSemester}
                label="Semester"
                onChange={handleSemesterChange}
                disabled={loading}
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester.semester_id} value={semester.semester_id}>
                    {semester.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ flex: 1 }}>
              <InputLabel id="schedule-select-label">Schedule</InputLabel>
              <Select
                labelId="schedule-select-label"
                id="schedule-select"
                value={selectedSchedule}
                label="Schedule"
                onChange={handleScheduleChange}
                disabled={loading || schedules.length === 0}
                MenuProps={{
                  PaperProps: {
                    sx: { 
                      maxHeight: 300,
                      '& .MuiMenuItem-root': {
                        padding: '4px 16px',
                        '&:hover': {
                          '& .MuiIconButton-root': {
                            visibility: 'visible'
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {schedules.length === 0 ? (
                  <MenuItem value="">
                    <em>No schedules available</em>
                  </MenuItem>
                ) : (
                  schedules.map((schedule) => (
                    <MenuItem key={schedule.schedule_id} value={schedule.schedule_id}>
                      {renderScheduleMenuItem(schedule)}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              disabled={loading || loadingCourses}
              sx={{ height: { sm: '56px' } }}
            >
              {/* Swapped the order of toggle buttons so Week View comes first */}
              <ToggleButton value="week" aria-label="week view">
                <ViewWeekIcon sx={{ mr: 1 }} />
                Week View
              </ToggleButton>
              <ToggleButton value="day" aria-label="day view">
                <ViewDayIcon sx={{ mr: 1 }} />
                Day View
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Legend:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#e3f2fd', borderRadius: 1, mr: 0.5 }}></Box>
                  <Typography variant="caption">Core Courses</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#f1f8e9', borderRadius: 1, mr: 0.5 }}></Box>
                  <Typography variant="caption">Elective Courses</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#fff3cd', borderRadius: 1, mr: 0.5 }}></Box>
                  <Typography variant="caption">Manual Override</Typography>
                </Box>
              </Box>
            </Box>
            
            {scheduledCourses.length > 0 && (
              <Typography variant="body2">
                {scheduledCourses.length} courses scheduled
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {loadingCourses ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : schedules.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No schedules available for the selected semester. Generate a schedule first.
        </Alert>
      ) : scheduledCourses.length === 0 && selectedSchedule ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No courses scheduled yet.
        </Alert>
      ) : (
        viewMode === 'day' ? renderDayView() : renderWeekView()
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Schedule"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the schedule "<strong>{scheduleNameToDelete}</strong>"? 
            This action cannot be undone and will permanently remove all scheduled courses 
            associated with this schedule.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog} 
            color="inherit"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            autoFocus
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleList;