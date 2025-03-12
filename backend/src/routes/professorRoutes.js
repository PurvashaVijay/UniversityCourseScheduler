// professorRoutes.js
const express = require('express');
const professorController = require('../controllers/professorController');

const router = express.Router();

/**  
router.get('/', professorController.getAllProfessors);
router.get('/:id', professorController.getProfessorById);
router.post('/', professorController.createProfessor);
router.put('/:id', professorController.updateProfessor);
router.delete('/:id', professorController.deleteProfessor);
*/

const { authenticate, authorize } = require('../middleware/authMiddleware');

// Update your routes:
router.get('/', authenticate, professorController.getAllProfessors);
router.get('/:id', authenticate, professorController.getProfessorById);
router.post('/', authenticate, authorize('admin'), professorController.createProfessor);
router.put('/:id', authenticate, authorize('admin'), professorController.updateProfessor);
router.delete('/:id', authenticate, authorize('admin'), professorController.deleteProfessor);

module.exports = router;