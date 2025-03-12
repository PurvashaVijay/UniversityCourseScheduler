const { DataTypes, Model } = require('sequelize');
//const sequelize = require('../../src/config/database');
const sequelize = require('../../src/config/database').sequelize;
const bcrypt = require('bcrypt');

class Professor extends Model {
  async validatePassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }
}

Professor.init({
  professor_id: {
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
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
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
  modelName: 'professor',
  tableName: 'professor',
  timestamps: false,
  hooks: {
    beforeCreate: async (professor) => {
      if (professor.password_hash) {
        const salt = await bcrypt.genSalt(10);
        professor.password_hash = await bcrypt.hash(professor.password_hash, salt);
      }
    },
    beforeUpdate: async (professor) => {
      if (professor.changed('password_hash')) {
        const salt = await bcrypt.genSalt(10);
        professor.password_hash = await bcrypt.hash(professor.password_hash, salt);
      }
    }
  }
});

module.exports = Professor;