const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 用户年级学科偏好记录模型
const UserGradeSubjectPreference = sequelize.define('UserGradeSubjectPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '学生ID，关联Student表的id字段'
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
  lastAccessTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '最后访问时间'
  }
}, {
  timestamps: true,
  comment: '用户年级学科偏好记录表，存储用户选择的学科对应的年级',
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'subjectCode']
    }
  ]
});

module.exports = UserGradeSubjectPreference; 