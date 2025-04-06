// src/components/admin/schedules/ScheduleView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import GetAppIcon from '@mui/icons-material/GetApp';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// Import services
import scheduleService from '../../../services/scheduleService';
import departmentService from '../../../services/departmentService';
import programService from '../../../services/programService';
import semesterService from '../../../services/semesterService';
import GenerateSchedule from './GenerateSchedule';

const ScheduleView: React.FC = () => {
  // State variables
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [scheduledCourses, setScheduledCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<string>('week');
  const [showGenerateForm, setShowGenerateForm] = useState<boolean>(false);
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showResolvedConflicts, setShowResolvedConflicts] = useState<boolean>(false);
  
  // Days and time slots for schedule display
  const daysOfWeek = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], []);
  const timeSlots = [
    { id: 1, name: 'Time Slot 1', start: '09:10', end: '10:05' },
    { id: 2, name: 'Time Slot 2', start: '10:20', end: '11:15' },
    { id: 3, name: 'Time Slot 3', start: '11:30', end: '12:25' },
    { id: 4, name: 'Time Slot 4', start: '12:45', end: '14:05' },
    { id: 5, name: 'Time Slot 5', start: '13:30', end: '14:50' },
    { id: 6, name: 'Time Slot 6', start: '17:30', end: '20:30' },
    { id: 7, name: 'Time Slot 7', start: '18:00', end: '21:00' }
  ];

  // Helper function for normalizing day names
  const normalizeDayName = (day: string | undefined | null): string => {
    if (!day) return '';
    
    // Convert common day code formats to full names
    const dayMap: Record<string, string> = {
      'MON': 'Monday',
      'TUE': 'Tuesday',
      'WED': 'Wednesday',
      'THU': 'Thursday',
      'FRI': 'Friday'
    };
    
    // Try direct mapping first
    const upperDay = day.toUpperCase();
    if (dayMap[upperDay]) return dayMap[upperDay];
    
    // Check if it's already a full day name
    if (daysOfWeek.includes(day)) return day;
    
    // Try to extract code from timeslot format (e.g. "TS1-MON")
    const dashIndex = day.indexOf('-');
    if (dashIndex !== -1) {
      const code = day.substring(dashIndex + 1);
      if (dayMap[code]) return dayMap[code];
    }
    
    // Try partial matching (e.g. "Mon" for "Monday")
    for (const [code, fullName] of Object.entries(dayMap)) {
      if (upperDay.includes(code) || fullName.toLowerCase().includes(day.toLowerCase())) {
        return fullName;
      }
    }
    
    // Default to the original value if no match found
    return day;
  };

  // Extract slot number from timeslot ID
  const extractSlotNumber = (timeslotId: string | undefined | null): number | null => {
    if (!timeslotId) return null;
    
    const match = timeslotId.match(/TS(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  };
 

  // Fetch available schedules for a semester
  const fetchAvailableSchedules = useCallback(async (semesterId: string) => {
    if (!semesterId) return;
    
    try {
      setLoading(true);
      const data = await scheduleService.getSchedulesBySemester(semesterId);
      console.log(`Found ${data.length} schedules for semester ${semesterId}`);
      setAvailableSchedules(data);
      
      // If we have schedules and none is selected yet, select the first one
      if (data.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(data[0].schedule_id);
        console.log(`Auto-selecting first schedule: ${data[0].schedule_id}`);
      }
    } catch (err) {
      console.error('Error fetching schedules for semester:', err);
      setError('Failed to load schedules for this semester');
    } finally {
      setLoading(false);
    }
  }, [selectedScheduleId]);

  // Load a specific schedule by ID
  const loadScheduleById = useCallback(async (scheduleId: string) => {
    if (!scheduleId) return;
    
    // Define normalizeCoursesData function inside the callback
    const normalizeCoursesData = (courses: any[] | undefined): any[] => {
      if (!courses || !Array.isArray(courses) || courses.length === 0) {
        return [];
      }
      
      return courses.map(course => {
        // Handle different nesting patterns
        const courseData = course.Course || course.course || course;
        const professorData = course.Professor || course.professor || {};
        const timeSlotData = course.TimeSlot || course.time_slot || {};
        
        // Extract key information
        const courseId = course.course_id || courseData.course_id || '';
        const courseName = course.course_name || courseData.course_name || '';
        const isCore = course.is_core !== undefined ? course.is_core : courseData.is_core || false;
        
        // Format professor name
        const firstName = course.professor_first_name || professorData.first_name || '';
        const lastName = course.professor_last_name || professorData.last_name || '';
        const professorName = course.professor_name || `${firstName} ${lastName}`.trim() || 'TBA';
        
        // Process timeslot and day information
        const timeslotId = course.timeslot_id || course.time_slot_id || '';
        
        // Extract slot number from timeslot ID
        let slotNumber = null;
        if (timeslotId) {
          const match = timeslotId.match(/TS(\d+)/i);
          if (match && match[1]) {
            slotNumber = parseInt(match[1], 10);
          }
        } else if (course.time_slot_number !== undefined) {
          slotNumber = course.time_slot_number;
        }
        
        // Handle day of week
        const rawDay = course.day_of_week || timeSlotData.day_of_week || '';
        
        // Normalize day name
        const dayMap: Record<string, string> = {
          'MON': 'Monday',
          'TUE': 'Tuesday',
          'WED': 'Wednesday',
          'THU': 'Thursday',
          'FRI': 'Friday'
        };
        
        let dayOfWeek = rawDay;
        // Try direct mapping
        const upperDay = rawDay.toUpperCase();
        if (dayMap[upperDay]) {
          dayOfWeek = dayMap[upperDay];
        } else if (daysOfWeek.includes(rawDay)) {
          // Already a full day name
          dayOfWeek = rawDay;
        } else if (rawDay.includes('-')) {
          // Try to extract code from timeslot format (e.g. "TS1-MON")
          const parts = rawDay.split('-');
          const code = parts[1];
          if (dayMap[code]) {
            dayOfWeek = dayMap[code];
          }
        } else {
          // Try partial matching
          for (const [code, fullName] of Object.entries(dayMap)) {
            if (upperDay.includes(code) || fullName.toLowerCase().includes(rawDay.toLowerCase())) {
              dayOfWeek = fullName;
              break;
            }
          }
        }
        
        // Return normalized course object
        return {
          ...course,
          course_id: courseId,
          course_name: courseName,
          is_core: isCore,
          professor_name: professorName,
          timeslot_id: timeslotId,
          time_slot_id: timeslotId, // Alternative naming
          time_slot_number: slotNumber,
          day_of_week: dayOfWeek,
          department_id: course.department_id || courseData.department_id || '',
          scheduled_course_id: course.scheduled_course_id || ''
        };
      });
    };
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Loading schedule details for ID: ${scheduleId}`);
      const scheduleData = await scheduleService.getScheduleById(scheduleId);
      console.log('Raw schedule data:', scheduleData);
      
      // Get conflicts data
      const conflictsData = await scheduleService.getScheduleConflicts(scheduleId);
      console.log(`Found ${conflictsData.length} conflicts`);
      
      // Identify where the courses are in the response
      let rawCourses: any[] = [];
      if (scheduleData.courses && Array.isArray(scheduleData.courses)) {
        console.log(`Found ${scheduleData.courses.length} courses in 'courses' property`);
        rawCourses = scheduleData.courses;
      } else if (scheduleData.ScheduledCourses && Array.isArray(scheduleData.ScheduledCourses)) {
        console.log(`Found ${scheduleData.ScheduledCourses.length} courses in 'ScheduledCourses' property`);
        rawCourses = scheduleData.ScheduledCourses;
      }
      
      // Normalize course data
      const normalizedCourses = normalizeCoursesData(rawCourses);
      console.log(`Normalized ${normalizedCourses.length} courses`);
      if (normalizedCourses.length > 0) {
        console.log('Sample normalized course:', normalizedCourses[0]);
      }
      
      // Update state with complete data
      const enhancedScheduleData = {
        ...scheduleData,
        courses: normalizedCourses
      };
      
      setScheduleData(enhancedScheduleData);
      setScheduledCourses(normalizedCourses);
      setFilteredCourses(normalizedCourses);
      setConflicts(conflictsData);
    } catch (err) {
      console.error(`Error loading schedule ${scheduleId}:`, err);
      setError('Failed to load the selected schedule');
      setScheduleData(null);
      setScheduledCourses([]);
      setFilteredCourses([]);
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  }, [daysOfWeek]); // Empty dependency array since all dependencies are now inside

  // Refresh schedules and schedule data
  const handleRefresh = useCallback(async () => {
    if (!selectedSemester) return;
  
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Refreshing schedule data for semester: ${selectedSemester}`);
      
      // First, refresh the list of available schedules
      await fetchAvailableSchedules(selectedSemester);
      
      // If we have a selected schedule, reload it
      if (selectedScheduleId) {
        await loadScheduleById(selectedScheduleId);
      }
      
      // Reset filters
      setSelectedDepartment('');
      setSelectedProgram('all');
      
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to refresh data. Please ensure schedules exist for this semester.");
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, selectedScheduleId, fetchAvailableSchedules, loadScheduleById]);

  // Check URL parameters (for direct navigation from schedule generation)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const semesterParam = queryParams.get('semester');
    const refreshParam = queryParams.get('refresh');

    if (semesterParam) {
      console.log(`URL has semester param: ${semesterParam}, setting as selected`);
      setSelectedSemester(semesterParam);
      
      // If refresh=true is in the URL, force a refresh
      if (refreshParam === 'true') {
        // Use setTimeout to ensure the semester state is updated first
        setTimeout(() => handleRefresh(), 500);
      }
    }
  }, [handleRefresh]);

  // Initial data loading
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get semesters
        const semestersData = await semesterService.getAllSemesters();
        setSemesters(semestersData);
        
        // Get departments and programs
        const departmentsData = await departmentService.getAllDepartments();
        const programsData = await programService.getAllPrograms();
        
        setDepartments(departmentsData);
        setPrograms(programsData);
        
        // If we have semesters, try to get a schedule
        if (semestersData.length > 0) {
          // Find the current semester or use the first one
          const currentSemester = semestersData.find((s: any) => s.is_current) || semestersData[0];
          setSelectedSemester(currentSemester.semester_id);
          
          // Load schedules for this semester
          await fetchAvailableSchedules(currentSemester.semester_id);
        } else {
          setError('No semesters found. Please create a semester before generating schedules.');
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please ensure your backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchAvailableSchedules]);

  // Fetch schedules when semester changes
  useEffect(() => {
    if (selectedSemester) {
      fetchAvailableSchedules(selectedSemester);
    }
  }, [selectedSemester, fetchAvailableSchedules]);
  
  // Load the selected schedule when selectedScheduleId changes
  useEffect(() => {
    if (selectedScheduleId) {
      loadScheduleById(selectedScheduleId);
    }
  }, [selectedScheduleId, loadScheduleById]);
  
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
    
    // Filter by program - if "all" is selected, don't filter by program
    if (selectedProgram && selectedProgram !== 'all') {
      filtered = filtered.filter(course => 
        course.program_ids?.includes(selectedProgram)
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        (course.course_name && course.course_name.toLowerCase().includes(search)) ||
        (course.course_id && course.course_id.toLowerCase().includes(search)) ||
        (course.professor_name && course.professor_name.toLowerCase().includes(search))
      );
    }
    
    setFilteredCourses(filtered);
  }, [scheduledCourses, selectedDepartment, selectedProgram, searchTerm]);
  
  // Event handlers
  const handleDepartmentChange = (event: SelectChangeEvent) => {
    const deptId = event.target.value as string;
    setSelectedDepartment(deptId);
    setSelectedProgram('all');
  };
  
  const handleProgramChange = (event: SelectChangeEvent) => {
    setSelectedProgram(event.target.value as string);
  };
  
  const handleSemesterChange = (event: SelectChangeEvent) => {
    setSelectedSemester(event.target.value as string);
  };

  const handleScheduleChange = (event: SelectChangeEvent) => {
    console.log(`Selected schedule changed to: ${event.target.value}`);
    setSelectedScheduleId(event.target.value as string);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleViewModeChange = (_event: React.SyntheticEvent, newValue: string) => {
    setViewMode(newValue);
  };
  
  const handleDayChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentDay(newValue);
  };
  
  const handleCreateSchedule = () => {
    setShowGenerateForm(true);
  };

  const handleScheduleGenerated = (semesterId: string) => {
    console.log(`Schedule generated for semester: ${semesterId}, refreshing data`);
    setSelectedSemester(semesterId);
    setShowGenerateForm(false);
    // Reload the schedule data
    setTimeout(() => {
      handleRefresh();
    }, 500);
  };

  // Export schedule data to CSV
  const handleExport = () => {
    if (!scheduleData || !filteredCourses.length) {
      setError("No schedule data available to export");
      return;
    }

    try {
      // Get semester name
      const semesterName = semesters.find(s => s.semester_id === selectedSemester)?.name || 'Current Semester';
      
      // Create CSV header
      let csvContent = "Course Schedule - " + semesterName + "\n";
      csvContent += "Generated on: " + new Date().toLocaleString() + "\n\n";
      csvContent += "Course ID,Course Name,Professor,Day,Time,Type\n";
      
      // Add course data rows
      filteredCourses.forEach(course => {
        // Find the time slot info
        let timeSlotInfo = "Unknown";
        if (course.time_slot_number !== null) {
          const slot = timeSlots.find(ts => ts.id === course.time_slot_number);
          if (slot) {
            timeSlotInfo = `${slot.start}-${slot.end}`;
          }
        }
        
        const row = [
          course.course_id,
          course.course_name,
          course.professor_name || 'TBA',
          course.day_of_week,
          timeSlotInfo,
          course.is_core ? 'Core' : 'Elective'
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `schedule_${semesterName.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting schedule:", err);
      setError("Failed to export schedule");
    }
  };

  // Check if a course has conflicts
  const hasConflict = (course: any) => {
    if (!conflicts || !Array.isArray(conflicts)) return false;
    
    return conflicts.some(conflict => {
      if (!conflict.ScheduledCourses && !conflict.courses) return false;
      
      const conflictCourses = conflict.ScheduledCourses || conflict.courses || [];
      return (
        conflictCourses.some((c: any) => c.scheduled_course_id === course.scheduled_course_id) && 
        !conflict.is_resolved
      );
    });
  };

  // Find courses for a specific time slot and day
  const getCoursesForTimeSlot = (slotNumber: number, day: string): any[] => {
    // Add a unique ID for debugging
    const requestId = Math.random().toString(36).substring(2, 8);
    console.log(`[${requestId}] Finding courses for slot ${slotNumber} on ${day}`);
    
    if (!scheduleData?.courses || !Array.isArray(scheduleData.courses) || scheduleData.courses.length === 0) {
      console.log(`[${requestId}] No courses available`);
      return [];
    }
    
    // Explicitly log the first few courses to see their structure
    console.log(`[${requestId}] Schedule has ${scheduleData.courses.length} courses. Sample:`, 
      scheduleData.courses.slice(0, 3).map((c:any) => ({
        id: c.scheduled_course_id,
        name: c.course_name || 'Unknown',
        day: c.day_of_week,
        slot: c.time_slot_number,
        timeslotId: c.timeslot_id
      }))
    );
    
    // Try multiple matching strategies
    const matchingCourses = scheduleData.courses.filter((course: any) => {
      // 1. Easy case: direct match by time_slot_number and day
      if (course.time_slot_number === slotNumber && course.day_of_week === day) {
        console.log(`[${requestId}] DIRECT MATCH: ${course.course_name || 'Unknown course'}`);
        return true;
      }
      
      // 2. Try to extract slot number from timeslot_id (e.g., TS3-MON)
      let extractedSlotNumber = null;
      if (course.timeslot_id) {
        const match = course.timeslot_id.match(/TS(\d+)/i);
        if (match && match[1]) {
          extractedSlotNumber = parseInt(match[1], 10);
        }
      }
      
      // 3. Try to match by day code in timeslot_id
      let dayCodeMatches = false;
      if (course.timeslot_id) {
        const dayCode = day.substring(0, 3).toUpperCase();
        dayCodeMatches = course.timeslot_id.includes(`-${dayCode}`);
      }
      
      // 4. Try day normalization
      const normalizedCourseDay = normalizeDayName(course.day_of_week);
      const dayMatches = normalizedCourseDay === day;
      
      // Log slot number matches
      if ((extractedSlotNumber === slotNumber || course.time_slot_number === slotNumber) &&
          (dayMatches || dayCodeMatches)) {
        console.log(`[${requestId}] MATCH: ${course.course_name || 'Unknown course'} - Slot match: ${extractedSlotNumber} or ${course.time_slot_number}, Day match: ${dayMatches} or ${dayCodeMatches}`);
        return true;
      }
      
      return false;
    });
    
    console.log(`[${requestId}] Found ${matchingCourses.length} courses for slot ${slotNumber} on ${day}`);
    return matchingCourses;
  };

  // Handle conflict resolution
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

  // Handle conflict override
  const handleOverrideConflict = async (conflictId: string) => {
    try {
      // Simplified implementation - in a real app, would open a dialog to collect details
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

  // Determine background color for course blocks
  const getCourseColor = (course: any) => {
    if (course.is_override) return 'rgba(255, 152, 0, 0.8)'; // Orange for overrides
    if (course.is_core) return 'rgba(25, 118, 210, 0.8)'; // Blue for core courses
    return 'rgba(76, 175, 80, 0.8)'; // Green for electives
  };

  // Render a single course block in the timetable
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

  // Render week view
  const renderWeekView = () => {
    console.log('Rendering week view with data:', {
      scheduleId: scheduleData?.schedule_id,
      courseCount: scheduleData?.courses?.length || 0,
      sampleCourse: scheduleData?.courses?.[0] || 'none'
    });
    
    if (!scheduleData || !scheduleData.courses || scheduleData.courses.length === 0) {
      return (
        <Paper sx={{ mt: 2, p: 3, textAlign: 'center' }}>
          <Typography>No schedule data available or no courses found.</Typography>
        </Paper>
      );
    }
    
    // Log each time slot and how many courses are found for debugging
    timeSlots.forEach(slot => {
      daysOfWeek.forEach(day => {
        const coursesForSlot = getCoursesForTimeSlot(slot.id, day);
        if (coursesForSlot.length > 0) {
          console.log(`Found ${coursesForSlot.length} courses for ${day} at slot ${slot.id}`);
        }
      });
    });

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

                  {/* Time slots for this day */}
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
                        {coursesForSlot.length > 0 ? (
                          coursesForSlot.map(course => renderCourseBlock(course))
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No courses
                          </Typography>
                        )}
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
    
    // Get courses for this specific day
    const dayFilteredCourses = filteredCourses.filter(course => 
      course.day_of_week === day || normalizeDayName(course.day_of_week) === day
    );

    return (
      <Paper sx={{ mt: 2 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {day}'s Schedule
          </Typography>
          <Grid container spacing={2}>
            {timeSlots.map(slot => {
              // Get courses for this time slot on this day
              const slotCourses = dayFilteredCourses.filter(course => {
                const courseSlotNumber = course.time_slot_number || 
                                        extractSlotNumber(course.timeslot_id);
                return courseSlotNumber === slot.id;
              });

              return (
                <Grid item xs={12} key={slot.id}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderLeft: 4, 
                      borderColor: slotCourses.length > 0 ? 'primary.main' : 'grey.300'
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary">
                      {slot.start} - {slot.end}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {slotCourses.length > 0 ? (
                        slotCourses.map(course => renderCourseBlock(course))
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

  // Render the conflicts section
  const renderConflicts = () => {
    const displayConflicts = showResolvedConflicts 
      ? conflicts 
      : conflicts.filter(conflict => !conflict.is_resolved);
    
    if (!displayConflicts || displayConflicts.length === 0) {
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
          {displayConflicts.map(conflict => {
            // Handle different ways conflict courses might be structured
            const conflictCourses = conflict.courses || conflict.ScheduledCourses || [];
            
            return (
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
                      
                      {conflictCourses.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Affected Courses:
                          </Typography>
                          {conflictCourses.map((course: any) => {
                            // Extract course data which might be nested
                            const courseData = course.Course || course;
                            const professorData = course.Professor || course.professor || {};
                            const professorName = `${professorData.first_name || ''} ${professorData.last_name || ''}`.trim() || 'TBA';
                            const courseName = courseData.course_name || course.course_name || 'Unknown Course';
                            
                            return (
                              <Typography key={course.scheduled_course_id} variant="body2" sx={{ ml: 2 }}>
                                • {courseName} (Prof. {professorName})
                              </Typography>
                            );
                          })}
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
            );
          })}
        </Grid>
      </Paper>
    );
  };

  // Main render
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
              variant="outlined"
              color="primary"
              startIcon={<GetAppIcon />}
              onClick={handleExport}
              sx={{ mr: 2 }}
            >
              Export
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
        
        {/* Error Alert */}
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
              {/* Semester Selector */}
              <Grid item xs={12} md={2.4}>
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
              
              {/* Schedule Selector */}
              <Grid item xs={12} md={2.4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="schedule-select-label">Schedule</InputLabel>
                  <Select
                    labelId="schedule-select-label"
                    value={selectedScheduleId}
                    onChange={handleScheduleChange}
                    label="Schedule"
                    disabled={availableSchedules.length === 0}
                  >
                    {availableSchedules.map((schedule) => (
                      <MenuItem key={schedule.schedule_id} value={schedule.schedule_id}>
                        {schedule.name} {schedule.is_final ? '(Final)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Department Selector */}
              <Grid item xs={12} md={2.4}>
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
              
              {/* Program Selector */}
              <Grid item xs={12} md={2.4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="program-select-label">Program</InputLabel>
                  <Select
                    labelId="program-select-label"
                    value={selectedProgram}
                    onChange={handleProgramChange}
                    label="Program"
                    disabled={!selectedDepartment}
                  >
                    <MenuItem value="all">
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
              
              {/* Search Field */}
              <Grid item xs={12} md={2.4}>
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

      {/* Generate Schedule Dialog */}
      {showGenerateForm && (
        <Dialog open={showGenerateForm} onClose={() => setShowGenerateForm(false)} maxWidth="md" fullWidth>
          <DialogTitle>Generate New Schedule</DialogTitle>
          <DialogContent>
            <GenerateSchedule 
              onScheduleGenerated={handleScheduleGenerated} 
              onClose={() => setShowGenerateForm(false)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowGenerateForm(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default ScheduleView;