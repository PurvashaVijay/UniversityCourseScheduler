// scripts/addNumClassesField.js
const { sequelize } = require('../src/config/database');

async function addNumClassesField() {
  try {
    console.log('Starting database field addition...');
    
    // Check connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Add num_classes column to course_program table if it doesn't exist
    await sequelize.query(`
      ALTER TABLE course_program 
      ADD COLUMN IF NOT EXISTS num_classes INTEGER NOT NULL DEFAULT 1
    `);
    
    console.log('Successfully added num_classes field to course_program table.');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addNumClassesField();