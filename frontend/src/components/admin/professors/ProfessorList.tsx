// ProfessorList.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  IconButton,
  AlertTitle,
  Alert,
  Chip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import professorService, { Professor } from '../../../services/professorService';
import departmentService, { Department } from '../../../services/departmentService';
import courseService, { Course } from '../../../services/courseService';
import ProfessorForm from "./ProfessorForm";

const ProfessorList: React.FC = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editProfessor, setEditProfessor] = useState<Professor | null>(null);
  
  const navigate = useNavigate();

  // Fetch professors, departments, and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset any previous errors
        
        let professorsLoaded = false;
        let departmentsLoaded = false;
        let coursesLoaded = false;
        
        try {
          console.log('Fetching professors...');
          const professorsData = await professorService.getAllProfessors();
          console.log('Professors data received:', professorsData);
          setProfessors(professorsData);
          setFilteredProfessors(professorsData);
          professorsLoaded = true;
        } catch (err) {
          console.error('Error fetching professors:', err);
          setError('Failed to fetch professors. Please ensure your backend server is running.');
        }
        
        try {
          console.log('Fetching departments...');
          const departmentsData = await departmentService.getAllDepartments();
          console.log('Departments data received:', departmentsData);
          setDepartments(departmentsData);
          departmentsLoaded = true;
        } catch (err) {
          console.error('Error fetching departments:', err);
          if (!professorsLoaded) {
            setError('Failed to fetch departments. Please ensure your backend server is running.');
          }
        }
        
        try {
          console.log('Fetching courses...');
          const coursesData = await courseService.getAllCourses();
          console.log('Courses data received:', coursesData);
          setCourses(coursesData);
          coursesLoaded = true;
        } catch (err) {
          console.error('Error fetching courses:', err);
          if (!professorsLoaded && !departmentsLoaded) {
            setError('Failed to fetch courses. Please ensure your backend server is running.');
          }
        }
        
        // If nothing loaded, show a comprehensive error
        if (!professorsLoaded && !departmentsLoaded && !coursesLoaded) {
          setError('Failed to load data. Please check your backend server connection and try again.');
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Empty dependency array - only runs once on mount

  // Filter professors when department, course, semester, or search term changes
  useEffect(() => {
    let filtered = [...professors];
    
    // Apply department filter
    if (selectedDepartment) {
      filtered = filtered.filter(
        professor => professor.department_id === selectedDepartment
      );
    }
    
    // Apply course filter
    if (selectedCourse) {
      filtered = filtered.filter(
        professor => professor.course_ids && professor.course_ids.includes(selectedCourse)
      );
    }
    
    // Apply semester filter
    if (selectedSemesters.length > 0) {
      filtered = filtered.filter(professor => {
        if (!professor.semesters || professor.semesters.length === 0) {
          return false;
        }
        return selectedSemesters.some(semester => 
          professor.semesters?.includes(semester)
        );
      });
    }
    
    // Apply search filter (case-insensitive)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        professor =>
          professor.first_name.toLowerCase().includes(search) ||
          professor.last_name.toLowerCase().includes(search) ||
          professor.email.toLowerCase().includes(search) ||
          professor.professor_id.toLowerCase().includes(search)
      );
    }
    
    setFilteredProfessors(filtered);
    setPage(0); // Reset to first page when filters change
  }, [professors, selectedDepartment, selectedCourse, selectedSemesters, searchTerm]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDepartmentChange = (event: any) => {
    setSelectedDepartment(event.target.value);
    // Reset course filter when department changes
    setSelectedCourse('');
  };
  
  const handleCourseChange = (event: any) => {
    setSelectedCourse(event.target.value);
  };
  
  const handleSemesterChange = (semester: string) => {
    const currentSemesters = [...selectedSemesters];
    const index = currentSemesters.indexOf(semester);
    
    if (index > -1) {
      // Remove semester if already selected
      currentSemesters.splice(index, 1);
    } else {
      // Add semester if not selected
      currentSemesters.push(semester);
    }
    
    setSelectedSemesters(currentSemesters);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddProfessor = () => {
    setEditProfessor(null);
    setOpenForm(true);
  };

  const handleEditProfessor = (professor: Professor) => {
    setEditProfessor(professor);
    setOpenForm(true);
  };

  const handleDeleteProfessor = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this professor?')) {
      try {
        await professorService.deleteProfessor(id);
        setProfessors(professors.filter(p => p.professor_id !== id));
      } catch (err) {
        setError('Failed to delete professor. Please try again.');
        console.error(err);
      }
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditProfessor(null);
  };

  const handleSaveProfessor = async (professor: Professor) => {
    try {
      let savedProfessor: Professor;
      
      if (professor.professor_id && editProfessor) {
        // Update existing professor
        savedProfessor = await professorService.updateProfessor(professor.professor_id, professor);
        setProfessors(professors.map(p =>
          p.professor_id === savedProfessor.professor_id ? savedProfessor : p
        ));
      } else {
        // Create new professor
        savedProfessor = await professorService.createProfessor(professor);
        setProfessors([...professors, savedProfessor]);
      }
      
      handleCloseForm();
    } catch (err) {
      setError('Failed to save professor. Please try again.');
      console.error(err);
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/admin/professors/${id}`);
  };

  // Get department name by ID
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(dept => dept.department_id === departmentId);
    return department ? department.name : 'Unknown Department';
  };
  
  // Get course names for a professor
  const getCoursesForProfessor = (professor: Professor) => {
    if (!professor.course_ids || professor.course_ids.length === 0) {
      return 'No courses assigned';
    }
    
    const professorCourses = courses.filter(course => 
      professor.course_ids?.includes(course.course_id)
    );
    
    if (professorCourses.length === 0) {
      return 'No courses assigned';
    }
    
    if (professorCourses.length <= 2) {
      return professorCourses.map(c => c.course_name).join(', ');
    }
    
    return `${professorCourses[0].course_name}, ${professorCourses[1].course_name}, +${professorCourses.length - 2} more`;
  };

  // Get filtered courses based on selected department
  const getFilteredCourses = () => {
    if (!selectedDepartment) {
      return courses;
    }
    return courses.filter(course => course.department_id === selectedDepartment);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1" gutterBottom>
              Professors
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddProfessor}
            >
              Add Professor
            </Button>
          </Grid>
        </Grid>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Professors"
                  variant="outlined"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by name, email, or ID"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="department-select-label">Filter by Department</InputLabel>
                  <Select
                    labelId="department-select-label"
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                    label="Filter by Department"
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="course-select-label">Filter by Course</InputLabel>
                  <Select
                    labelId="course-select-label"
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    label="Filter by Course"
                    disabled={!selectedDepartment}
                  >
                    <MenuItem value="">
                      <em>All Courses</em>
                    </MenuItem>
                    {getFilteredCourses().map((course) => (
                      <MenuItem key={course.course_id} value={course.course_id}>
                        {course.course_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Filter by Semester
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedSemesters.includes('Fall')}
                        onChange={() => handleSemesterChange('Fall')}
                      />
                    }
                    label="Fall"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedSemesters.includes('Spring')}
                        onChange={() => handleSemesterChange('Spring')}
                      />
                    }
                    label="Spring"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="textSecondary">
                  {filteredProfessors.length} professors found
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="professors table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Courses</TableCell>
                  <TableCell>Semesters</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProfessors.length > 0 ? (
                  filteredProfessors
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((professor) => (
                      <TableRow key={professor.professor_id} hover>
                        <TableCell>{professor.professor_id}</TableCell>
                        <TableCell>{`${professor.first_name} ${professor.last_name}`}</TableCell>
                        <TableCell>{professor.email}</TableCell>
                        <TableCell>{getDepartmentName(professor.department_id)}</TableCell>
                        <TableCell>{getCoursesForProfessor(professor)}</TableCell>
                        <TableCell>
                          {professor.semesters && professor.semesters.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {professor.semesters.map(semester => (
                                <Chip 
                                  key={semester} 
                                  label={semester} 
                                  size="small"
                                  color={semester === 'Fall' ? 'warning' : 'success'}
                                />
                              ))}
                            </Box>
                          ) : (
                            'None'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleViewDetails(professor.professor_id)}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleEditProfessor(professor)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteProfessor(professor.professor_id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {error ? 'Error loading data' : 'No professors found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProfessors.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
      {/* Professor Form Dialog */}
      {openForm && (
        <ProfessorForm
          open={openForm}
          professor={editProfessor}
          departments={departments}
          courses={courses}
          onClose={handleCloseForm}
          onSave={handleSaveProfessor}
        />
      )}
    </Container>
  );
};

export default ProfessorList;