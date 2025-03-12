const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;

class Schedule extends Model {}

Schedule.init({
  schedule_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  semester_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'semester',
      key: 'semester_id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  is_final: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
  modelName: 'schedule',
  tableName: 'schedule',
  timestamps: false
});

module.exports = Schedule;