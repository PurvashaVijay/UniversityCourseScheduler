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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;