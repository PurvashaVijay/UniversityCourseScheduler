// app/models/ProfessorCourse.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database').sequelize;

class ProfessorCourse extends Model {}

ProfessorCourse.init({
  professor_course_id: {
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
    allowNull: true
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
  modelName: 'professor_course',
  tableName: 'professor_course',
  timestamps: false
});

// These will be set up after the model is defined
ProfessorCourse.associate = (models) => {
  ProfessorCourse.belongsTo(models.Professor, { foreignKey: 'professor_id' });
  ProfessorCourse.belongsTo(models.Course, { foreignKey: 'course_id' });
};

module.exports = ProfessorCourse;