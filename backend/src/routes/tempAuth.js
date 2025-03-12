const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../../app/models/Admin');

router.post('/temp-login', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find admin by email only (no password check)
    const admin = await Admin.findOne({ where: { email } });
    
    if (!admin) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Generate token without password verification
    const token = jwt.sign(
      { id: admin.admin_id, role: 'admin' },
      process.env.JWT_SECRET || 'your_secret_key_here',
      { expiresIn: '1d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin.admin_id,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;