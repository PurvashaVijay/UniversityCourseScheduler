  // authController.js
// Place this in: /backend/src/controllers/authController.js

const { Admin, Professor } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, password }); // Log credentials for debugging
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find the admin by email
    const admin = await Admin.findOne({ where: { email } });
    
    // Log if admin was found
    console.log('Admin found:', admin ? 'Yes' : 'No');
    
    // Check if admin exists
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Validate password - Add logging here
    const isPasswordValid = await admin.validatePassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.admin_id, 
        email: admin.email,
        role: 'admin',
        department_id: admin.department_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: admin.admin_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        role: 'admin',
        department_id: admin.department_id
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

// Professor login
exports.professorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find the professor by email
    const professor = await Professor.findOne({ where: { email } });
    
    // Check if professor exists
    if (!professor) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isPasswordValid = await professor.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: professor.professor_id, 
        email: professor.email,
        role: 'professor',
        department_id: professor.department_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: professor.professor_id,
        first_name: professor.first_name,
        last_name: professor.last_name,
        email: professor.email,
        role: 'professor',
        department_id: professor.department_id
      }
    });
  } catch (error) {
    console.error('Professor login error:', error);
    return res.status(500).json({ message: 'Login failed' });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    // User information comes from the auth middleware
    const { userId, role } = req.user;
    
    let user;
    
    if (role === 'admin') {
      user = await Admin.findByPk(userId, {
        attributes: ['admin_id', 'first_name', 'last_name', 'email', 'department_id']
      });
    } else if (role === 'professor') {
      user = await Professor.findByPk(userId, {
        attributes: ['professor_id', 'first_name', 'last_name', 'email', 'department_id']
      });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      user: {
        id: role === 'admin' ? user.admin_id : user.professor_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role,
        department_id: user.department_id
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ message: 'Failed to get user profile' });
  }
};