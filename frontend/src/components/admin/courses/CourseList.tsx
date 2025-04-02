// src/components/admin/courses/CourseList.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  SelectChangeEvent,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

// Import real API services
import departmentService from '../../../services/departmentService';
import programService from '../../../services/programService';
import courseService, { Course } from '../../../services/courseService';

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [deletingCourses, setDeletingCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCoreOnly, setShowCoreOnly] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>(['Fall', 'Spring']);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coursesToDelete, setCoursesToDelete] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const columns = [
    { id: 'course_id', label: 'Course ID', minWidth: 100 },
    { id: 'program_id', label: 'Program ID', minWidth: 100 },
    { id: 'course_name', label: 'Name', minWidth: 170 },
    { 
      id: 'duration_minutes', 
      label: 'Duration (min)', 
      minWidth: 120,
      align: 'right' as const,
      format: (value: number | undefined) => value?.toString() || '0'
    },
    { 
      id: 'is_core', 
      label: 'Core Course', 
      minWidth: 120,
      format: (value: boolean | undefined) => value ? 'Core' : 'Elective'
    },
    {
      id: 'semesters',
      label: 'Semesters',
      minWidth: 120,
      format: (value: string[] | string | undefined | null) => {
        if (!value) return '';
        return Array.isArray(value) ? value.join(', ') : String(value);
      }
    },
  ];  

  // Load departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error loading departments:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load departments',
          severity: 'error'
        });
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, []);

  // Load programs when department is selected
  useEffect(() => {
    if (selectedDepartment) {
      const loadPrograms = async () => {
        try {
          setLoadingPrograms(true);
          setPrograms([]);
          setSelectedProgram('');
          setCourses([]);
          
          const data = await programService.getProgramsByDepartment(selectedDepartment);
          setPrograms(data);
        } catch (error) {
          console.error('Error loading programs:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load programs',
            severity: 'error'
          });
        } finally {
          setLoadingPrograms(false);
        }
      };

      loadPrograms();
    } else {
      setPrograms([]);
      setSelectedProgram('');
      setCourses([]);
    }
  }, [selectedDepartment]);

  // Load courses when program is selected
  useEffect(() => {
    if (selectedProgram) {
      loadCourses(selectedProgram);
    } else {
      setCourses([]);
    }
  }, [selectedProgram]);

  // Updated loadCourses function using direct fetch
  const loadCourses = async (programId: string) => {
    try {
      setLoadingCourses(true);
      console.log('Loading courses for program:', programId);
      
      const token = localStorage.getItem('token');
      // Direct fetch to bypass service layer temporarily
      const response = await fetch(`http://localhost:3000/api/courses/program/${programId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const rawData = await response.json();
      console.log('Raw API response:', rawData);
      
      // Simple transformation to ensure consistent data structure
      const processedCourses = rawData.map((course: any) => ({
        course_id: course.course_id,
        program_id: programId,
        course_name: course.course_name || '',
        name: course.course_name || '',
        department_id: course.department_id || '',
        duration_minutes: course.duration_minutes || 0,
        is_core: Boolean(course.is_core),
        // Handle semesters with fallbacks
        semesters: Array.isArray(course.semesters) ? course.semesters : []
      }));
      
      console.log('Processed courses:', processedCourses);
      setCourses(processedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load courses',
        severity: 'error'
      });
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleDepartmentChange = (event: SelectChangeEvent) => {
    setSelectedDepartment(event.target.value);
  };

  const handleProgramChange = (event: SelectChangeEvent) => {
    setSelectedProgram(event.target.value);
  };

  const handleAddCourse = () => {
    if (selectedProgram) {
      navigate(`/admin/courses/new?programId=${selectedProgram}`);
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a department and program first',
        severity: 'error'
      });
    }
  };

  const handleEditCourse = (id: string) => {
    navigate(`/admin/courses/${id}/edit`);
  };

  const handleDeleteClick = (ids: string | string[]) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    console.log('Delete clicked for courses:', idsArray);
    setCoursesToDelete(idsArray);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeletingCourses(true);
      console.log(`CourseList: Deleting courses: ${coursesToDelete.join(', ')}`);
      
      // Call the courseService.deleteCourses method
      const result = await courseService.deleteCourses(coursesToDelete);
      
      if (result.success) {
        // Remove deleted courses from state
        setCourses(prevCourses => 
          prevCourses.filter(course => !coursesToDelete.includes(course.course_id))
        );
        
        setSnackbar({
          open: true,
          message: result.message || 'Courses deleted successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to delete courses',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting courses:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete courses',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setCoursesToDelete([]);
      setDeletingCourses(false);
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/admin/courses/${id}`);
  };

  // Filter courses based on Semester checkbox 
  const SemesterFilter: React.FC<{
    selectedSemesters: string[];
    onChange: (semesters: string[]) => void;
  }> = ({ selectedSemesters, onChange }) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value, checked } = event.target;
      
      if (checked) {
        onChange([...selectedSemesters, value]);
      } else {
        onChange(selectedSemesters.filter(semester => semester !== value));
      }
    };

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Semester
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={selectedSemesters.includes('Fall')}
                onChange={handleChange}
                value="Fall"
              />
            }
            label="Fall"
          />
          <FormControlLabel
            control={
              <Checkbox 
                checked={selectedSemesters.includes('Spring')}
                onChange={handleChange}
                value="Spring"
              />
            }
            label="Spring"
          />
        </Box>
      </Box>
    );
  };

  // Simplified filtering logic
  const filteredCourses = courses.filter(course => {
    // Search filtering
    const searchMatch = !searchTerm || 
      course.course_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Core course filtering
    const coreMatch = !showCoreOnly || course.is_core;
    
    // Semester filtering - temporarily simplified
    const semesterMatch = selectedSemesters.length === 0 || 
      (course.semesters && course.semesters.some(sem => 
        selectedSemesters.includes(sem)
      ));
    
    console.log(
      `Course ${course.course_id} - search: ${searchMatch}, core: ${coreMatch}, semester: ${semesterMatch}`,
      `Semesters: ${JSON.stringify(course.semesters)}`
    );
    
    return searchMatch && coreMatch && semesterMatch;
  });

  // Debug logging
  console.log('Selected semesters:', selectedSemesters);
  console.log('Total courses:', courses.length);
  console.log('Filtered courses:', filteredCourses.length);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Courses
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCourse}
          sx={{ bgcolor: '#00539F' }}
          disabled={!selectedProgram}
        >
          Add Course
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="department-select-label">Select Department</InputLabel>
              <Select
                labelId="department-select-label"
                id="department-select"
                value={selectedDepartment}
                label="Select Department"
                onChange={handleDepartmentChange}
                disabled={loadingDepartments}
              >
                <MenuItem value="">
                  <em>Select a department</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }} disabled={!selectedDepartment || loadingPrograms}>
              <InputLabel id="program-select-label">Select Program</InputLabel>
              <Select
                labelId="program-select-label"
                id="program-select"
                value={selectedProgram}
                label="Select Program"
                onChange={handleProgramChange}
                disabled={!selectedDepartment || loadingPrograms}
              >
                <MenuItem value="">
                  <em>Select a program</em>
                </MenuItem>
                {programs.map((prog) => (
                  <MenuItem key={prog.program_id} value={prog.program_id}>
                    {prog.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <SemesterFilter 
            selectedSemesters={selectedSemesters}
            onChange={setSelectedSemesters}
          />
        </Grid>
    
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: '70%' }}
          />
          <FormGroup>
            <FormControlLabel 
              control={
                <Switch
                  checked={showCoreOnly}
                  onChange={(e) => setShowCoreOnly(e.target.checked)}
                  color="primary"
                />
              } 
              label="Core Courses Only" 
            />
          </FormGroup>
        </Box>
      </Box>

      {loadingDepartments || loadingPrograms || loadingCourses ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {!selectedDepartment ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Please select a department to view programs
              </Typography>
            </Box>
          ) : !selectedProgram ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Please select a program to view courses
              </Typography>
            </Box>
          ) : filteredCourses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No courses found for this program
              </Typography>
            </Box>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCourses}
              title={`Courses - ${programs.find(p => p.program_id === selectedProgram)?.name || ''}`}
              onEdit={handleEditCourse}
              onDelete={handleDeleteClick}
              onRowClick={handleRowClick}
              selectable
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Course"
        message={`Are you sure you want to delete ${coursesToDelete.length > 1 
          ? 'these courses' 
          : 'this course'}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Delete"
        severity="error"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CourseList;