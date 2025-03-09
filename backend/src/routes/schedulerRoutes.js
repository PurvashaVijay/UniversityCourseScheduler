// schedulerRoutes.js
const express = require('express');
const schedulerController = require('../controllers/schedulerController');

const router = express.Router();

// Generate a new schedule
router.post('/generate', schedulerController.generateSchedule);

module.exports = router;