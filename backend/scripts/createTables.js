// backend/scripts/createTables.js
const { sequelize } = require('../src/config/database');
const models = require('../app/models');

async function createTables() {
  try {
    console.log('Starting database synchronization...');
    
    // First check the connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models with force: true to drop tables and recreate
    await sequelize.sync({ force: true });
    console.log('All models synchronized successfully with the database.');
    
    console.log('Database tables created successfully.');
  } catch (error) {
    console.error('Error creating database tables:', error);
  } finally {
    process.exit(0);
  }
}

// Execute if script is run directly
if (require.main === module) {
  createTables();
}

module.exports = createTables;