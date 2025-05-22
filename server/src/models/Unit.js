const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 单元模型
const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '单元ID，如"1-1"，章节-小节'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，如math、physics等，用于标识所属学科'
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
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '单元学习内容，支持富文本'
  },
  media: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '媒体资源数组，包含图片、视频等媒体资源'
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
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '单元的主题颜色，如果不设置则使用学科默认颜色'
  },
  secondaryColor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '单元的次要颜色，用于渐变效果，如果不设置则自动基于主颜色生成'
  },
  unitType: {
    type: DataTypes.ENUM('normal', 'exercise'),
    allowNull: false,
    defaultValue: 'normal',
    comment: '单元类型：normal-普通学习单元，exercise-练习单元'
  },
  position: {
    type: DataTypes.ENUM('default', 'left', 'right'),
    allowNull: false,
    defaultValue: 'default',
    comment: '特殊单元的位置：default-默认位置，left-左侧，right-右侧'
  },
  isMajor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为大单元，true 表示大单元，false 表示小单元'
  },
}, {
  timestamps: true,
  comment: '单元表，存储课程单元信息',
});

module.exports = Unit; 