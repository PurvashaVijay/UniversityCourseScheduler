// backend/src/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// Protected route that requires authentication
router.get('/stats', authenticate, dashboardController.getDashboardStats);

module.exports = router;