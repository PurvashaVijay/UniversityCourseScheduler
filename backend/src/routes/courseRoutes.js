// courseRoutes.js
const express = require('express');
const courseController = require('../controllers/courseController');

const router = express.Router();

// Main course routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', courseController.createCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// Additional routes for filtering
router.get('/department/:departmentId', courseController.getCoursesByDepartment);
router.get('/program/:programId', courseController.getCoursesByProgram);

module.exports = router;