const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;

class ScheduledCourse extends Model {}

ScheduledCourse.init({
  scheduled_course_id: {
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
  course_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'course',
      key: 'course_id'
    }
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
  is_override: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  override_reason: {
    type: DataTypes.TEXT
  },
  // New fields for multiple class instances
  class_instance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  num_classes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
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
  modelName: 'scheduled_course',
  tableName: 'scheduled_course',
  timestamps: false
});

module.exports = ScheduledCourse;