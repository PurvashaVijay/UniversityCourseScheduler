// scripts/addScheduledCourseFields.js
const { sequelize } = require('../src/config/database');

async function addScheduledCourseFields() {
  try {
    console.log('Starting database field addition...');
    
    // Check connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Add class_instance column to scheduled_course table if it doesn't exist
    await sequelize.query(`
      ALTER TABLE scheduled_course
      ADD COLUMN IF NOT EXISTS class_instance INTEGER NOT NULL DEFAULT 1
    `);
    
    // Add num_classes column to scheduled_course table if it doesn't exist
    await sequelize.query(`
      ALTER TABLE scheduled_course
      ADD COLUMN IF NOT EXISTS num_classes INTEGER NOT NULL DEFAULT 1
    `);
    
    console.log('Successfully added class_instance and num_classes fields to scheduled_course table.');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the function
addScheduledCourseFields();