// backend/src/routes/tempAuth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Temporary login route for testing
router.post('/temp-login', async (req, res) => {
  console.log("Temp login route hit");
  console.log("Request body:", req.body);

  try {
    const { email } = req.body;
    
    console.log('Temp login attempt with email:', email);
    
    // Generate JWT token for testing
    const token = jwt.sign(
      { 
        id: 'ADMIN-TEST', 
        email: email,
        role: 'admin',
        department_id: 'DEPT-001'
      },
      process.env.JWT_SECRET || 'your_secret_key_here',
      { expiresIn: '8h' }
    );
    
    console.log("Generated token for temp login");
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: 'ADMIN-TEST',
        first_name: 'Test',
        last_name: 'Admin',
        email: email,
        role: 'admin',
        department_id: 'DEPT-001'
      }
    });
  } catch (error) {
    console.error('Temp login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Login failed' 
    });
  }
});

// Add this to tempAuth.js
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ message: 'tempAuth test endpoint works!' });
});

// Add this endpoint to tempAuth.js before module.exports = router;
router.get('/me', (req, res) => {
  // This is a temporary implementation that just returns success
  // It extracts the token from the Authorization header
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here');
    
    // Return the user information from the token
    return res.status(200).json({
      user: {
        id: decoded.id,
        email: decoded.email,
        first_name: decoded.first_name || 'Test',
        last_name: decoded.last_name || 'Admin',
        role: decoded.role || 'admin',
        department_id: decoded.department_id || 'DEPT-001'
      }
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;