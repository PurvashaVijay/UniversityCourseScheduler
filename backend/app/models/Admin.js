// Updated Admin.js model
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../src/config/database').sequelize;
const bcrypt = require('bcrypt');

class Admin extends Model {
  async validatePassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }
}

Admin.init({
  admin_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  department_id: {
    type: DataTypes.STRING(50),
    allowNull: true, // Changed to allow null for super admin
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
  password: {
    type: DataTypes.VIRTUAL,
    allowNull: true,
    validate: {
      len: [6, 100]
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
  modelName: 'admin',
  tableName: 'admin',
  timestamps: false,
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(10);
        admin.password_hash = await bcrypt.hash(admin.password, salt);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        admin.password_hash = await bcrypt.hash(admin.password, salt);
      }
    }
  }
});

module.exports = Admin;