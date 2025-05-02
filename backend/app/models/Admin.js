// app/models/Admin.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../src/config/database');
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
    allowNull: true, // Allow null for super admin
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
  // Add the reset token fields here, inside the fields definition
  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_token_expires: {
    type: DataTypes.DATE,
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