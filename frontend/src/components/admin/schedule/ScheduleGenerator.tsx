// src/components/admin/schedule/ScheduleGenerator.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import semesterService from '../../../services/semesterService';
import scheduleService from '../../../services/scheduleService';

interface Semester {
  semester_id: string;
  name: string;
}

interface ScheduleGeneratorProps {
  onScheduleGenerated?: (scheduleId: string) => void;
}

const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({ onScheduleGenerated }) => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [scheduleName, setScheduleName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSemesters, setLoadingSemesters] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const data = await semesterService.getAllSemesters();
        setSemesters(data);
      } catch (error) {
        console.error('Error fetching semesters:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load semesters',
          severity: 'error'
        });
      } finally {
        setLoadingSemesters(false);
      }
    };

    fetchSemesters();
  }, []);

  const handleGenerateSchedule = async () => {
    if (!selectedSemester) {
      setSnackbar({
        open: true,
        message: 'Please select a semester',
        severity: 'warning'
      });
      return;
    }

    if (!scheduleName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a schedule name',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      
      const result = await scheduleService.generateSchedule(
        selectedSemester,
        scheduleName
      );
      
      setSnackbar({
        open: true,
        message: 'Schedule generated successfully',
        severity: 'success'
      });
      
      // Call the callback to notify parent component with the new schedule ID
      if (onScheduleGenerated && result?.schedule?.schedule_id) {
        onScheduleGenerated(result.schedule.schedule_id);
      }
      
      // Reset form
      setScheduleName('');
      
    } catch (error) {
      console.error('Error generating schedule:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to generate schedule',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Generate New Schedule
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 2 }}>
          <FormControl fullWidth sx={{ flex: 1 }}>
            <InputLabel id="semester-select-label">Semester</InputLabel>
            <Select
              labelId="semester-select-label"
              id="semester-select"
              value={selectedSemester}
              label="Semester"
              onChange={(e) => setSelectedSemester(e.target.value)}
              disabled={loadingSemesters || loading}
            >
              {loadingSemesters ? (
                <MenuItem value="">
                  <CircularProgress size={24} />
                </MenuItem>
              ) : (
                semesters.map((semester) => (
                  <MenuItem key={semester.semester_id} value={semester.semester_id}>
                    {semester.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          
          <TextField
            label="Schedule Name"
            variant="outlined"
            fullWidth
            sx={{ flex: 1 }}
            value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)}
            disabled={loading}
          />
          
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CalendarMonthIcon />}
            onClick={handleGenerateSchedule}
            disabled={loading || !selectedSemester || !scheduleName.trim()}
            sx={{ 
              bgcolor: '#00539F',
              '&:hover': { bgcolor: '#003d75' },
              height: { xs: 'auto', md: 56 },
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? 'Generating...' : 'Generate Schedule'}
          </Button>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This will generate a new schedule for the selected semester based on all constraints
          including professor availability, course requirements, and time slot restrictions.
        </Typography>
      </CardContent>
      
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

export default ScheduleGenerator;