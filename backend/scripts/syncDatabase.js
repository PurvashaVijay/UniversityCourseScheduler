// backend/scripts/syncDatabase.js
const { Sequelize } = require('sequelize');
const models = require('../app/models');

// Create a new Sequelize instance with hardcoded values
const sequelize = new Sequelize(
  'course_scheduler', 
  'postgres', 
  'Postgre123',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function syncDatabase() {
  try {
    console.log('Starting database synchronization...');
    
    // First check the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ force: true });
    
    console.log('All models synchronized successfully with the database.');
    
    // Add initial time slots and default admin
    // Comment these out for now since they might rely on model associations
    //await createDefaultTimeSlots();
    //await createDefaultAdmin();
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the synchronization
syncDatabase();