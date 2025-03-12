const { sequelize } = require('./src/config/database');
const Admin = require('./app/models/Admin');
const bcrypt = require('bcrypt');

async function resetAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Delete existing admin
    await Admin.destroy({ where: { email: 'admin@example.com' } });
    console.log('Deleted existing admin');
    
    // Create new admin with plain password
    const plainPassword = 'test123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    const admin = await Admin.create({
      admin_id: 'ADMIN-NEW',
      department_id: 'ADMIN',
      first_name: 'System',
      last_name: 'Administrator',
      email: 'admin@example.com',
      password_hash: hashedPassword
    });
    
    console.log('Created new admin with email: admin@example.com');
    console.log('Plain password is: test123');
    console.log('Stored hash:', admin.password_hash);
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdmin();