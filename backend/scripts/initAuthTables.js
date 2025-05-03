// Create a file backend/scripts/initAuthTables.js
const { sequelize } = require('../src/config/database');
const Admin = require('../app/models/Admin');
const Department = require('../app/models/Department');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function initAuthTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    // Sync Admin model - create the table if it doesn't exist
    console.log('Creating Admin table if it doesn\'t exist...');
    await Admin.sync({ alter: true });

    // Create an initial admin department if it doesn't exist
    console.log('Creating admin department if it doesn\'t exist...');
    const adminDept = await Department.findOrCreate({
      where: { department_id: 'ADMIN' },
      defaults: {
        department_id: 'ADMIN',
        name: 'Administration',
        description: 'System Administration'
      }
    });
    console.log('Admin department created or found');

    // Check if default admin user exists
    const adminExists = await Admin.findOne({
      where: { email: 'admin@udel.edu' }
    });

    if (!adminExists) {
      console.log('Creating default admin user...');
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create admin
      await Admin.create({
        admin_id: 'ADMIN-' + uuidv4().substring(0, 8),
        department_id: 'ADMIN',
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@udel.edu',
        password_hash: hashedPassword
      });
      console.log('Default admin user created successfully');
    } else {
      console.log('Default admin user already exists');
    }

    console.log('Authentication tables initialization completed successfully');
  } catch (error) {
    console.error('Error initializing authentication tables:', error);
  } finally {
    process.exit();
  }
}

// Run the function
initAuthTables();