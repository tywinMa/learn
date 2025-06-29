const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 课程-媒体资源关联表
const CourseMediaResource = sequelize.define('CourseMediaResource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '关联记录唯一ID'
  },
  courseId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '课程ID，关联Course表'
  },
  mediaResourceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '媒体资源ID，关联MediaResource表'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '显示顺序，数字越小越靠前'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否激活，用于控制是否显示'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联创建者ID'
  }
}, {
  timestamps: true,
  comment: '课程-媒体资源关联表',
  indexes: [
    {
      fields: ['courseId']
    },
    {
      fields: ['mediaResourceId']
    },
    {
      fields: ['displayOrder']
    },
    {
      unique: true,
      fields: ['courseId', 'mediaResourceId']
    }
  ]
});

module.exports = CourseMediaResource; 