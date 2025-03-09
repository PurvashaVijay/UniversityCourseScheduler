// backend/scripts/syncDatabase.js

const { sequelize } = require('../src/config/database');
const models = require('../app/models');

async function syncDatabase() {
  try {
    console.log('Starting database synchronization...');
    
    // First check the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    // Set force: true to drop existing tables (CAUTION: use only in development)
    // For production, use { force: false, alter: true } or just { force: false }
    await sequelize.sync({ force: true });
    
    console.log('All models synchronized successfully with the database.');
    
    // Add initial time slots
    await createDefaultTimeSlots();
    
    // Add a default admin user
    await createDefaultAdmin();
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  } finally {
    process.exit(0);
  }
}

async function createDefaultTimeSlots() {
  const { TimeSlot } = models;
  
  const defaultTimeSlots = [
    { slot_id: 'TS1', start_time: '09:10:00', end_time: '10:05:00', duration: 55, name: 'Morning Slot 1' },
    { slot_id: 'TS2', start_time: '10:20:00', end_time: '11:15:00', duration: 55, name: 'Morning Slot 2' },
    { slot_id: 'TS3', start_time: '11:30:00', end_time: '12:25:00', duration: 55, name: 'Morning Slot 3' },
    { slot_id: 'TS4', start_time: '12:45:00', end_time: '14:05:00', duration: 80, name: 'Afternoon Slot 1' },
    { slot_id: 'TS5', start_time: '13:30:00', end_time: '14:50:00', duration: 80, name: 'Afternoon Slot 2' },
    { slot_id: 'TS6', start_time: '17:30:00', end_time: '20:30:00', duration: 180, name: 'Evening Slot 1' },
    { slot_id: 'TS7', start_time: '18:00:00', end_time: '21:00:00', duration: 180, name: 'Evening Slot 2' }
  ];
  
  console.log('Creating default time slots...');
  
  for (const slot of defaultTimeSlots) {
    await TimeSlot.findOrCreate({
      where: { slot_id: slot.slot_id },
      defaults: slot
    });
  }
  
  console.log('Default time slots created successfully.');
}

async function createDefaultAdmin() {
  const { Admin } = models;
  const bcrypt = require('bcrypt');
  
  console.log('Creating default admin user...');
  
  // Generate hash for default password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  
  // Create default admin if it doesn't exist
  await Admin.findOrCreate({
    where: { email: 'admin@university.edu' },
    defaults: {
      admin_id: 'ADMIN1',
      name: 'System Administrator',
      email: 'admin@university.edu',
      password: hashedPassword,
      department_id: null // You can set this to a specific department if needed
    }
  });
  
  console.log('Default admin user created successfully.');
}

// Run the synchronization
syncDatabase();