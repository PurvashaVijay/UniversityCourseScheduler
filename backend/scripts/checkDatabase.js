// backend/scripts/checkDatabase.js

const { sequelize } = require('../src/config/database');
const models = require('../app/models');

async function checkDatabase() {
  try {
    // Check database connection
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Check tables for data
    console.log('\nChecking tables for data:');
    
    // Check Departments
    const departments = await models.Department.findAll();
    console.log(`Departments: ${departments.length} records found`);
    if (departments.length > 0) {
      console.log('Sample department:', departments[0].toJSON());
    }
    
    // Check Programs
    const programs = await models.Program.findAll();
    console.log(`Programs: ${programs.length} records found`);
    if (programs.length > 0) {
      console.log('Sample program:', programs[0].toJSON());
    }
    
    // Check Courses
    const courses = await models.Course.findAll();
    console.log(`Courses: ${courses.length} records found`);
    if (courses.length > 0) {
      console.log('Sample course:', courses[0].toJSON());
    }
    
    // Check Professors
    const professors = await models.Professor.findAll();
    console.log(`Professors: ${professors.length} records found`);
    if (professors.length > 0) {
      console.log('Sample professor:', professors[0].toJSON());
    }
    
    // Check TimeSlots
    const timeSlots = await models.TimeSlot.findAll();
    console.log(`TimeSlots: ${timeSlots.length} records found`);
    if (timeSlots.length > 0) {
      console.log('Sample time slot:', timeSlots[0].toJSON());
    }
    
    // Check Semesters
    const semesters = await models.Semester.findAll();
    console.log(`Semesters: ${semesters.length} records found`);
    if (semesters.length > 0) {
      console.log('Sample semester:', semesters[0].toJSON());
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
