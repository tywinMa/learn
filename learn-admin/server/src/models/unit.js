const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 大单元模型 (Unit)
const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '大单元ID，如"math-1"'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，如math、physics等，用于标识所属学科'
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
    comment: '包含的课程ID列表，存储该大单元关联的课程IDs'
  }
});

module.exports = Unit; 