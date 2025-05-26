const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 学生积分模型
const StudentPoints = sequelize.define('StudentPoints', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // 每个学生只有一条积分记录
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = StudentPoints;
