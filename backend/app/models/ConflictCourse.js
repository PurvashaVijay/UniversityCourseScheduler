const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;

class ConflictCourse extends Model {}

ConflictCourse.init({
  conflict_course_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  conflict_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'conflict',
      key: 'conflict_id'
    }
  },
  scheduled_course_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'scheduled_course',
      key: 'scheduled_course_id'
    }
  }
}, {
  sequelize,
  modelName: 'conflict_course',
  tableName: 'conflict_course',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['conflict_id', 'scheduled_course_id']
    }
  ]
});

module.exports = ConflictCourse;