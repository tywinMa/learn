const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 用户积分模型
const UserPoints = sequelize.define('UserPoints', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // 每个用户只有一条积分记录
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = UserPoints;
