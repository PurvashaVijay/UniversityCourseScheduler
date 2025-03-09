// professorRoutes.js
const express = require('express');
const professorController = require('../controllers/professorController');

const router = express.Router();

router.get('/', professorController.getAllProfessors);
router.get('/:id', professorController.getProfessorById);
router.post('/', professorController.createProfessor);
router.put('/:id', professorController.updateProfessor);
router.delete('/:id', professorController.deleteProfessor);

module.exports = router;