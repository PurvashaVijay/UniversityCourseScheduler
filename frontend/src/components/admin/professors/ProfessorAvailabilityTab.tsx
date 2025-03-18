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
  Snackbar
} from '@mui/material'; 
import { Save as SaveIcon } from '@mui/icons-material';
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
    
    availabilities.forEach(availability => {
      const key = `${availability.day_of_week}-${availability.timeslot_id}`;
      map[key] = availability.is_available;
    });
    
    setAvailabilityMap(map);
  }, [availabilities]);

  const handleAvailabilityChange = (day: string, timeSlotId: string, isAvailable: boolean) => {
    const key = `${day}-${timeSlotId}`;
    setAvailabilityMap(prev => ({
      ...prev,
      [key]: isAvailable
    }));
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Convert the map back to an array of availabilities
      const availabilityUpdates: ProfessorAvailability[] = [];
      
      for (const day of DAYS_OF_WEEK) {
        for (const timeSlot of timeSlots) {
          const key = `${day}-${timeSlot.timeslot_id}`;
          const isAvailable = availabilityMap[key] || false;
          
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
      
      // Update professor availability on the server
      const updatedAvailabilities = await professorService.setProfessorAvailability(professorId, availabilityUpdates);
      
      // Update the parent component
      onAvailabilityChange(updatedAvailabilities);
      
      // Show success message
      setSuccessMessage('Availability successfully updated');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      setError('Failed to save availability');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Format time in a readable format (e.g., "9:10 AM - 10:05 AM")
  const formatTimeSlot = (timeSlot: TimeSlot) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
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
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {day}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
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
