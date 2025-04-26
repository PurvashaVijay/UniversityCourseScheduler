// src/components/admin/schedule/ScheduleList.tsx
import React, { useState, useEffect } from 'react';
import {
Box,
Card,
CardContent,
FormControl,
InputLabel,
MenuItem,
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
ListItemText,
Select,
SelectChangeEvent
} from '@mui/material';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import scheduleService, { ScheduledCourse, TimeSlot } from '../../../services/scheduleService';
import semesterService from '../../../services/semesterService';
import CourseChangeDialog from './CourseChangeDialog';

import * as XLSX from 'xlsx';
import UploadIcon from '@mui/icons-material/Upload';
import jsPDF from 'jspdf';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';


// Enhanced Schedule interface to include department_id and program_id
interface Schedule {
schedule_id: string;
semester_id: string;
name: string;
is_final: boolean;
created_at: string;
updated_at: string;
semester?: {
name: string;
};
department_id?: string;
program_id?: string;
}

interface Semester {
semester_id: string;
name: string;
}


interface Program {
program_id: string;
name: string;

}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

type ViewMode = 'day' | 'week';

interface ScheduleListProps {
selectedScheduleId?: string;
forceRefresh?: number; // A counter that when incremented will force a refresh
onScheduleDeleted?: () => void; // Callback for when a schedule is deleted
onScheduleSelected?: (scheduleId: string) => void; // Callback for when a schedule is selected
programs?: Program[];
selectedProgram?: string;
loadingPrograms?: boolean;
onProgramChange?: (event: SelectChangeEvent) => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({
selectedScheduleId,
forceRefresh = 0,
onScheduleDeleted,
onScheduleSelected,
programs = [],
selectedProgram = '',
loadingPrograms = false,
onProgramChange
}) => {
// Define refreshCounter state variable
const [refreshCounter, setRefreshCounter] = useState<number>(0);

const [schedules, setSchedules] = useState<Schedule[]>([]);
const [semesters, setSemesters] = useState<Semester[]>([]);
const [selectedSchedule, setSelectedSchedule] = useState<string>('');
const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);
const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]); // Renamed from timeSlots
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

// New state for course change dialog
const [courseChangeDialogOpen, setCourseChangeDialogOpen] = useState<boolean>(false);
const [selectedCourseForChange, setSelectedCourseForChange] = useState<ScheduledCourse | null>(null);

