const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 用户答题记录模型
const UserRecord = sequelize.define('UserRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  exerciseId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unitId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  attemptCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'exerciseId']
    }
  ]
});

module.exports = UserRecord;
