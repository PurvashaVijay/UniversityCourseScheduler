import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Typography,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  Collapse
} from '@mui/material';
import { 
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon 
} from '@mui/icons-material';
import professorService, { ProfessorAvailability } from '../../../services/professorService';
import timeSlotService, { TimeSlot } from '../../../services/timeSlotService';

interface ProfessorAvailabilityTabProps {
  professorId: string;
  availabilities: ProfessorAvailability[];
  onAvailabilityChange: (availabilities: ProfessorAvailability[]) => void;
}

// Days of the week for scheduling
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const ProfessorAvailabilityTab: React.FC<ProfessorAvailabilityTabProps> = ({
  professorId,
  availabilities,
  onAvailabilityChange
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Track expanded state for each day
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true
  });
  
  // Track day availability (all timeslots for that day)
  const [dayAvailability, setDayAvailability] = useState<Record<string, boolean>>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false
  });

  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setLoading(true);
        const timeSlotsData = await timeSlotService.getAllTimeSlots();
        setTimeSlots(timeSlotsData);
      } catch (err) {
        setError('Failed to fetch time slots');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, []);

  useEffect(() => {
    // Convert availabilities array to a map for easier access
    const map: Record<string, boolean> = {};
    
    console.log('Processing availabilities:', availabilities);
    
    // Make sure we handle both structured and flat availability data
    const processedAvailabilities = Array.isArray(availabilities) ? availabilities : [];
    
    processedAvailabilities.forEach(availability => {
      const key = `${availability.day_of_week}-${availability.timeslot_id}`;
      map[key] = availability.is_available;
      console.log(`Setting availability for ${key} to ${availability.is_available}`);
    });
    
    setAvailabilityMap(map);
    
    // Calculate day availability based on timeslot availabilities
    //const newDayAvailability = {}; // Create a new object instead of using spread
    const newDayAvailability: Record<string, boolean> = {}; 
    
    for (const day of DAYS_OF_WEEK) {
      // Get time slots for this day
      const dayTimeSlots = timeSlots.filter(ts => ts.day_of_week === day);
      
      if (dayTimeSlots.length === 0) {
        console.log(`No time slots found for ${day}`);
        newDayAvailability[day] = false;
        continue;
      }
      
      // Check if all time slots for this day are available
      const daySlotsAvailable = dayTimeSlots.every(timeSlot => {
        const key = `${day}-${timeSlot.timeslot_id}`;
        return map[key] || false;
      });
      
      newDayAvailability[day] = daySlotsAvailable;
      console.log(`Day availability for ${day} set to ${daySlotsAvailable}`);
    }
    
    setDayAvailability(newDayAvailability);
  }, [availabilities, timeSlots]); // Remove dayAvailability from dependencies

  const handleAvailabilityChange = (day: string, timeSlotId: string, isAvailable: boolean) => {
    const key = `${day}-${timeSlotId}`;
    
    setAvailabilityMap(prev => ({
      ...prev,
      [key]: isAvailable
    }));
    
    // Update day availability if needed
    updateDayAvailability(day);
  };
  
  const toggleDayExpand = (day: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  
  const handleDayAvailabilityChange = (day: string, isAvailable: boolean) => {
    // Update all time slots for this day
    const newAvailabilityMap = { ...availabilityMap };
    
    timeSlots
      .filter(ts => ts.day_of_week === day || !ts.day_of_week)
      .forEach(timeSlot => {
        const key = `${day}-${timeSlot.timeslot_id}`;
        newAvailabilityMap[key] = isAvailable;
      });
    
    setAvailabilityMap(newAvailabilityMap);
    
    // Update day availability state
    setDayAvailability(prev => ({
      ...prev,
      [day]: isAvailable
    }));
  };
  
  const updateDayAvailability = (day: string) => {
    const relevantTimeSlots = timeSlots.filter(ts => ts.day_of_week === day || !ts.day_of_week);
    
    if (relevantTimeSlots.length === 0) return;
    
    const allAvailable = relevantTimeSlots.every(timeSlot => {
      const key = `${day}-${timeSlot.timeslot_id}`;
      return availabilityMap[key] || false;
    });
    
    setDayAvailability(prev => ({
      ...prev,
      [day]: allAvailable
    }));
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Convert the map back to an array of availabilities
      const availabilityUpdates: ProfessorAvailability[] = [];
      
      console.log('Saving availability for professor ID:', professorId);
      
      for (const day of DAYS_OF_WEEK) {
        // Get time slots for this day
        const dayTimeSlots = timeSlots.filter(ts => ts.day_of_week === day);
        
        if (dayTimeSlots.length === 0) {
          console.log(`No time slots found for ${day}`);
          continue;
        }
        
        // Process each time slot for this day
        for (const timeSlot of dayTimeSlots) {
          const key = `${day}-${timeSlot.timeslot_id}`;
          const isAvailable = availabilityMap[key] !== undefined ? availabilityMap[key] : false;
          
          availabilityUpdates.push({
            availability_id: '', // will be assigned by the backend
            professor_id: professorId,
            timeslot_id: timeSlot.timeslot_id,
            day_of_week: day,
            is_available: isAvailable,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
      
      console.log(`Saving ${availabilityUpdates.length} availability records`);
      
      // Use professorService to save the availability
      const result = await professorService.setProfessorAvailability(professorId, availabilityUpdates);
      console.log('Save result:', result);
      
      // Fetch the updated availabilities
      const updatedAvailabilities = await professorService.getProfessorAvailability(professorId);
      
      // Update the parent component
      onAvailabilityChange(updatedAvailabilities);
      
      // Show success message
      setSuccessMessage('Availability successfully updated');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err: any) {
      setError(`Failed to save availability: ${err.message || 'Unknown error'}`);
      console.error('Error saving availability:', err);
    } finally {
      setSaving(false);
    }
  };

  // Format time in a readable format using 24-hour clock (e.g., "09:10 - 10:05")
  const formatTimeSlot = (timeSlot: TimeSlot) => {
    const formatTime = (time: string) => {
      // Just take the first 5 characters (HH:MM) if needed
      return time.substring(0, 5);
    };
    
    return `${formatTime(timeSlot.start_time)} - ${formatTime(timeSlot.end_time)}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h6" gutterBottom>
                Professor Availability
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set when the professor is available to teach across the week.
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={saveAvailability}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Availability'}
              </Button>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {DAYS_OF_WEEK.map((day) => (
              <Grid item xs={12} key={day}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {day}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={dayAvailability[day] || false}
                            onChange={(e) => handleDayAvailabilityChange(day, e.target.checked)}
                            color="primary"
                          />
                        }
                        label={dayAvailability[day] ? "Available all day" : "Not available"}
                        sx={{ ml: 2 }}
                      />
                    </Box>
                    <IconButton onClick={() => toggleDayExpand(day)}>
                      {expandedDays[day] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Collapse in={expandedDays[day]}>
                    <Grid container spacing={2}>
                      {timeSlots
                        .filter(ts => ts.day_of_week === day || !ts.day_of_week)
                        .map((timeSlot) => {
                          const key = `${day}-${timeSlot.timeslot_id}`;
                          const isAvailable = availabilityMap[key] || false;
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={timeSlot.timeslot_id}>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={isAvailable}
                                    onChange={(e) => handleAvailabilityChange(day, timeSlot.timeslot_id, e.target.checked)}
                                    color="primary"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {timeSlot.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {formatTimeSlot(timeSlot)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ({timeSlot.duration_minutes} min)
                                    </Typography>
                                  </Box>
                                }
                                sx={{ 
                                  display: 'flex',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  p: 1,
                                  width: '100%'
                                }}
                              />
                            </Grid>
                          );
                        })}
                    </Grid>
                  </Collapse>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfessorAvailabilityTab;