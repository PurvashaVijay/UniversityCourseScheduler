// semesterRoutes.js
const express = require('express');
const semesterController = require('../controllers/semesterController');

const router = express.Router();

// Main semester routes
router.get('/', semesterController.getAllSemesters);
router.get('/current', semesterController.getCurrentSemester);
router.get('/:id', semesterController.getSemesterById);
router.post('/', semesterController.createSemester);
router.put('/:id', semesterController.updateSemester);
router.delete('/:id', semesterController.deleteSemester);

module.exports = router;