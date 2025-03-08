const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database');

class Department extends Model {}

Department.init({
  department_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'department',
  tableName: 'department',
  timestamps: false // We'll handle timestamps manually to match your schema
});

module.exports = Department;