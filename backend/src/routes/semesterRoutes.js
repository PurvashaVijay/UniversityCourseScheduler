// semesterRoutes.js
const express = require('express');
const semesterController = require('../controllers/semesterController');

const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Main semester routes
/**  
router.get('/', semesterController.getAllSemesters);
router.get('/current', semesterController.getCurrentSemester);
router.get('/:id', semesterController.getSemesterById);
router.post('/', semesterController.createSemester);
router.put('/:id', semesterController.updateSemester);
router.delete('/:id', semesterController.deleteSemester);
*/

// Public or authenticated-only routes
router.get('/', authenticate, semesterController.getAllSemesters);
router.get('/current', authenticate, semesterController.getCurrentSemester);
router.get('/:id', authenticate, semesterController.getSemesterById);

// Admin-only routes
router.post('/', authenticate, authorize('admin'), semesterController.createSemester);
router.put('/:id', authenticate, authorize('admin'), semesterController.updateSemester);
router.delete('/:id', authenticate, authorize('admin'), semesterController.deleteSemester);

module.exports = router;