// Create a file called testAuth.js in your backend directory
const { sequelize } = require('./src/config/database');
const Admin = require('./app/models/Admin');
const bcrypt = require('bcrypt');

async function testAuth() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Find admin user
    const admin = await Admin.findOne({ where: { email: 'admin@example.com' } });
    if (!admin) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Admin found:', {
      admin_id: admin.admin_id,
      email: admin.email,
      password_hash_length: admin.password_hash.length
    });
    
    // Test password verification
    const testPassword = 'test123';
    const passwordMatch = await bcrypt.compare(testPassword, admin.password_hash);
    
    console.log(`Password '${testPassword}' matches stored hash:`, passwordMatch);
    
    if (!passwordMatch) {
      // Try creating a new admin with simple password for testing
      const simplePwd = 'password123';
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(simplePwd, salt);
      
      await Admin.update(
        { password_hash: newHash },
        { where: { email: 'admin@example.com' } }
      );
      
      console.log(`Updated admin password to '${simplePwd}'`);
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();