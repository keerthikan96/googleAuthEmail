const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const EmailMetadata = sequelize.define('EmailMetadata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  messageId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  threadId: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  subject: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true,
      len: [1, 255]
    }
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  recipient: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  snippet: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bodyPreview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  receivedDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isStarred: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hasAttachments: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  labels: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  gmailMessageId: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  }
}, {
  tableName: 'email_metadata',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['messageId']
    },
    {
      unique: true,
      fields: ['userId', 'messageId']
    },
    {
      fields: ['sender']
    },
    {
      fields: ['receivedDate']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['isStarred']
    },
    {
      fields: ['threadId']
    },
    {
      fields: ['priority']
    }
  ]
});

// Define associations
User.hasMany(EmailMetadata, {
  foreignKey: 'userId',
  as: 'emails',
  onDelete: 'CASCADE'
});

EmailMetadata.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Instance methods
EmailMetadata.prototype.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

EmailMetadata.prototype.toggleStar = function() {
  this.isStarred = !this.isStarred;
  return this.save();
};

// Class methods
EmailMetadata.findByUser = function(userId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    order = [['receivedDate', 'DESC']],
    where = {}
  } = options;

  return this.findAndCountAll({
    where: {
      userId,
      ...where
    },
    limit,
    offset,
    order,
    include: [{
      model: User,
      as: 'user',
      attributes: ['name', 'email']
    }]
  });
};

EmailMetadata.searchEmails = function(userId, searchTerm, options = {}) {
  const { Op } = require('sequelize');
  const {
    limit = 20,
    offset = 0,
    order = [['receivedDate', 'DESC']]
  } = options;

  return this.findAndCountAll({
    where: {
      userId,
      [Op.or]: [
        { subject: { [Op.like]: `%${searchTerm}%` } },
        { sender: { [Op.like]: `%${searchTerm}%` } },
        { senderName: { [Op.like]: `%${searchTerm}%` } },
        { snippet: { [Op.like]: `%${searchTerm}%` } }
      ]
    },
    limit,
    offset,
    order,
    include: [{
      model: User,
      as: 'user',
      attributes: ['name', 'email']
    }]
  });
};

EmailMetadata.getUnreadCount = function(userId) {
  return this.count({
    where: {
      userId,
      isRead: false
    }
  });
};

module.exports = EmailMetadata;
