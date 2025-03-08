/**
 * Database initialization script
 * 
 * This script initializes the database with default data:
 * - Default time slots
 * - Super admin user
 */

const { v4: uuidv4 } = require('uuid');
const sequelize = require('../backend/src/config/database');
const TimeSlot = require('../backend/app/models/TimeSlot');
const Admin = require('../backend/app/models/Admin');
const Department = require('../backend/app/models/Department');
const defineAssociations = require('../backend/app/models/associations');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Define default time slots based on your schema
const DEFAULT_TIME_SLOTS = [
  { timeslot_id: 'TS1-MON', name: 'Time Slot 1', start_time: '09:10:00', end_time: '10:05:00', duration_minutes: 55, day_of_week: 'Monday' },
  { timeslot_id: 'TS2-MON', name: 'Time Slot 2', start_time: '10:20:00', end_time: '11:15:00', duration_minutes: 55, day_of_week: 'Monday' },
  { timeslot_id: 'TS3-MON', name: 'Time Slot 3', start_time: '11:30:00', end_time: '12:25:00', duration_minutes: 55, day_of_week: 'Monday' },
  { timeslot_id: 'TS4-MON', name: 'Time Slot 4', start_time: '12:45:00', end_time: '14:05:00', duration_minutes: 80, day_of_week: 'Monday' },
  { timeslot_id: 'TS5-MON', name: 'Time Slot 5', start_time: '13:30:00', end_time: '14:50:00', duration_minutes: 80, day_of_week: 'Monday' },
  { timeslot_id: 'TS6-MON', name: 'Time Slot 6', start_time: '17:30:00', end_time: '20:30:00', duration_minutes: 180, day_of_week: 'Monday' },
  { timeslot_id: 'TS7-MON', name: 'Time Slot 7', start_time: '18:00:00', end_time: '21:00:00', duration_minutes: 180, day_of_week: 'Monday' },
  
  { timeslot_id: 'TS1-TUE', name: 'Time Slot 1', start_time: '09:10:00', end_time: '10:05:00', duration_minutes: 55, day_of_week: 'Tuesday' },
  { timeslot_id: 'TS2-TUE', name: 'Time Slot 2', start_time: '10:20:00', end_time: '11:15:00', duration_minutes: 55, day_of_week: 'Tuesday' },
  { timeslot_id: 'TS3-TUE', name: 'Time Slot 3', start_time: '11:30:00', end_time: '12:25:00', duration_minutes: 55, day_of_week: 'Tuesday' },
  { timeslot_id: 'TS4-TUE', name: 'Time Slot 4', start_time: '12:45:00', end_time: '14:05:00', duration_minutes: 80, day_of_week: 'Tuesday' },
  { timeslot_id: 'TS5-TUE', name: 'Time Slot 5', start_time: '13:30:00', end_time: '14:50:00', duration_minutes: 80, day_of_week: 'Tuesday' },
  { timeslot_id: 'TS6-TUE', name: 'Time Slot 6', start_time: '17:30:00', end_time: '20:30:00', duration_minutes: 180, day_of_week: 'Tuesday' },
  { timeslot_id: 'TS7-TUE', name: 'Time Slot 7', start_time: '18:00:00', end_time: '21:00:00', duration_minutes: 180, day_of_week: 'Tuesday' }
];

async function initializeDatabase() {
  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Set up model associations
    defineAssociations();
    
    // Sync all models with database (only create tables that don't exist)
    console.log('Syncing database models...');
    await sequelize.sync({ force: false });
    
    // Create default time slots if they don't exist
    const timeSlotCount = await TimeSlot.count();
    if (timeSlotCount === 0) {
      console.log('Creating default time slots...');
      await TimeSlot.bulkCreate(DEFAULT_TIME_SLOTS);
      console.log('Time slots created successfully.');
    } else {
      console.log('Time slots already exist, skipping creation.');
    }
    
    // Create default department if it doesn't exist
    let adminDepartment = await Department.findOne({ where: { department_id: 'ADMIN' } });
    if (!adminDepartment) {
      console.log('Creating default admin department...');
      adminDepartment = await Department.create({
        department_id: 'ADMIN',
        name: 'Administration',
        description: 'System Administration Department'
      });
      console.log('Admin department created successfully.');
    }
    
    // Create super admin user if it doesn't exist
    const adminExists = await Admin.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      console.log('Creating super admin user...');
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD || 'admin123!', salt);
      
      await Admin.create({
        admin_id: 'ADMIN-' + uuidv4().substring(0, 8),
        department_id: adminDepartment.department_id,
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@example.com',
        password_hash: hashedPassword
      });
      console.log('Super admin user created successfully.');
    } else {
      console.log('Super admin user already exists, skipping creation.');
    }
    
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the initialization
initializeDatabase();