// Update departmentRoutes.js

const express = require('express');
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (if any)
// ...

// Protected routes - only admins can manage departments
router.get('/', authenticate, departmentController.getAllDepartments);
router.get('/:id', authenticate, departmentController.getDepartmentById);
router.post('/', authenticate, authorize('admin'), departmentController.createDepartment);
router.put('/:id', authenticate, authorize('admin'), departmentController.updateDepartment);
router.delete('/:id', authenticate, authorize('admin'), departmentController.deleteDepartment);

module.exports = router;

