const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;

class Conflict extends Model {}

Conflict.init({
  conflict_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  schedule_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'schedule',
      key: 'schedule_id'
    }
  },
  timeslot_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'time_slot',
      key: 'timeslot_id'
    }
  },
  day_of_week: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  conflict_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_resolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  resolution_notes: {
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
  modelName: 'conflict',
  tableName: 'conflict',
  timestamps: false
});

module.exports = Conflict;