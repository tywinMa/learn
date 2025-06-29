const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 媒体资源模型
const MediaResource = sequelize.define('MediaResource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '媒体资源唯一ID'
  },
  type: {
    type: DataTypes.ENUM('course_explanation', 'course_media', 'example_media'),
    allowNull: false,
    comment: '资源类型：course_explanation-课程讲解资源，course_media-课程媒体资源，example_media-例题媒体资源'
  },
  resourceUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '资源URL地址，可能是图片或视频'
  },
  resourceType: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
    comment: '资源文件类型：image-图片，video-视频'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '资源标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '资源介绍，支持富文本'
  },
  uploadUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '上传用户ID，关联User表'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览量'
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点击量'
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'published', 'under_review', 'rejected'),
    allowNull: false,
    defaultValue: 'draft',
    comment: '发布状态：draft-草稿，pending-待审核，published-已发布，under_review-审核中，rejected-已退回'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '文件大小（字节）'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '视频时长（秒），仅视频资源有效'
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '缩略图URL，主要用于视频资源'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '标签数组，便于分类和搜索'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已删除（软删除）'
  }
}, {
  timestamps: true,
  comment: '媒体资源表，存储独立的媒体资源信息',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['uploadUserId']
    },
    {
      fields: ['isDeleted']
    }
  ]
});

module.exports = MediaResource; 