// courseRoutes.js
const express = require('express');
const courseController = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Main course routes - read operations accessible to all authenticated users
router.get('/', authenticate, courseController.getAllCourses);
router.get('/:id', authenticate, courseController.getCourseById);

// Write operations restricted to admin
router.post('/', authenticate, authorize('admin'), courseController.createCourse);
router.put('/:id', authenticate, authorize('admin'), courseController.updateCourse);
router.delete('/:id', authenticate, authorize('admin'), courseController.deleteCourse);

// Batch delete route
router.post('/batch-delete', authenticate, authorize('admin'), courseController.deleteCourses);

// Debugging route
router.get('/debug/:programId', authenticate, courseController.debugCourses);

// Additional routes for filtering
router.get('/department/:departmentId', authenticate, courseController.getCoursesByDepartment);
router.get('/program/:programId', authenticate, courseController.getCoursesByProgram);

module.exports = router;