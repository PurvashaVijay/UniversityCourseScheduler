// scheduledCourseRoutes.js
// Place this in: /backend/src/routes/scheduledCourseRoutes.js

const express = require('express');
const scheduledCourseController = require('../controllers/scheduledCourseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get scheduled courses for a schedule
router.get('/schedules/:scheduleId/courses', authenticate, scheduledCourseController.getScheduledCourses);

// Get a specific scheduled course
router.get('/scheduled-courses/:id', authenticate, scheduledCourseController.getScheduledCourseById);

// Create a manual override (admin only)
router.post('/scheduled-courses/override', authenticate, authorize('admin'), scheduledCourseController.createOverride);

// Delete a scheduled course (admin only)
router.delete('/scheduled-courses/:id', authenticate, authorize('admin'), scheduledCourseController.deleteScheduledCourse);

module.exports = router;