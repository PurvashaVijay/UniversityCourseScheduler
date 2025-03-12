const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;

class CourseProgram extends Model {}

CourseProgram.init({
  course_program_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  course_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'course',
      key: 'course_id'
    }
  },
  program_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'program',
      key: 'program_id'
    }
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'course_program',
  tableName: 'course_program',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['course_id', 'program_id']
    }
  ]
});

module.exports = CourseProgram;