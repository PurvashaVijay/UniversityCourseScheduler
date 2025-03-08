const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database');

class ProfessorAvailability extends Model {}

ProfessorAvailability.init({
  availability_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  professor_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'professor',
      key: 'professor_id'
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
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  modelName: 'professor_availability',
  tableName: 'professor_availability',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['professor_id', 'timeslot_id', 'day_of_week']
    }
  ]
});

module.exports = ProfessorAvailability;