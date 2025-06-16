const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 年级模型
const Grade = sequelize.define('Grade', {
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
    comment: '年级代码，如"grade1", "grade7", "grade10"等'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '年级名称，如"一年级", "初一", "高一"等'
  },
  level: {
    type: DataTypes.ENUM('primary', 'middle', 'high'),
    allowNull: false,
    comment: '学段：primary-小学，middle-初中，high-高中'
  },
  levelNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '该学段内的年级编号，从1开始'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '年级描述'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '显示顺序'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否激活'
  }
}, {
  timestamps: true,
  comment: '年级表，存储各个年级信息'
});

module.exports = Grade; 