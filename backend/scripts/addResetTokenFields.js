// backend/scripts/addResetTokenFields.js
const { sequelize } = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function addResetTokenFields() {
  try {
    console.log('Adding reset token fields to admin table...');
    
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'admin' 
      AND column_name IN ('reset_token', 'reset_token_expires');
    `;
    const existingColumns = await sequelize.query(checkQuery, { type: QueryTypes.SELECT });
    
    if (existingColumns.find(col => col.column_name === 'reset_token')) {
      console.log('reset_token column already exists');
    } else {
      // Add reset_token column
      await sequelize.query(`
        ALTER TABLE admin 
        ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL;
      `);
      console.log('Added reset_token column');
    }
    
    if (existingColumns.find(col => col.column_name === 'reset_token_expires')) {
      console.log('reset_token_expires column already exists');
    } else {
      // Add reset_token_expires column
      await sequelize.query(`
        ALTER TABLE admin 
        ADD COLUMN reset_token_expires TIMESTAMP DEFAULT NULL;
      `);
      console.log('Added reset_token_expires column');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addResetTokenFields();