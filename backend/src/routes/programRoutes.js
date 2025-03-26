// programRoutes.js
const express = require('express');
const programController = require('../controllers/programController');

const router = express.Router();

// Department-specific route MUST come first
router.get('/department/:departmentId', programController.getProgramsByDepartment);

// Then generic routes
router.get('/', programController.getAllPrograms);
router.post('/', programController.createProgram);

// Then ID-specific routes
router.get('/:id', programController.getProgramById);
router.put('/:id', programController.updateProgram);
router.delete('/:id', programController.deleteProgram);

module.exports = router;