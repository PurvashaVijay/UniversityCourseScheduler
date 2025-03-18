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
  Switch,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../common/DataTable';
import ConfirmDialog from '../../common/ConfirmDialog';

// Mock data functions (replace with actual API calls later)
const fetchDepartments = async () => {
  // This would be an API call to get all departments
  return [
    { id: 'DEPT-001', department_id: 'DEPT-001', name: 'Computer Science', description: 'CS Department' },
    { id: 'DEPT-002', department_id: 'DEPT-002', name: 'Economics', description: 'Economics Department' },
    { id: 'DEPT-003', department_id: 'DEPT-003', name: 'Mathematics', description: 'Mathematics Department' },
  ];
};

const fetchProgramsByDepartment = async (departmentId: string) => {
  // This would be an API call to get programs for a specific department
  const programsMap: { [key: string]: any[] } = {
    'DEPT-001': [
      { id: 'PROG-001', program_id: 'PROG-001', name: 'Bachelor of Science in Computer Science', department_id: 'DEPT-001' },
      { id: 'PROG-002', program_id: 'PROG-002', name: 'Master of Science in Computer Science', department_id: 'DEPT-001' }
    ],
    'DEPT-002': [
      { id: 'PROG-003', program_id: 'PROG-003', name: 'Bachelor of Economics', department_id: 'DEPT-002' },
      { id: 'PROG-004', program_id: 'PROG-004', name: 'Master of Economics', department_id: 'DEPT-002' }
    ],
    'DEPT-003': [
      { id: 'PROG-005', program_id: 'PROG-005', name: 'Bachelor of Mathematics', department_id: 'DEPT-003' }
    ]
  };
  
  return programsMap[departmentId] || [];
};

const fetchCourses = async (programId: string) => {
  // This would be an API call to get courses for a specific program
  const coursesMap: { [key: string]: any[] } = {
    'PROG-001': [
      { id: 'COURSE-001', course_id: 'CS101', program_id: 'PROG-001', name: 'Introduction to Programming', description: 'Basic programming concepts', duration_minutes: 55, is_core: true },
      { id: 'COURSE-002', course_id: 'CS201', program_id: 'PROG-001', name: 'Data Structures', description: 'Advanced data structures', duration_minutes: 55, is_core: true },
      { id: 'COURSE-003', course_id: 'CS301', program_id: 'PROG-001', name: 'Algorithms', description: 'Algorithm design and analysis', duration_minutes: 80, is_core: true },
      { id: 'COURSE-004', course_id: 'CS401', program_id: 'PROG-001', name: 'Web Development', description: 'Web technologies and frameworks', duration_minutes: 80, is_core: false }
    ],
    'PROG-002': [
      { id: 'COURSE-005', course_id: 'CS501', program_id: 'PROG-002', name: 'Advanced Algorithms', description: 'Complex algorithms and optimization', duration_minutes: 80, is_core: true },
      { id: 'COURSE-006', course_id: 'CS601', program_id: 'PROG-002', name: 'Machine Learning', description: 'ML concepts and applications', duration_minutes: 80, is_core: true },
      { id: 'COURSE-007', course_id: 'CS701', program_id: 'PROG-002', name: 'Big Data Analytics', description: 'Big data processing frameworks', duration_minutes: 180, is_core: false }
    ],
    'PROG-003': [
      { id: 'COURSE-008', course_id: 'ECON101', program_id: 'PROG-003', name: 'Principles of Economics', description: 'Basic economic principles', duration_minutes: 55, is_core: true },
      { id: 'COURSE-009', course_id: 'ECON201', program_id: 'PROG-003', name: 'Microeconomics', description: 'Study of market behavior', duration_minutes: 55, is_core: true }
    ]
  };
  
  return coursesMap[programId] || [];
};

const deleteCourses = async (ids: string[]) => {
  console.log('Deleting courses:', ids);
  return { success: true, message: 'Courses deleted successfully' };
};

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCoreOnly, setShowCoreOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [coursesToDelete, setCoursesToDelete] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const columns = [
    { id: 'course_id', label: 'Course ID', minWidth: 100 },
    { id: 'program_id', label: 'Program ID', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'description', label: 'Description', minWidth: 200 },
    { 
      id: 'duration_minutes', 
      label: 'Duration (min)', 
      minWidth: 120,
      align: 'right' as const,
      format: (value: number) => value.toString()
    },
    { 
      id: 'is_core', 
      label: 'Core Course', 
      minWidth: 120,
      format: (value: boolean) => value ? 'Core' : 'Elective'
    }
  ];

  // Load departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const data = await fetchDepartments();
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
          
          const data = await fetchProgramsByDepartment(selectedDepartment);
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

  const loadCourses = async (programId: string) => {
    try {
      setLoadingCourses(true);
      const data = await fetchCourses(programId);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load courses',
        severity: 'error'
      });
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
    setCoursesToDelete(idsArray);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteCourses(coursesToDelete);
      
      if (result.success) {
        // Remove deleted courses from state
        setCourses(courses.filter(
          course => !coursesToDelete.includes(course.id)
        ));
        
        setSnackbar({
          open: true,
          message: result.message,
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
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/admin/courses/${id}`);
  };

  // Filter courses based on search term and core filter
  const filteredCourses = courses.filter(course => 
    (course.course_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!showCoreOnly || course.is_core)
  );

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
                  <em>Please select a department</em>
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
                  <em>Please select a program</em>
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
