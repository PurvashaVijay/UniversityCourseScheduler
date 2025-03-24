// schedulerRoutes.js
const express = require('express');
const schedulerController = require('../controllers/schedulerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Generate a new schedule
//router.post('/generate', schedulerController.generateSchedule);

// Generate a new schedule (admin only)
router.post('/generate', authenticate, authorize('admin'), schedulerController.generateSchedule);

module.exports = router;