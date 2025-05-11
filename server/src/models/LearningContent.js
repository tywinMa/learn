const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 学习内容模型
const LearningContent = sequelize.define('LearningContent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属学科ID'
  },
  unitId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '对应的单元ID，如"math-1-1"'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '内容标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '学习内容，支持富文本'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '同一单元内内容的排序'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'text',
    comment: '内容类型: text(文本), image(图片), video(视频), formula(公式)'
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '图片、视频等媒体资源的URL'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '其他元数据，如视频时长、图片尺寸等'
  }
}, {
  timestamps: true,
  comment: '学习内容表，存储每个单元的学习材料'
});

module.exports = LearningContent; 