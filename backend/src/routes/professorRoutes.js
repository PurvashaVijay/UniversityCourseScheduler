// professorRoutes.js
const express = require('express');
const professorController = require('../controllers/professorController');
const professorAvailabilityController = require('../controllers/professorAvailabilityController');

const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Professor routes
router.get('/', authenticate, professorController.getAllProfessors);
router.get('/department/:departmentId', authenticate, professorController.getProfessorsByDepartment);
router.get('/course/:courseId', authenticate, professorController.getProfessorsByCourse);
router.get('/:id', authenticate, professorController.getProfessorById);
router.post('/', authenticate, authorize('admin'), professorController.createProfessor);
router.put('/:id', authenticate, authorize('admin'), professorController.updateProfessor);
router.delete('/:id', authenticate, authorize('admin'), professorController.deleteProfessor);
router.post('/batch-delete', authenticate, authorize('admin'), professorController.deleteProfessors);

// Professor availability routes
router.get('/:id/availability', authenticate, professorAvailabilityController.getProfessorAvailability);
router.post('/:id/availability', authenticate, professorAvailabilityController.setBulkAvailability);
router.get('/my/availability', authenticate, professorAvailabilityController.getMyAvailability);
router.post('/my/availability', authenticate, professorAvailabilityController.setMyAvailability);

module.exports = router;