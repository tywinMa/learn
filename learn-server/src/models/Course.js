const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 课程模型
const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '课程ID'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，如math、physics等，用于标识所属学科'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '课程标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '课程描述'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '课程学习内容，支持富文本'
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
    comment: '课程类型：normal-普通学习课程，exercise-练习课程'
  },
  position: {
    type: DataTypes.ENUM('default', 'left', 'right'),
    allowNull: false,
    defaultValue: 'default',
    comment: '特殊课程的位置：default-默认位置，left-左侧，right-右侧'
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '教师ID，用于管理端'
  },
  exerciseGroupIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '关联的习题组ID数组'
  },
  gradeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '年级ID，关联Grade表的id字段'
  }
}, {
  timestamps: true,
  comment: '课程表，存储独立的课程信息',
});

module.exports = Course; 