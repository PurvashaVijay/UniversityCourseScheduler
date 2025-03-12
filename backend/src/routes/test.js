const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

//router.get('/protected', auth, (req, res) => {
router.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'You accessed protected data', user: req.user });
});

module.exports = router;