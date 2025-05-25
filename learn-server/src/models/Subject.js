const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 学科模型
const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: '学科代码，如"math", "physics", "chemistry"等'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科名称，如"数学", "物理", "化学"等'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '学科描述'
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "#5EC0DE",
    comment: '学科对应的主题颜色'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '学科图标'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '显示顺序'
  }
}, {
  timestamps: true,
  comment: '学科表，存储不同的学科信息'
});

module.exports = Subject; 