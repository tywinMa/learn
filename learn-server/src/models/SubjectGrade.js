const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 学科年级关联模型
const SubjectGrade = sequelize.define('SubjectGrade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  subjectCode: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，关联Subject表的code字段'
  },
  gradeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年级ID，关联Grade表的id字段'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否激活'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '在该年级中的显示顺序'
  }
}, {
  timestamps: true,
  comment: '学科年级关联表，存储学科与年级的对应关系',
  indexes: [
    {
      unique: true,
      fields: ['subjectCode', 'gradeId']
    }
  ]
});

module.exports = SubjectGrade; 