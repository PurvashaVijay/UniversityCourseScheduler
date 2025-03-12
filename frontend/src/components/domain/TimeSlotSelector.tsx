// src/components/domain/TimeSlotSelector.tsx
import React from 'react';
import {
  Grid,
  Typography,
  Paper,
  Box,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';

interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

interface TimeSlotSelectorProps {
  dayOfWeek: string;
  timeSlots: TimeSlot[];
  selectedTimeSlots: string[];
  onChange: (timeSlotId: string, isSelected: boolean) => void;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  dayOfWeek,
  timeSlots,
  selectedTimeSlots,
  onChange,
}) => {
  const formatTime = (timeString: string) => {
    try {
      // Handle time formats like "09:10:00" or "09:10"
      const timeParts = timeString.split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12 for display
      
      return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      // Return original if parsing fails
      return timeString;
    }
  };

  const handleTimeSlotChange = (timeSlotId: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange(timeSlotId, event.target.checked);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {dayOfWeek}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {timeSlots.map((timeSlot) => (
          <Grid item xs={12} sm={6} md={4} key={timeSlot.id}>
            <Box sx={{ border: 1, borderColor: 'divider', p: 1, borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedTimeSlots.includes(timeSlot.id)}
                    onChange={handleTimeSlotChange(timeSlot.id)}
                    name={timeSlot.id}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">{timeSlot.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {timeSlot.durationMinutes} minutes
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default TimeSlotSelector;