const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;

class Program extends Model {}

Program.init({
  program_id: {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
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
  modelName: 'program',
  tableName: 'program',
  timestamps: false
});

module.exports = Program;