// courseRoutes.js
const express = require('express');
const courseController = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Main course routes
//router.get('/', courseController.getAllCourses);
//router.get('/:id', courseController.getCourseById);

// Main course routes - read operations accessible to all authenticated users
router.get('/', authenticate, courseController.getAllCourses);
router.get('/:id', authenticate, courseController.getCourseById);

//router.post('/', courseController.createCourse);
//router.put('/:id', courseController.updateCourse);
//router.delete('/:id', courseController.deleteCourse);

// Write operations restricted to admin
router.post('/', authenticate, authorize('admin'), courseController.createCourse);
router.put('/:id', authenticate, authorize('admin'), courseController.updateCourse);
router.delete('/:id', authenticate, authorize('admin'), courseController.deleteCourse);

// Additional routes for filtering
//router.get('/department/:departmentId', courseController.getCoursesByDepartment);
//router.get('/program/:programId', courseController.getCoursesByProgram);

// Additional routes for filtering
router.get('/department/:departmentId', authenticate, courseController.getCoursesByDepartment);
router.get('/program/:programId', authenticate, courseController.getCoursesByProgram);

module.exports = router;