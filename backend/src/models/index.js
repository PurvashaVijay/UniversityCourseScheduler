const { sequelize } = require('../config/database');
const Department = require('./Department');
// Import other models here as they're created

// Define associations between models here
// Example: Department.hasMany(Program);

module.exports = {
  sequelize,
  Department
  // Export other models here
};