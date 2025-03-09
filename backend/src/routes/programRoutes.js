// programRoutes.js
const express = require('express');
const programController = require('../controllers/programController');

const router = express.Router();

// Main program routes
router.get('/', programController.getAllPrograms);
router.get('/:id', programController.getProgramById);
router.post('/', programController.createProgram);
router.put('/:id', programController.updateProgram);
router.delete('/:id', programController.deleteProgram);

// Additional routes for filtering
router.get('/department/:departmentId', programController.getProgramsByDepartment);

module.exports = router;