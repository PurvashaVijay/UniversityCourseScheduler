const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const departmentRoutes = require('./routes/departmentRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
testConnection();

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the University Course Scheduling API' });
});

// Routes
app.use('/api/departments', departmentRoutes);
// In server.js, add this line:
app.use('/api/professors', require('./routes/professorRoutes'));
// In server.js, update the line:
app.use('/api', require('./routes/professorAvailabilityRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/programs', require('./routes/programRoutes'));
app.use('/api/timeslots', require('./routes/timeSlotRoutes'));
app.use('/api/semesters', require('./routes/semesterRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/scheduler', require('./routes/schedulerRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/scheduledCourseRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;