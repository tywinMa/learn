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
  comment: '单元表，存储课程单元信息',
  hooks: {
    beforeCreate: (unit) => {
      // 确保ID包含学科代码前缀
      if (!unit.id.startsWith(unit.subject)) {
        unit.id = `${unit.subject}-${unit.id}`;
      }
      
      // 如果有父单元ID，确保也包含学科前缀
      if (unit.parentId && !unit.parentId.startsWith(unit.subject)) {
        unit.parentId = `${unit.subject}-${unit.parentId}`;
      }
    }
  }
});

module.exports = Unit; 