const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database');

class Semester extends Model {}

Semester.init({
  semester_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
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
  modelName: 'semester',
  tableName: 'semester',
  timestamps: false,
  validate: {
    startBeforeEnd() {
      if (this.start_date >= this.end_date) {
        throw new Error('Start date must be before end date');
      }
    }
  }
});

module.exports = Semester;