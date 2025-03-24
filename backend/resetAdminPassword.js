// backend/resetAdminPassword.js
require('dotenv').config();
const { Admin } = require('./app/models');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('./src/config/database');

async function resetAdminPassword() {
  try {
    // Check if the admin exists
    let admin = await Admin.findOne({ where: { email: 'admin@example.com' } });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123!', salt);
    
    if (admin) {
      // Update existing admin
      console.log('Updating existing admin password...');
      admin.password_hash = hashedPassword;
      await admin.save();
    } else {
      // Create new admin
      console.log('Creating new admin user...');
      admin = await Admin.create({
        admin_id: 'ADMIN-' + uuidv4().substring(0, 8),
        department_id: null, // Super admin doesn't need a department
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@example.com',
        password_hash: hashedPassword
      });
    }
    
    console.log('Admin user created/updated successfully with password: admin123!');
    console.log('Email: admin@example.com');
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();