// authMiddleware.js
// Place this in: /backend/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// Middleware to verify JWT tokens
exports.authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user info to request
      req.user = {
        userId: decoded.id,
        email: decoded.email,
        role: decoded.role,
        departmentId: decoded.department_id
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
};

// Middleware to restrict access based on role
exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware to restrict access to department resources
exports.restrictToDepartment = (req, res, next) => {
  // Skip if admin (admins can access all departments)
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Check if request involves a department parameter
  const { departmentId } = req.params;
  
  if (departmentId && departmentId !== req.user.departmentId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own department' });
  }
  
  next();
};