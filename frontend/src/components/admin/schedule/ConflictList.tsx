// src/components/admin/schedule/ConflictList.tsx
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
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import scheduleService, { Conflict } from '../../../services/scheduleService';

interface ConflictListProps {
  scheduleId: string;
  onConflictResolved?: () => void;
}

// Extended Conflict interface that includes timeslot
interface ExtendedConflict extends Conflict {
  timeslot?: {
    name: string;
    start_time: string;
    end_time: string;
  };
}

const ConflictList: React.FC<ConflictListProps> = ({ scheduleId, onConflictResolved }) => {
  const [conflicts, setConflicts] = useState<ExtendedConflict[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<ExtendedConflict | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchConflicts = async () => {
      if (!scheduleId) return;
      
      try {
        setLoading(true);
        const data = await scheduleService.getScheduleConflicts(scheduleId);
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

    fetchConflicts();
  }, [scheduleId]);

  const handleResolveClick = (conflict: ExtendedConflict) => {
    setSelectedConflict(conflict);
    setResolutionNotes('');
    setDialogOpen(true);
  };

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;
    
    try {
      setResolving(selectedConflict.conflict_id);
      
      // API call to resolve conflict
      const result = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/schedules/conflicts/${selectedConflict.conflict_id}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_resolved: true,
          resolution_notes: resolutionNotes
        })
      });
      
      if (!result.ok) {
        throw new Error('Failed to resolve conflict');
      }
      
      // Update local state
      setConflicts(conflicts.map(conflict => 
        conflict.conflict_id === selectedConflict.conflict_id 
          ? { ...conflict, is_resolved: true, resolution_notes: resolutionNotes } 
          : conflict
      ));
      
      setSnackbar({
        open: true,
        message: 'Conflict resolved successfully',
        severity: 'success'
      });
      
      if (onConflictResolved) {
        onConflictResolved();
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
      setSnackbar({
        open: true,
        message: 'Failed to resolve conflict',
        severity: 'error'
      });
    } finally {
      setResolving(null);
      setDialogOpen(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedConflict(null);
    setResolutionNotes('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getConflictSeverity = (type: string): 'error' | 'warning' | 'info' => {
    switch (type) {
      case 'TIME_SLOT_CONFLICT':
        return 'error';
      case 'PROFESSOR_CONFLICT':
        return 'error';
      case 'NO_AVAILABLE_SLOT':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getConflictIcon = (type: string, isResolved: boolean) => {
    if (isResolved) {
      return <CheckCircleIcon color="success" />;
    }
    
    const severity = getConflictSeverity(type);
    return severity === 'error' 
      ? <ErrorIcon color="error" /> 
      : <WarningIcon color="warning" />;
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Schedule Conflicts
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : conflicts.length === 0 ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            No conflicts found for this schedule.
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
                    <TableCell width="5%">Status</TableCell>
                    <TableCell width="15%">Type</TableCell>
                    <TableCell width="15%">Day & Time</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width="15%">Resolution</TableCell>
                    <TableCell width="10%">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conflicts.map((conflict) => (
                    <TableRow key={conflict.conflict_id} sx={{ bgcolor: conflict.is_resolved ? '#f9f9f9' : 'inherit' }}>
                      <TableCell>
                        {getConflictIcon(conflict.conflict_type, conflict.is_resolved)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={conflict.conflict_type.replace(/_/g, ' ')} 
                          color={getConflictSeverity(conflict.conflict_type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {conflict.day_of_week}
                        <br />
                        <Typography variant="caption">
                          {conflict.timeslot?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {conflict.description}
                        </Typography>
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
                        {!conflict.is_resolved && (
                          <Button 
                            variant="outlined" 
                            size="small"
                            color="primary"
                            onClick={() => handleResolveClick(conflict)}
                            disabled={!!resolving}
                          >
                            {resolving === conflict.conflict_id ? (
                              <CircularProgress size={16} />
                            ) : (
                              'Resolve'
                            )}
                          </Button>
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
        <DialogTitle>Resolve Conflict</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {selectedConflict?.description}
          </DialogContentText>
          <TextField
            autoFocus
            label="Resolution Notes"
            fullWidth
            multiline
            rows={4}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Explain how this conflict was resolved (e.g., moved course to different time slot, replaced professor, etc.)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button 
            onClick={handleResolveConflict} 
            color="primary"
            disabled={!resolutionNotes.trim()}
          >
            {resolving ? <CircularProgress size={24} /> : 'Mark as Resolved'}
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

export default ConflictList;