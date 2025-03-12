const { Sequelize } = require('sequelize');

// Use hardcoded values for testing
const sequelize = new Sequelize(
  'course_scheduler', 
  'postgres', 
  'Postgre123',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: false,
      underscored: true
    }
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};


module.exports = {
  sequelize,
  testConnection
};


//module.exports = sequelize;