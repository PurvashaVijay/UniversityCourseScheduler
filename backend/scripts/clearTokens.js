// backend/scripts/clearTokens.js
const { sequelize } = require('../src/config/database');
const Admin = require('../app/models/Admin');

async function clearResetTokens() {
  try {
    console.log('Clearing reset tokens...');
    await Admin.update(
        { reset_token: null, reset_token_expires: null },
        { where: { email: 'tango@udel.edu' } }
      ); 
    // Update all admins with the specified email
    const result = await Admin.update(
      { 
        reset_token: null, 
        reset_token_expires: null 
      },
      { 
        where: { 
          email: 'tango@udel.edu' 
        } 
      }
    );
    
    console.log(`Updated ${result[0]} records`);
    console.log('Tokens cleared successfully');
  } catch (error) {
    console.error('Error clearing tokens:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
clearResetTokens();