useEffect(() => {
// This ensures the value is read
console.log('Schedule refresh triggered:', refreshCounter);
}, [refreshCounter]);

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
// Load schedules for selected semester
useEffect(() => {
  if (!selectedSemester) return;
  
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching schedules for semester:', selectedSemester);
      console.log('Selected program:', selectedProgram);
      console.log('ForceRefresh value:', forceRefresh);
      
      // Pass department and program IDs to the service call
      const data = await scheduleService.getSchedulesBySemester(
        selectedSemester,
        selectedProgram || undefined
      );
      
      console.log('Fetched schedules:', data);
      setSchedules(data);
      
      // If there's a selected schedule ID from props, use it
      if (selectedScheduleId && data.some(s => s.schedule_id === selectedScheduleId)) {
        console.log('Setting selected schedule to selectedScheduleId:', selectedScheduleId);
        setSelectedSchedule(selectedScheduleId);
      } else if (data.length > 0) {
        console.log('Setting selected schedule to first schedule:', data[0].schedule_id);
        setSelectedSchedule(data[0].schedule_id);
        // Call the callback to notify parent of selection
        if (onScheduleSelected) {
          onScheduleSelected(data[0].schedule_id);
        }
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
  
  console.log('Schedules useEffect triggered');
  console.log('Selected semester:', selectedSemester);
  console.log('Selected program:', selectedProgram);
  console.log('Selected schedule ID from props:', selectedScheduleId);
  console.log('ForceRefresh value:', forceRefresh);
  
  fetchData();
}, [selectedSemester, selectedProgram, selectedScheduleId, forceRefresh, onScheduleSelected]);

// Auto-select the first schedule when there's only one and notify parent
useEffect(() => {
if (schedules.length === 1 && schedules[0].schedule_id && onScheduleSelected) {
console.log("Auto-selecting the only schedule:", schedules[0].schedule_id);
setSelectedSchedule(schedules[0].schedule_id);
onScheduleSelected(schedules[0].schedule_id);
}
}, [schedules, onScheduleSelected]);

// Load all time slots
useEffect(() => {
const fetchTimeSlots = async () => {
try {
const data = await scheduleService.getAllTimeSlots();
setAllTimeSlots(data); // Now using allTimeSlots
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
// Load scheduled courses for selected schedule with program filtering
// Load scheduled courses for selected schedule
useEffect(() => {
  const fetchScheduledCourses = async () => {
    if (!selectedSchedule) return;
    try {
      setLoadingCourses(true);
      console.log('Fetching scheduled courses for schedule:', selectedSchedule);
      console.log('Using program filter:', selectedProgram || 'none');
      
      // Pass the program ID to filter courses
      const data = await scheduleService.getScheduledCourses(
        selectedSchedule,
        selectedProgram || undefined
      );
      
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
}, [selectedSchedule, selectedProgram]); // Add selectedProgram to dependency array
// Fixed the type for event parameter
const handleSemesterChange = (event: SelectChangeEvent) => {
setSelectedSemester(event.target.value);
};

// Fixed the type for event parameter
const handleScheduleChange = (event: SelectChangeEvent) => {
const newScheduleId = event.target.value;
console.log("Schedule selected manually:", newScheduleId);
setSelectedSchedule(newScheduleId);

if (onScheduleSelected && newScheduleId) {
console.log("Calling onScheduleSelected with:", newScheduleId);
onScheduleSelected(newScheduleId);
}
};

const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: ViewMode | null) => {
if (newViewMode) {
setViewMode(newViewMode);
}
};

const handleCloseSnackbar = () => {
setSnackbar({ ...snackbar, open: false });
};


// Functions for course change dialog
const handleCourseClick = (course: ScheduledCourse) => {
setSelectedCourseForChange(course);
setCourseChangeDialogOpen(true);
};

const handleCourseChangeDialogClose = () => {
setCourseChangeDialogOpen(false);
setSelectedCourseForChange(null);
};

const handleCourseChanged = () => {
console.log("Course changed, refreshing data");
// Force refresh the schedule list using the local state update function
setRefreshCounter(prev => prev + 1);

// Notify parent of changes if callback exists
if (onScheduleSelected && selectedSchedule) {
onScheduleSelected(selectedSchedule);
}
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
// Notify parent of new selection
if (onScheduleSelected) {
onScheduleSelected(updatedSchedules[0].schedule_id);
}
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
return allTimeSlots // Changed from timeSlots to allTimeSlots
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

// Add this function inside the ScheduleList component
const handleExportToExcel = () => {
  if (scheduledCourses.length === 0) {
    setSnackbar({
      open: true,
      message: 'No courses to export',
      severity: 'warning'
    });
    return;
  }

  try {
    const wb = XLSX.utils.book_new();
    
    // Create single worksheet with days as columns
    const data = [
      ['Time Slot', ...DAYS_OF_WEEK] // Header row
    ];
    
    // Get all time slots sorted by start time
    const allTimeSlotsSorted = allTimeSlots
      .filter((slot, index, self) => 
        // Get unique time slot names
        index === self.findIndex(s => s.name === slot.name)
      )
      .sort((a, b) => {
        const timeA = new Date(`1970-01-01T${a.start_time}`).getTime();
        const timeB = new Date(`1970-01-01T${b.start_time}`).getTime();
        return timeA - timeB;
      });
    
    // For each time slot, create a row
    allTimeSlotsSorted.forEach(timeSlot => {
      const row = [
        `${timeSlot.name} (${timeSlot.start_time.substring(0, 5)} - ${timeSlot.end_time.substring(0, 5)})`
      ];
      
      // For each day, get all courses for this time slot
      DAYS_OF_WEEK.forEach(day => {
        // Find all time slots with this name and day
        const matchingSlots = allTimeSlots.filter(
          slot => slot.name === timeSlot.name && slot.day_of_week === day
        );
        
        // Get all courses for these slots
        let courses: ScheduledCourse[] = [];
        matchingSlots.forEach(slot => {
          const slotsCoursesForDay = getCoursesForTimeSlot(slot.timeslot_id, day);
          courses = [...courses, ...slotsCoursesForDay];
        });
        
        // Create cell content with courses stacked
        let cellContent = '';
        courses.forEach((course, idx) => {
          cellContent += `${course.course_id} - ${course.course?.course_name || 'Unnamed Course'}\n`;
          cellContent += `Prof: ${course.professor?.first_name || ''} ${course.professor?.last_name || ''}\n`;
          
          // Add a blank line between courses (except after the last one)
          if (idx < courses.length - 1) {
            cellContent += '\n';
          }
        });
        
        row.push(cellContent);
      });
      
      data.push(row);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // Time slot column
      { wch: 30 }, // Monday column
      { wch: 30 }, // Tuesday column
      { wch: 30 }, // Wednesday column
      { wch: 30 }, // Thursday column
      { wch: 30 }  // Friday column
    ];
    
    // Properly type the rowHeights object
    const rowHeights: { [key: number]: { hpt: number } } = {};
    data.forEach((_, idx) => {
      // Skip header row
      if (idx > 0) {
        // Set row height to accommodate multiple courses
        rowHeights[idx] = {
          hpt: 120 // Height in points - adjust as needed
        };
      }
    });
    
    ws['!cols'] = colWidths;
    
    // Add row heights (SheetJS format)
    ws['!rows'] = [];
    for (let i = 0; i < data.length; i++) {
      ws['!rows'][i] = i in rowHeights ? rowHeights[i] : {};
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    
    // Get current schedule and semester info for filename
    const currentSchedule = schedules.find(s => s.schedule_id === selectedSchedule);
    const scheduleName = currentSchedule ? currentSchedule.name : 'schedule';
    const semesterName = currentSchedule?.semester?.name || '';
    
    // Generate filename
    const filename = `${semesterName} - ${scheduleName}.xlsx`;
    
    // Write and download file
    XLSX.writeFile(wb, filename);
    
    setSnackbar({
      open: true,
      message: 'Schedule exported successfully',
      severity: 'success'
    });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    setSnackbar({
      open: true,
      message: 'Failed to export schedule',
      severity: 'error'
    });
  }
};

const handleExportToPdf = () => {
  if (scheduledCourses.length === 0) {
    setSnackbar({
      open: true,
      message: 'No courses to export',
      severity: 'warning'
    });
    return;
  }

  try {
    // Create new PDF document (landscape for better schedule viewing)
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Get current schedule and semester info for title
    const currentSchedule = schedules.find(s => s.schedule_id === selectedSchedule);
    const scheduleName = currentSchedule ? currentSchedule.name : 'Schedule';
    const semesterName = currentSchedule?.semester?.name || '';
    
    // Page width and height for reference
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Function to add headers to a page
    const addHeaders = (yPosition: number) => {
      // Add table header with in-person label
      doc.setFillColor(173, 216, 230); // Light blue
      doc.setDrawColor(100, 100, 100); // Grey
      doc.rect(14, yPosition, pageWidth - 28, 10, 'FD'); // FD = Fill and Draw
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('In-Person', pageWidth / 2, yPosition + 6, { align: 'center' });
      
      yPosition += 10;
      
      // Add day headers
      doc.setFillColor(173, 216, 230);
      doc.rect(14, yPosition, 40, 10, 'FD');
      doc.text('Time', 14 + (40 / 2), yPosition + 6, { align: 'center' });
      
      const dayColWidth = (pageWidth - 28 - 40) / DAYS_OF_WEEK.length;
      
      for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
        const xPos = 14 + 40 + (i * dayColWidth);
        doc.setFillColor(173, 216, 230);
        doc.rect(xPos, yPosition, dayColWidth, 10, 'FD');
        doc.text(DAYS_OF_WEEK[i], xPos + (dayColWidth / 2), yPosition + 6, { align: 'center' });
      }
      
      return yPosition + 10; // Return the new y position
    };
    
    // Define table dimensions
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    const timeColWidth = 40;
    const dayColWidth = (tableWidth - timeColWidth) / DAYS_OF_WEEK.length;
    
    // Add title
    doc.setFontSize(16);
    doc.text(`${semesterName} - ${scheduleName}`, margin, 15);
    
    // Start with headers
    let yPos = 25;
    yPos = addHeaders(yPos);
    
    // Process each time slot
    for (let i = 0; i < getUniqueTimeSlots().length; i++) {
      const timeSlot = getUniqueTimeSlots()[i];
      
      // Calculate row height based on maximum number of courses
      let maxCourses = 0;
      
      for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
        const timeslotId = getTimeslotIdForTimeAndDay(
          timeSlot.start_time,
          timeSlot.end_time,
          DAYS_OF_WEEK[j]
        );
        
        if (timeslotId) {
          const courses = getCoursesForTimeSlot(timeslotId, DAYS_OF_WEEK[j]);
          maxCourses = Math.max(maxCourses, courses ? courses.length : 0);
        }
      }
      
      // Base height is 15mm plus 12mm per course
      const rowHeight = Math.max(20, 15 + (maxCourses * 12));
      
      // Check if this row will fit on the current page
      if (yPos + rowHeight > pageHeight - 20) {
        doc.addPage();
        yPos = 25;
        yPos = addHeaders(yPos);
      }
      
      // Time slot column with blue background
      doc.setFillColor(220, 240, 250); // Lighter blue
      doc.rect(margin, yPos, timeColWidth, rowHeight, 'FD');
      
      // Time slot text
      doc.setFontSize(10);
      doc.text(
        `${timeSlot.start_time.substring(0, 5)} - ${timeSlot.end_time.substring(0, 5)}`,
        margin + (timeColWidth / 2),
        yPos + 10,
        { align: 'center' }
      );
      
      // For each day (column)
      for (let j = 0; j < DAYS_OF_WEEK.length; j++) {
        const day = DAYS_OF_WEEK[j];
        const xPos = margin + timeColWidth + (j * dayColWidth);
        
        // Draw cell with border
        doc.setFillColor(255, 255, 255); // White background
        doc.rect(xPos, yPos, dayColWidth, rowHeight, 'FD');
        
        // Find time slot IDs for this day and time
        const timeslotId = getTimeslotIdForTimeAndDay(
          timeSlot.start_time,
          timeSlot.end_time,
          day
        );
        
        // Get courses for this time slot and day
        let courses: any[] = [];
        if (timeslotId) {
          courses = getCoursesForTimeSlot(timeslotId, day) || [];
        }
        
        // Add course info
        if (courses.length > 0) {
          doc.setFontSize(8);
          let courseYPos = yPos + 4; // Start text position
          
          for (let k = 0; k < courses.length; k++) {
            const course = courses[k];
            
            // Course ID in bold
            doc.setFont("helvetica", "bold");
            doc.text(course.course_id, xPos + 2, courseYPos);
            courseYPos += 3.5;
            
            // Course name with text wrapping
            doc.setFont("helvetica", "normal");
            const courseName = course.course?.course_name || 'Unnamed Course';
            
            // Split text to fit column width
            const maxWidth = dayColWidth - 4;
            const textLines = doc.splitTextToSize(courseName, maxWidth);
            
            // Add text line by line
            for (let l = 0; l < textLines.length; l++) {
              doc.text(textLines[l], xPos + 2, courseYPos);
              courseYPos += 3.5;
            }
            
            // Professor name
            const profName = `${course.professor?.first_name || ''} ${course.professor?.last_name || ''}`;
            doc.text(profName, xPos + 2, courseYPos);
            
            // Add more space between courses
            courseYPos += 5;
          }
        }
      }
      
      // Move to next row
      yPos += rowHeight;
    }
    
    // Generate filename and save
    const filename = `${semesterName} - ${scheduleName}.pdf`;
    doc.save(filename);
    
    setSnackbar({
      open: true,
      message: 'Schedule exported to PDF successfully',
      severity: 'success'
    });
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    setSnackbar({
      open: true,
      message: 'Failed to export schedule to PDF',
      severity: 'error'
    });
  }
};

// Get all unique time slots across all days sorted by start time
const getUniqueTimeSlots = () => {
// Map to store unique time slots by time range
// Key format: "start_time-end_time"
const uniqueSlots = new Map<string, TimeSlot[]>();

// Group time slots by time range (regardless of day)
allTimeSlots.forEach(slot => { // Changed from timeSlots to allTimeSlots
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
const slot = allTimeSlots.find( // Changed from timeSlots to allTimeSlots
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
bgcolor: isCoreClass ? '#e3f2fd' : '#f1f8e9',
cursor: 'pointer',
'&:hover': {
opacity: 0.9,
boxShadow: 1,
}
}}
onClick={() => handleCourseClick(course)}
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
color="default"
sx={{ 
  mt: 0.5, 
  fontSize: '0.6rem', 
  height: '18px',      
  '& .MuiChip-label': {
    padding: '0 6px'   
  },
  backgroundColor: '#F69420',  
  color: '#ffffff'         
}}
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

{/* Program dropdown - only enabled when department is selected */}
<Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
<FormControl fullWidth sx={{ flex: 1, minWidth: '200px' }}>
  <InputLabel id="program-select-label">Program</InputLabel>
  <Select
    labelId="program-select-label"
    id="program-select"
    value={selectedProgram}
    label="Program"
    onChange={onProgramChange}
    disabled={loadingPrograms}
  >
    <MenuItem value="" style={{ color: '#000000' }}>All Programs</MenuItem>
    {programs.map((program) => (
      <MenuItem key={program.program_id} value={program.program_id}>
        {program.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
</Box>
</Box>

<Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, mt: 2 }}>
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

  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {/* Add the export button here */}
    <Button
      variant="outlined"
      startIcon={<UploadIcon />}
      onClick={handleExportToExcel}
      disabled={loading || loadingCourses || schedules.length === 0 || !selectedSchedule}
      size="small"
      sx={{ height: 'fit-content' }}
    >
      Export to Excel
    </Button>
    
    <Button
    variant="outlined"
    startIcon={<PictureAsPdfIcon />}
    onClick={handleExportToPdf}
    disabled={loading || loadingCourses || schedules.length === 0 || !selectedSchedule}
    size="small"
    color="primary"
  >
    Export to PDF
  </Button>
    {scheduledCourses.length > 0 && (
      <Typography variant="body2">
        {scheduledCourses.length} courses scheduled
      </Typography>
    )}
  </Box>
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

{/* Course Change Dialog */}
<CourseChangeDialog
open={courseChangeDialogOpen}
onClose={handleCourseChangeDialogClose}
scheduledCourse={selectedCourseForChange}
onCourseChanged={handleCourseChanged}
/>
</Box>
);
};

export default ScheduleList;