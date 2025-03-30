const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database').sequelize;

class CourseSemester extends Model {}

CourseSemester.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'course',
      key: 'course_id'
    }
  },
  semester: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'course_semester',
  tableName: 'course_semester',
  timestamps: false,
  indexes: [
    {
      fields: ['course_id']
    }
  ]
});

module.exports = CourseSemester;