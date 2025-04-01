// scripts/createProfessorCourseTable.js
const { sequelize } = require('../src/config/database');
const ProfessorCourse = require('../app/models/ProfessorCourse');
const { v4: uuidv4 } = require('uuid');

// Add default value generator to model if not already present
if (!ProfessorCourse.rawAttributes.professor_course_id.defaultValue) {
  ProfessorCourse.rawAttributes.professor_course_id.defaultValue = () => 
    `PC-${uuidv4().substring(0, 8).toUpperCase()}`;
}

async function syncProfessorCourseTable() {
  try {
    console.log('Starting to create ProfessorCourse table...');
    
    // First check the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Force: true will drop the table if it exists
    await ProfessorCourse.sync({ force: true });
    console.log('ProfessorCourse table created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating ProfessorCourse table:', error);
    process.exit(1);
  }
}

syncProfessorCourseTable();