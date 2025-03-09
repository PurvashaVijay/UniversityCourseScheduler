// professorAvailabilityRoutes.js
// Place this in: /backend/src/routes/professorAvailabilityRoutes.js

const express = require('express');
const availabilityController = require('../controllers/professorAvailabilityController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes for administrators to manage any professor's availability
router.get('/professors/:id/availability', authenticate, authorize(['admin', 'professor']), availabilityController.getProfessorAvailability);
router.post('/professors/:id/availability', authenticate, authorize(['admin', 'professor']), availabilityController.setBulkAvailability);

// Routes for professors to manage their own availability
router.get('/my/availability', authenticate, authorize('professor'), availabilityController.getMyAvailability);
router.post('/my/availability', authenticate, authorize('professor'), availabilityController.setMyAvailability);

module.exports = router;