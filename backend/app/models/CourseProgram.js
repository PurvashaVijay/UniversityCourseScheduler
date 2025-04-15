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
  num_classes: {  // Add this field
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 3 // Limit to between 1 and 3 classes
    }
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