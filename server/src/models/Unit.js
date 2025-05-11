const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 单元模型
const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '单元ID，如"math-1-1"，学科代码-章节-小节'
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属学科ID'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '单元标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '单元描述'
  },
  parentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '父单元ID，用于表示层级关系'
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '层级，1表示大章节，2表示小节，3表示更小的节等'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '同级单元中的显示顺序'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否发布'
  }
}, {
  timestamps: true,
  comment: '单元表，存储课程单元信息'
});

module.exports = Unit; 