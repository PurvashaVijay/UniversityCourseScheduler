const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;

class Course extends Model {}

Course.init({
  course_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  department_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'department',
      key: 'department_id'
    }
  },
  course_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_core: {
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
  modelName: 'course',
  tableName: 'course',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['department_id', 'course_name']
    }
  ]
});

module.exports = Course;