const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 大单元模型（Unit）
const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '大单元ID，如"math-grade1-1"'
  },
  subjectGradeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '学科年级关联ID，关联SubjectGrade表的id字段'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '大单元标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '大单元描述'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '大单元的显示顺序'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否发布'
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '大单元的主题颜色'
  },
  secondaryColor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '大单元的次要颜色，用于渐变效果'
  },
  courseIds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '包含的小单元ID列表'
  },
}, {
  timestamps: true,
  comment: '大单元表，存储课程大单元信息',
});

module.exports = Unit; 