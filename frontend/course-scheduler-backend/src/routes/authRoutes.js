const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Login routes
router.post('/admin/login', authController.adminLogin);
router.post('/professor/login', authController.professorLogin);

// Protected route to get current user info
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;
