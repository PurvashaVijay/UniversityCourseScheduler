const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database');

class CoursePrerequisite extends Model {}

CoursePrerequisite.init({
  prerequisite_id: {
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
  prerequisite_course_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'course',
      key: 'course_id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'course_prerequisite',
  tableName: 'course_prerequisite',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['course_id', 'prerequisite_course_id']
    }
  ],
  validate: {
    noSelfReference() {
      if (this.course_id === this.prerequisite_course_id) {
        throw new Error('A course cannot be a prerequisite for itself');
      }
    }
  }
});

module.exports = CoursePrerequisite;