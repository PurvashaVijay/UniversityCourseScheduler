// src/components/admin/schedule/ConflictManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SettingsIcon from '@mui/icons-material/Settings';
import RestoreIcon from '@mui/icons-material/Restore';
import scheduleService, { Conflict } from '../../../services/scheduleService';

interface ConflictManagementProps {
  scheduleId?: string;
  onConflictResolved?: () => void;
}

const ConflictManagement: React.FC<ConflictManagementProps> = ({ scheduleId, onConflictResolved }) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  type ResolutionType = 'ACCEPT' | 'OVERRIDE' | 'REVERT';
  const [resolutionType, setResolutionType] = useState<ResolutionType>('ACCEPT');
  const [selectedCourseToMove, setSelectedCourseToMove] = useState<string>('');
  const [selectedNewTimeSlot, setSelectedNewTimeSlot] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  // Fetch conflicts when scheduleId changes
  useEffect(() => {
    console.log("ConflictManagement received scheduleId:", scheduleId);
    
    // Define fetchConflicts inside useEffect to avoid dependency issues
    const fetchConflicts = async () => {
      if (!scheduleId) return;
      
      try {
        setLoading(true);
        console.log("Fetching conflicts for schedule ID:", scheduleId);
        const data = await scheduleService.getScheduleConflicts(scheduleId);
        console.log('Fetched conflicts:', data);
        setConflicts(data);
      } catch (error) {
        console.error('Error fetching conflicts:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load conflicts',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    if (scheduleId) {
      fetchConflicts();
    } else {
      setConflicts([]);
      setLoading(false);
    }
  }, [scheduleId]);

  // Handle resolve button click
  const handleResolveClick = (conflict: Conflict, type: 'ACCEPT' | 'OVERRIDE') => {
    setSelectedConflict(conflict);
    setResolutionType(type);
    setSelectedCourseToMove('');
    setSelectedNewTimeSlot('');
    
    // Set default resolution notes based on type
    setResolutionNotes(type === 'ACCEPT'
      ? 'Conflict accepted as is.'
      : 'Schedule will be modified to resolve this conflict.');
    
    // If override, fetch available time slots
    if (type === 'OVERRIDE') {
      fetchAvailableTimeSlots();
    }
    
    setDialogOpen(true);
  };
  // Handle revert button click for already resolved conflicts
// Update the handleRevertClick function in ConflictManagement.tsx
const handleRevertClick = (conflict: Conflict) => {
  setSelectedConflict(conflict);
  setResolutionType('REVERT');
  setResolutionNotes('Reverting previously resolved conflict for reconsideration.');
  setDialogOpen(true);
};

// Modify handleResolveConflict to handle reverting
const handleResolveConflict = async () => {
  if (!selectedConflict) return;
  
  try {
    setResolving(selectedConflict.conflict_id);
    
    if (resolutionType === 'REVERT') {
      // Reverting a previously resolved conflict
      await scheduleService.revertConflictResolution(
        selectedConflict.conflict_id,
        {
          is_resolved: false,
          resolution_notes: resolutionNotes
        }
      );
      
      // Update local state
      setConflicts(conflicts.map(conflict => 
        conflict.conflict_id === selectedConflict.conflict_id 
          ? { ...conflict, is_resolved: false, resolution_notes: resolutionNotes } 
          : conflict
      ));
      
      setSnackbar({
        open: true,
        message: 'Conflict resolution reverted successfully',
        severity: 'success'
      });
    } else {
      // Regular resolution (Accept or Override)
      const resolutionData: any = {
        is_resolved: true,
        resolution_notes: resolutionNotes,
        action: resolutionType
      };
      
      // For override, include course and timeslot info
      if (resolutionType === 'OVERRIDE' && selectedCourseToMove && selectedNewTimeSlot) {
        resolutionData.scheduled_course_id = selectedCourseToMove;
        resolutionData.new_timeslot_id = selectedNewTimeSlot;
      }
      
      await scheduleService.resolveConflict(
        selectedConflict.conflict_id,
        resolutionData
      );
      
      // Update local state
      setConflicts(conflicts.map(conflict => 
        conflict.conflict_id === selectedConflict.conflict_id 
          ? { ...conflict, is_resolved: true, resolution_notes: resolutionNotes } 
          : conflict
      ));
      
      setSnackbar({
        open: true,
        message: `Conflict ${resolutionType === 'ACCEPT' ? 'accepted' : 'overridden'} successfully`,
        severity: 'success'
      });
    }
    
    if (onConflictResolved) {
      onConflictResolved();
    }
  } catch (error) {
    console.error('Error processing conflict:', error);
    setSnackbar({
      open: true,
      message: `Failed to ${resolutionType === 'REVERT' ? 'revert' : 'resolve'} conflict`,
      severity: 'error'
    });
  } finally {
    setResolving(null);
    setDialogOpen(false);
    setSelectedCourseToMove('');
    setSelectedNewTimeSlot('');
  }
};

  // Close the resolution dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedConflict(null);
    setResolutionNotes('');
    setSelectedCourseToMove('');
    setSelectedNewTimeSlot('');
    setSelectedDay(''); // Reset selected day
  };
  // Close the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get severity level based on conflict type
  const getConflictSeverity = (type: string): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'TIME_SLOT_CONFLICT':
        return 'error';
      case 'PROFESSOR_CONFLICT':
        return 'error';
      case 'MANUAL_OVERRIDE_CONFLICT':
        return 'warning';
      case 'NO_AVAILABLE_SLOT':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Get the appropriate icon based on conflict type and resolution status
  const getConflictIcon = (type: string, isResolved: boolean) => {
    if (isResolved) {
      return <CheckCircleIcon color="success" />;
    }
    
    const severity = getConflictSeverity(type);
    return severity === 'error'
      ? <ErrorIcon color="error" />
      : <WarningIcon color="warning" />;
  };

  // Format conflict type to be more readable
  const getReadableConflictType = (type: string) => {
    switch (type) {
      case 'TIME_SLOT_CONFLICT':
        return 'Time Slot Conflict';
      case 'PROFESSOR_CONFLICT':
        return 'Professor Conflict';
      case 'MANUAL_OVERRIDE_CONFLICT':
        return 'Manual Override Conflict';
      case 'NO_AVAILABLE_SLOT':
        return 'No Available Slot';
      default:
        return type.replace(/_/g, ' ');
    }
  };
  // Fetch available time solts
  const fetchAvailableTimeSlots = async () => {
    try {
      setLoadingTimeSlots(true);
      const timeSlots = await scheduleService.getAllTimeSlots();
      setAvailableTimeSlots(timeSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load time slots',
        severity: 'error'
      });
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Format the time slot information
  const formatTimeSlot = (conflict: Conflict) => {
    if (!conflict.timeslot) return 'N/A';
    
    const startTime = conflict.timeslot.start_time 
      ? new Date(`1970-01-01T${conflict.timeslot.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'N/A';
      
    const endTime = conflict.timeslot.end_time 
      ? new Date(`1970-01-01T${conflict.timeslot.end_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'N/A';
    
    return `${startTime} - ${endTime}`;
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Conflict Management
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : !scheduleId ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Select a schedule to view conflicts.
          </Alert>
        ) : conflicts.length === 0 ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            0 conflicts found for this schedule.
          </Alert>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {conflicts.filter(c => !c.is_resolved).length} unresolved conflicts out of {conflicts.length} total conflicts
              </Typography>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="3%">#</TableCell>
                    <TableCell width="5%">Status</TableCell>
                    <TableCell width="15%">Type</TableCell>
                    <TableCell width="15%">Day & Time</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width="15%">Resolution</TableCell>
                    <TableCell width="20%">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conflicts.map((conflict, index) => (
                    <TableRow key={conflict.conflict_id} sx={{ bgcolor: conflict.is_resolved ? '#f9f9f9' : 'inherit' }}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {getConflictIcon(conflict.conflict_type, conflict.is_resolved)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getReadableConflictType(conflict.conflict_type)}
                          color={getConflictSeverity(conflict.conflict_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {conflict.day_of_week}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {conflict.timeslot?.name || 'N/A'}
                        </Typography>
                        {/* Added time display */}
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatTimeSlot(conflict)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {conflict.description}
                        </Typography>
                        {conflict.scheduled_courses && conflict.scheduled_courses.length > 0 && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Involves: {conflict.scheduled_courses.map(sc => sc.course_name || sc.course_id).join(", ")}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {conflict.is_resolved ? (
                          <>
                            <Chip
                              label="Resolved"
                              color="success"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            {conflict.resolution_notes && (
                              <Typography variant="caption" display="block">
                                {conflict.resolution_notes}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Chip
                            label="Unresolved"
                            color="default"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {conflict.is_resolved ? (
                          // Show Revert button for resolved conflicts
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            onClick={() => handleRevertClick(conflict)}
                            disabled={!!resolving}
                            startIcon={<RestoreIcon />}
                            sx={{ mt: 1 }}
                          >
                            {resolving === conflict.conflict_id && resolutionType === 'REVERT' ? (
                              <CircularProgress size={16} />
                            ) : (
                              'Revert'
                            )}
                          </Button>
                        ) : (
                          // Show Accept/Override buttons for unresolved conflicts
                          <ButtonGroup size="small" variant="outlined" orientation="vertical" sx={{ width: '100%' }}>
                            <Button
                              color="primary"
                              onClick={() => handleResolveClick(conflict, 'ACCEPT')}
                              disabled={!!resolving}
                              startIcon={<ThumbUpIcon />}
                              sx={{ mb: 1 }}
                            >
                              {resolving === conflict.conflict_id && resolutionType === 'ACCEPT' ? (
                                <CircularProgress size={16} />
                              ) : (
                                'Accept'
                              )}
                            </Button>
                            <Button
                              color="secondary"
                              onClick={() => handleResolveClick(conflict, 'OVERRIDE')}
                              disabled={!!resolving}
                              startIcon={<SettingsIcon />}
                            >
                              {resolving === conflict.conflict_id && resolutionType === 'OVERRIDE' ? (
                                <CircularProgress size={16} />
                              ) : (
                                'Override'
                              )}
                            </Button>
                          </ButtonGroup>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
      
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
  <DialogTitle>
    {resolutionType === 'ACCEPT' ? 'Accept Conflict' : 
     resolutionType === 'OVERRIDE' ? 'Override Conflict' : 
     'Revert Resolution'}
  </DialogTitle>
  <DialogContent>
    <DialogContentText sx={{ mb: 2 }}>
      {selectedConflict?.description}
    </DialogContentText>
    
    {/* Show conflicting courses */}
    <Typography variant="subtitle2" gutterBottom>
      Conflicting Courses:
    </Typography>
    <Box sx={{ mb: 2 }}>
      {selectedConflict?.scheduled_courses?.map(course => (
        <Box key={course.scheduled_course_id} sx={{ mb: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight="bold">
            {course.course_id} - {course.course_name || 'Unknown Course'}
          </Typography>
          <Typography variant="caption" display="block">
            Professor: {course.professor_name || 'Unknown Professor'}
          </Typography>
        </Box>
      ))}
    </Box>
    
    {/* Course selection for override */}
    {resolutionType === 'OVERRIDE' && (
      <>
        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
          <InputLabel id="course-select-label">Select course to move</InputLabel>
          <Select
            labelId="course-select-label"
            value={selectedCourseToMove}
            onChange={(e) => setSelectedCourseToMove(e.target.value)}
            label="Select course to move"
          >
            {selectedConflict?.scheduled_courses?.map(course => (
              <MenuItem key={course.scheduled_course_id} value={course.scheduled_course_id}>
                {course.course_id} - {course.course_name || 'Unknown Course'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Day selection dropdown */}
        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
          <InputLabel id="day-select-label">Select day</InputLabel>
          <Select
            labelId="day-select-label"
            value={selectedDay}
            onChange={(e) => {
              setSelectedDay(e.target.value);
              setSelectedNewTimeSlot(''); // Reset time slot when day changes
            }}
            label="Select day"
            disabled={loadingTimeSlots || !selectedCourseToMove}
          >
            {loadingTimeSlots ? (
              <MenuItem value="">
                <CircularProgress size={20} sx={{ mr: 1 }} /> Loading days...
              </MenuItem>
            ) : (
              DAYS_OF_WEEK.map(day => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* Time slot selection dropdown - only enabled when day is selected */}
        <FormControl fullWidth sx={{ mt: 2, mb: 2 }} disabled={!selectedDay || loadingTimeSlots}>
          <InputLabel id="timeslot-select-label">Select time slot</InputLabel>
          <Select
            labelId="timeslot-select-label"
            value={selectedNewTimeSlot}
            onChange={(e) => setSelectedNewTimeSlot(e.target.value)}
            label="Select time slot"
          >
            {availableTimeSlots
              .filter(slot => slot.day_of_week === selectedDay)
              .map(slot => (
                <MenuItem key={slot.timeslot_id} value={slot.timeslot_id}>
                  {slot.name} ({slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)})
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </>
    )}
    
    <TextField
      autoFocus
      label="Resolution Notes"
      fullWidth
      multiline
      rows={4}
      value={resolutionNotes}
      onChange={(e) => setResolutionNotes(e.target.value)}
      placeholder={
        resolutionType === 'ACCEPT' ? "Explain why this conflict is acceptable (e.g., temporary situation, special arrangement)" :
        resolutionType === 'OVERRIDE' ? "Explain how this conflict should be overridden (e.g., move to a different time slot, assign different professor)" :
        "Explain why you're reverting the previous resolution"
      }
      sx={{ mt: 2 }}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
    <Button
      onClick={handleResolveConflict}
      color={
        resolutionType === 'ACCEPT' ? 'primary' : 
        resolutionType === 'OVERRIDE' ? 'secondary' :
        'warning'
      }
      disabled={!resolutionNotes.trim() || (resolutionType === 'OVERRIDE' && (!selectedCourseToMove || !selectedNewTimeSlot))}
      startIcon={
        resolutionType === 'ACCEPT' ? <ThumbUpIcon /> : 
        resolutionType === 'OVERRIDE' ? <SettingsIcon /> :
        <RestoreIcon />
      }
    >
      {resolving ? 
        <CircularProgress size={24} /> :
        (resolutionType === 'ACCEPT' ? 'Accept Conflict' : 
         resolutionType === 'OVERRIDE' ? 'Override Conflict' : 
         'Revert Resolution')
      }
    </Button>
  </DialogActions>
</Dialog>
      
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
    </Card>
  );
};

export default ConflictManagement;
