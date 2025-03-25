// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Auth provider
import { AuthProvider } from './contexts/AuthContext';

// Layout components
import AdminLayout from './components/admin/AdminLayout';

// Auth components
import Login from './components/auth/Login';
import ProtectedRoute from './components/common/ProtectedRoute';
import Unauthorized from './components/common/Unauthorized';

// Admin components - Dashboard
import Dashboard from './components/admin/Dashboard';

// Admin components - Departments
import DepartmentList from './components/admin/departments/DepartmentList';
import DepartmentForm from './components/admin/departments/DepartmentForm';
import DepartmentDetails from './components/admin/departments/DepartmentDetails';

// Admin components - Programs
import ProgramList from './components/admin/programs/ProgramList';
import ProgramForm from './components/admin/programs/ProgramForm';
import ProgramDetails from './components/admin/programs/ProgramDetails';
// Admin components - Courses
import CourseList from './components/admin/courses/CourseList';
import CourseForm from './components/admin/courses/CourseForm';
import CourseDetails from './components/admin/courses/CourseDetails';
// Admin components - Professors
import ProfessorList from './components/admin/professors/ProfessorList';
import ProfessorDetails from './components/admin/professors/ProfessorDetails';

// Admin components - ScheduleView
import ScheduleView from './components/admin/schedule/ScheduleView';
// Create theme with University of Delaware colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#00539F', // UD Blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFD200', // UD Yellow
      contrastText: '#000000',
    },
  },
  typography: {
    fontFamily: [
      'Open Sans',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const App: React.FC = () => {

  return (

    <ThemeProvider theme={theme}>

      <CssBaseline />

      <AuthProvider>

        <Router>

          <Routes>

            {/* Public routes */}

            <Route path="/login" element={<Login />} />

            <Route path="/unauthorized" element={<Unauthorized />} />

            

            {/* Admin routes - FIXED NESTING */}

            <Route path="/admin" element={

              <ProtectedRoute allowedRoles={['admin']}>

                <AdminLayout />

              </ProtectedRoute>

            }>

              <Route index element={<Navigate to="dashboard" replace />} />

              <Route path="dashboard" element={<Dashboard />} />

              

              {/* Department routes */}

              <Route path="departments" element={<DepartmentList />} />

              <Route path="departments/new" element={<DepartmentForm />} />

              <Route path="departments/:id" element={<DepartmentDetails />} />

              <Route path="departments/:id/edit" element={<DepartmentForm />} />

              

              {/* Program routes */}

              <Route path="programs" element={<ProgramList />} />

              <Route path="programs/new" element={<ProgramForm />} />

              <Route path="programs/:id" element={<ProgramDetails />} />

              <Route path="programs/:id/edit" element={<ProgramForm />} />



              {/* Course routes */}

              <Route path="courses" element={<CourseList />} />

              <Route path="courses/new" element={<CourseForm />} />

              <Route path="courses/:id" element={<CourseDetails />} />

              <Route path="courses/:id/edit" element={<CourseForm />} />

              

              {/* Professor routes */}

              <Route path="professors" element={<ProfessorList />} />

              <Route path="professors/:id" element={<ProfessorDetails />} />

              

              {/* Active Schedule routes */}

              <Route path="schedules" element={<ScheduleView />} />
              <Route path="schedules/:id" element={<ScheduleView />} />

            </Route>

            

            {/* Redirect root to login */}

            <Route path="/" element={<Navigate to="/login" replace />} />

            

            {/* 404 - Not Found */}

            <Route path="*" element={<div>Page Not Found</div>} />

          </Routes>

        </Router>

      </AuthProvider>

    </ThemeProvider>

  );

};



export default App;