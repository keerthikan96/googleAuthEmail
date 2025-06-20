const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true,
      len: [1, 255]
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  picture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['googleId']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['isActive']
    }
  ],  hooks: {
    // Note: OAuth tokens should NOT be hashed as they need to be used in their original form
    // for API calls. Instead, ensure proper database security through other means.
  }
});

// Instance methods
User.prototype.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

User.prototype.isTokenExpired = function() {
  if (!this.tokenExpiry) return true;
  return new Date() > this.tokenExpiry;
};

// Class methods
User.findByGoogleId = function(googleId) {
  return this.findOne({ 
    where: { googleId, isActive: true }
  });
};

User.findByEmail = function(email) {
  return this.findOne({ 
    where: { email, isActive: true }
  });
};

module.exports = User;
