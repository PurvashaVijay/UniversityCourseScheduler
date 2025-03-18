const jwt = require('jsonwebtoken');

// Mock users (in a real app these would be in a database)
const mockUsers = {
  admin: {
    id: 'ADMIN-001',
    email: 'admin@udel.edu',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    departmentId: 'DEPT-001',
    role: 'admin'
  },
  professor: {
    id: 'PROF-001',
    email: 'professor@udel.edu',
    password: 'prof123',
    firstName: 'Jane',
    lastName: 'Doe',
    departmentId: 'DEPT-001',
    role: 'professor'
  }
};

// Admin login controller
exports.adminLogin = (req, res) => {
  const { email, password } = req.body;
  
  console.log('Admin login attempt:', { email });
  
  // Check if email and password match admin credentials
  if (email === mockUsers.admin.email && password === mockUsers.admin.password) {
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: mockUsers.admin.id,
        email: mockUsers.admin.email,
        role: 'admin',
        departmentId: mockUsers.admin.departmentId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return success response with token and user info
    return res.json({
      success: true,
      token,
      user: {
        admin_id: mockUsers.admin.id,
        first_name: mockUsers.admin.firstName,
        last_name: mockUsers.admin.lastName,
        email: mockUsers.admin.email,
        department_id: mockUsers.admin.departmentId
      }
    });
  }
  
  // Return error for invalid credentials
  return res.status(401).json({
    success: false,
    message: 'Invalid email or password'
  });
};

// Professor login controller
exports.professorLogin = (req, res) => {
  const { email, password } = req.body;
  
  console.log('Professor login attempt:', { email });
  
  // Check if email and password match professor credentials
  if (email === mockUsers.professor.email && password === mockUsers.professor.password) {
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: mockUsers.professor.id,
        email: mockUsers.professor.email,
        role: 'professor',
        departmentId: mockUsers.professor.departmentId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return success response with token and user info
    return res.json({
      success: true,
      token,
      user: {
        professor_id: mockUsers.professor.id,
        first_name: mockUsers.professor.firstName,
        last_name: mockUsers.professor.lastName,
        email: mockUsers.professor.email,
        department_id: mockUsers.professor.departmentId
      }
    });
  }
  
  // Return error for invalid credentials
  return res.status(401).json({
    success: false,
    message: 'Invalid email or password'
  });
};

// Get current user info
exports.getCurrentUser = (req, res) => {
  // In a real app, you would fetch the user from the database
  // Here we just return the user based on the JWT payload
  
  const { role, userId, email, departmentId } = req.user;
  
  if (role === 'admin') {
    return res.json({
      user: {
        admin_id: userId,
        email,
        first_name: mockUsers.admin.firstName,
        last_name: mockUsers.admin.lastName,
        department_id: departmentId,
        role
      }
    });
  } else if (role === 'professor') {
    return res.json({
      user: {
        professor_id: userId,
        email,
        first_name: mockUsers.professor.firstName,
        last_name: mockUsers.professor.lastName,
        department_id: departmentId,
        role
      }
    });
  }
  
  return res.status(404).json({
    success: false,
    message: 'User not found'
  });
};
