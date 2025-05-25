const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 小单元模型（Course）
const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '小单元ID，如"math-1-1"'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，如math、physics等，用于标识所属学科'
  },
  unitId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '所属大单元ID'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '小单元标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '小单元描述'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '小单元学习内容，支持富文本'
  },
  media: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '媒体资源数组，包含图片、视频等媒体资源'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否发布'
  },
  unitType: {
    type: DataTypes.ENUM('normal', 'exercise'),
    allowNull: false,
    defaultValue: 'normal',
    comment: '小单元类型：normal-普通学习单元，exercise-练习单元'
  },
  position: {
    type: DataTypes.ENUM('default', 'left', 'right'),
    allowNull: false,
    defaultValue: 'default',
    comment: '特殊单元的位置：default-默认位置，left-左侧，right-右侧'
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '教师ID，用于管理端'
  }
}, {
  timestamps: true,
  comment: '小单元表，存储课程小单元信息',
});

module.exports = Course; 