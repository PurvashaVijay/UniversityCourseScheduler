// backend/scripts/createCourseSemesterTable.js
const { sequelize } = require('../src/config/database');
const CourseSemester = require('../app/models/CourseSemester');

async function createCourseSemesterTable() {
  try {
    console.log('Creating CourseSemester table...');
    
    // First check the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync just the CourseSemester model
    await CourseSemester.sync();
    
    console.log('CourseSemester table created successfully.');
  } catch (error) {
    console.error('Error creating CourseSemester table:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createCourseSemesterTable();