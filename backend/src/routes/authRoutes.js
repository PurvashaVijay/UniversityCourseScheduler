// authRoutes.js
// Place this in: /backend/src/routes/authRoutes.js

const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Login routes
router.post('/admin/login', authController.adminLogin);
router.post('/professor/login', authController.professorLogin);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;