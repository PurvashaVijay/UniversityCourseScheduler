// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Admin = require('../../app/models/Admin');
const { sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto'); 

// Admin login controller
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Admin login attempt:', { email });
    
    // Validate email domain
    if (!email.endsWith('@udel.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Only @udel.edu email addresses are allowed'
      });
    }
    
    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    
    // If admin not found or password doesn't match
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Validate password
    const isPasswordValid = await admin.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    
    // Return success response with token and user info
    return res.json({
      success: true,
      token,
      user: {
        admin_id: admin.admin_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        department_id: admin.department_id,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Forgot Password functionality
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Forgot password request received for:', email);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find the admin
    const admin = await Admin.findOne({ where: { email } });
    
    // For security reasons, always return success even if email doesn't exist
    if (!admin) {
      console.log('Email not found in database:', email);
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive password reset instructions'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    
    console.log('Generated reset token for user:', admin.admin_id);
    
    // Store token in the database
    admin.reset_token = resetToken;
    admin.reset_token_expires = tokenExpiry;
    await admin.save();
    
    // Send password reset email
    console.log('Sending password reset email to:', email);
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    
    if (emailSent) {
      console.log('Password reset email sent successfully');
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive password reset instructions'
      });
    } else {
      console.error('Failed to send password reset email');
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// Admin registration controller
exports.register = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    
    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate email domain
    if (!email.endsWith('@udel.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Only @udel.edu email addresses are allowed'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await Admin.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Password requirements validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Generate bcrypt hash for password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Create admin ID with UUID
    const admin_id = 'ADMIN-' + uuidv4().substring(0, 8);
    
    // Create new admin user
    const newAdmin = await Admin.create({
      admin_id,
      first_name,
      last_name,
      email,
      password_hash,
      department_id: 'ADMIN' // Default department for new admins
    });
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        admin_id: newAdmin.admin_id,
        first_name: newAdmin.first_name,
        last_name: newAdmin.last_name,
        email: newAdmin.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Get current user info
exports.getCurrentUser = async (req, res) => {
  try {
    // The user from the JWT token is available in req.user (set by the auth middleware)
    const { id, role } = req.user;
    
    // If admin role
    if (role === 'admin') {
      const admin = await Admin.findByPk(id, {
        attributes: { exclude: ['password_hash'] }
      });
      
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.json({
        success: true,
        user: {
          admin_id: admin.admin_id,
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          department_id: admin.department_id,
          role: 'admin'
        }
      });
    }
    
    // User not found or invalid role
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Temporary login for development
exports.tempLogin = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Temporary login attempt:', { email });
    
    // Check if email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email domain for consistency
    if (!email.endsWith('@udel.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Only @udel.edu email addresses are allowed'
      });
    }
    
    // For development, create a temporary token without creating a user
    const tempUser = {
      id: 'TEMP-' + Date.now().toString(),
      email: email,
      first_name: 'Temp',
      last_name: 'User',
      role: 'admin',
      department_id: 'ADMIN'
    };
    
    // Generate token
    const token = jwt.sign(
      tempUser,
      process.env.JWT_SECRET,
      { expiresIn: '4h' } // Short expiration for temp tokens
    );
    
    return res.json({
      success: true,
      message: 'Temporary login successful',
      token,
      user: {
        admin_id: tempUser.id,
        first_name: tempUser.first_name,
        last_name: tempUser.last_name,
        email: tempUser.email,
        department_id: tempUser.department_id,
        role: tempUser.role
      }
    });
  } catch (error) {
    console.error('Temp login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during temporary login'
    });
  }
};

// Reset Password functionality
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;
    
    console.log('Reset password attempt:', { 
      email, 
      token: token ? `${token.substring(0, 10)}...` : 'undefined', 
      hasPassword: !!password 
    });
    
    if (!email || !token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, token, and password are required'
      });
    }
    
    // Find admin with valid token
    const admin = await Admin.findOne({
      where: {
        email,
        reset_token: token,
        reset_token_expires: { [Op.gt]: new Date() } // Token not expired
      }
    });
    
    console.log('Admin found:', !!admin);
    
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password_hash = await bcrypt.hash(password, salt);
    
    // Clear reset token fields
    admin.reset_token = null;
    admin.reset_token_expires = null;
    
    // Save changes
    await admin.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};