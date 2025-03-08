const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database');

class TimeSlot extends Model {}

TimeSlot.init({
  timeslot_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  day_of_week: {
    type: DataTypes.STRING(20),
    allowNull: false
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
  modelName: 'time_slot',
  tableName: 'time_slot',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name', 'day_of_week']
    }
  ],
  validate: {
    startBeforeEnd() {
      if (this.start_time >= this.end_time) {
        throw new Error('Start time must be before end time');
      }
    }
  }
});

module.exports = TimeSlot;