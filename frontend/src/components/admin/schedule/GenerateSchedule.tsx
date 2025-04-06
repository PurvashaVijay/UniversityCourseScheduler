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
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import scheduleService from '../../../services/scheduleService';
import semesterService from '../../../services/semesterService';

interface GenerateScheduleProps {
  onScheduleGenerated?: (semesterId: string) => void;
  onClose?: () => void;
}

//const GenerateSchedule: React.FC = () => {
  const GenerateSchedule: React.FC<GenerateScheduleProps> = (props = {}) => {

  const navigate = useNavigate();
  const [semesters, setSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [scheduleName, setScheduleName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const data = await semesterService.getAllSemesters();
        setSemesters(data);
        if (data.length > 0) {
          setSelectedSemester(data[0].semester_id);
        }
      } catch (err) {
        console.error('Error fetching semesters:', err);
        setError('Failed to load semesters');
      }
    };

    fetchSemesters();
  }, []);

  const handleGenerateSchedule = async () => {
    if (!selectedSemester) {
      setError('Please select a semester');
      return;
    }

    if (!scheduleName) {
      setError('Please provide a name for the schedule');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Generating schedule for semester:', selectedSemester);
      console.log('Schedule name:', scheduleName);
      
      const result = await scheduleService.generateSchedule(selectedSemester, scheduleName);
      console.log('Schedule generation result:', result);
      
      setSuccess(true);
      console.log('Schedule generation complete - redirecting to view the schedule');

      // Call the onScheduleGenerated callback if it exists
      handleSuccess(selectedSemester);

      if (props?.onClose) {
        setTimeout(() => {
          props.onClose?.();
        }, 2000);
      } else {
        setTimeout(() => {
          navigate(`/admin/schedules?semester=${selectedSemester}&refresh=true`);
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error generating schedule:', err);
      setError(err.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (semesterId: string) => {
    props?.onScheduleGenerated?.(semesterId);
  
    if (props?.onClose) {
      setTimeout(() => {
        props.onClose?.();
      }, 2000);
    } else {
      setTimeout(() => {
        navigate('/admin/schedules');
      }, 2000);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Generate New Schedule
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Schedule generated successfully! Redirecting to schedules page...
          </Alert>
        )}

        <Card>
          <CardContent>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="semester-select-label">Semester</InputLabel>
                <Select
                  labelId="semester-select-label"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  label="Semester"
                  disabled={loading}
                >
                  {semesters.map((semester) => (
                    <MenuItem key={semester.semester_id} value={semester.semester_id}>
                      {semester.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Schedule Name"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                disabled={loading}
                placeholder="e.g., Fall 2023 Main Schedule"
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/schedules')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateSchedule}
                  disabled={loading || !selectedSemester || !scheduleName}
                  startIcon={loading && <CircularProgress size={24} color="inherit" />}
                >
                  {loading ? 'Generating...' : 'Generate Schedule'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default GenerateSchedule;