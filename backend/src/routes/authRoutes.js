// In authRoutes.js - Ensure register route exists
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public auth routes
router.post('/admin/login', authController.adminLogin);
router.post('/register', authController.register); 
router.post('/temp-login', authController.tempLogin);

// Protected route to get current user info
router.get('/me', authenticate, authController.getCurrentUser);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;