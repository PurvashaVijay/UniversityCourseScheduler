// src/components/admin/schedule/CourseChangeDialog.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  FormHelperText
} from '@mui/material';
import scheduleService, { ScheduledCourse, TimeSlot } from '../../../services/scheduleService';

interface CourseChangeDialogProps {
  open: boolean;
  onClose: () => void;
  scheduledCourse: ScheduledCourse | null;
  onCourseChanged: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const CourseChangeDialog: React.FC<CourseChangeDialogProps> = ({
  open,
  onClose,
  scheduledCourse,
  onCourseChanged
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<{ [key: string]: TimeSlot[] }>({});
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Load time slots when dialog opens
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const data = await scheduleService.getAllTimeSlots();
        
        // Save all time slots
        setAllTimeSlots(data);
        
        // Group time slots by day
        const groupedSlots: { [key: string]: TimeSlot[] } = {};
        DAYS_OF_WEEK.forEach(day => {
          groupedSlots[day] = data.filter(slot => slot.day_of_week === day)
            .sort((a, b) => {
              const timeA = new Date(`1970-01-01T${a.start_time}`).getTime();
              const timeB = new Date(`1970-01-01T${b.start_time}`).getTime();
              return timeA - timeB;
            });
        });
        setTimeSlotsByDay(groupedSlots);
        
        // Set initial values if a course is selected
        if (scheduledCourse) {
          setSelectedDay(scheduledCourse.day_of_week || '');
          setSelectedTimeSlot(scheduledCourse.timeslot_id || '');
          setNotes(scheduledCourse.is_override ? `${scheduledCourse.override_reason || ''} (modified again)` : 'Manual course reassignment');
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setError('Failed to load time slots');
      }
    };

    if (open) {
      fetchTimeSlots();
    } else {
      // Reset state when dialog closes
      setSelectedDay('');
      setSelectedTimeSlot('');
      setNotes('Manual course reassignment');
      setError(null);
    }
  }, [open, scheduledCourse]);

  const handleDayChange = (event: SelectChangeEvent) => {
    const day = event.target.value;
    setSelectedDay(day);
    setSelectedTimeSlot(''); // Reset time slot when day changes
  };

  const handleTimeSlotChange = (event: SelectChangeEvent) => {
    setSelectedTimeSlot(event.target.value);
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(event.target.value);
  };

  const handleSubmit = async () => {
    if (!scheduledCourse || !selectedDay || !selectedTimeSlot || !notes.trim()) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await scheduleService.createOverride({
        schedule_id: scheduledCourse.schedule_id,
        course_id: scheduledCourse.course_id,
        professor_id: scheduledCourse.professor_id,
        timeslot_id: selectedTimeSlot,
        day_of_week: selectedDay,
        override_reason: notes
      });

      // Call the callback to refresh data
      onCourseChanged();
      onClose();
    } catch (error) {
      console.error('Error overriding course:', error);
      setError('Failed to reassign course. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get the current time slot information
  const getCurrentTimeSlotInfo = () => {
    if (!scheduledCourse) return 'Unknown Time Slot';
    
    // If timeslot object is available with complete info
    if (scheduledCourse.timeslot?.name && scheduledCourse.timeslot?.start_time && scheduledCourse.timeslot?.end_time) {
      return `${scheduledCourse.timeslot.name} (${scheduledCourse.timeslot.start_time.substring(0, 5)} - ${scheduledCourse.timeslot.end_time.substring(0, 5)})`;
    }
    
    // If we don't have the timeslot object but we have the ID
    if (scheduledCourse.timeslot_id) {
      // Try to find it in our loaded time slots
      const timeSlot = allTimeSlots.find(ts => ts.timeslot_id === scheduledCourse.timeslot_id);
      if (timeSlot) {
        return `${timeSlot.name} (${timeSlot.start_time.substring(0, 5)} - ${timeSlot.end_time.substring(0, 5)})`;
      }
    }
    
    return 'Unknown Time Slot';
  };

  // Filter time slots based on course duration
  const getFilteredTimeSlots = (day: string) => {
    if (!scheduledCourse || !scheduledCourse.course || !day) return [];
    
    // Get the course duration (default to 55 if not specified)
    const courseDuration = scheduledCourse.course.duration_minutes || 55;
    
    // Allow a small tolerance (±10 minutes) for matching durations
    const minDuration = courseDuration - 10;
    const maxDuration = courseDuration + 10;
    
    // Filter time slots by day and duration
    return timeSlotsByDay[day]?.filter(slot => 
      slot.duration_minutes >= minDuration && 
      slot.duration_minutes <= maxDuration
    ) || [];
  };

  // Get filtered time slots for the selected day
  const filteredTimeSlots = selectedDay ? getFilteredTimeSlots(selectedDay) : [];
  const hasNoCompatibleSlots = selectedDay && filteredTimeSlots.length === 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Reassign Course
      </DialogTitle>
      <DialogContent>
        {scheduledCourse && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {scheduledCourse.course_id} - {scheduledCourse.course?.course_name || 'Unnamed Course'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Professor: {scheduledCourse.professor?.first_name || ''} {scheduledCourse.professor?.last_name || ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currently scheduled: {scheduledCourse.day_of_week}, {getCurrentTimeSlotInfo()}
              {scheduledCourse.is_override && (
                <Typography variant="caption" color="warning.main" display="block">
                  This course has already been manually overridden
                </Typography>
              )}
            </Typography>
            {scheduledCourse.course?.duration_minutes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Course duration: {scheduledCourse.course.duration_minutes} minutes
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="day-select-label">Select Day</InputLabel>
            <Select
              labelId="day-select-label"
              id="day-select"
              value={selectedDay}
              label="Select Day"
              onChange={handleDayChange}
              disabled={loading}
            >
              {DAYS_OF_WEEK.map((day) => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedDay || loading} error={selectedDay ? filteredTimeSlots.length === 0 : undefined}>
            <InputLabel id="timeslot-select-label">Select Time Slot</InputLabel>
            <Select
              labelId="timeslot-select-label"
              id="timeslot-select"
              value={selectedTimeSlot}
              label="Select Time Slot"
              onChange={handleTimeSlotChange}
            >
              {hasNoCompatibleSlots ? (
                <MenuItem value="" disabled>No compatible time slots available</MenuItem>
              ) : (
                filteredTimeSlots.map((slot) => (
                  <MenuItem key={slot.timeslot_id} value={slot.timeslot_id}>
                    {slot.name} ({slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)})
                  </MenuItem>
                ))
              )}
            </Select>
            {scheduledCourse?.course?.duration_minutes && selectedDay && (
              <FormHelperText>
                {hasNoCompatibleSlots 
                  ? `No time slots available matching ${scheduledCourse.course.duration_minutes} minute duration on ${selectedDay}`
                  : `Showing only time slots compatible with ${scheduledCourse.course.duration_minutes} minute duration`}
              </FormHelperText>
            )}
          </FormControl>

          <TextField
            label="Reassignment Notes"
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={handleNotesChange}
            disabled={loading}
            placeholder="Explain why this course is being reassigned"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          disabled={loading || !selectedDay || !selectedTimeSlot || !notes.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Reassigning...' : 'Reassign Course'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CourseChangeDialog;