const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
// Assuming Unit model is also in this directory or correctly referenced if not.
// const Unit = require('./Unit'); 
// const User = require('./User'); // If a User model exists

const UnitProgress = sequelize.define('UnitProgress', {
  id: { // Adding a simple auto-incrementing ID can be useful, though userId+unitId is unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '学生ID，关联Student表'
  },
  unitId: {
    type: DataTypes.STRING,
    allowNull: false,
    // references: { model: Unit, key: 'id' } // Uncomment if Unit model is imported
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Indicates if the unit is accessible/unlocked for the user'
  },
  stars: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: 'Stars earned for this unit by the user (0-3)'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when the unit was marked as completed/unlocked'
  },
  studyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户学习该单元的次数，每次访问/study页面时增加'
  },
  practiceCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户练习该单元的次数，每次访问/practice页面时增加'
  },
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户在该单元正确回答的题目数量'
  },
  incorrectCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户在该单元错误回答的题目数量'
  },
  totalAnswerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户在该单元总共回答的题目数量，包括重复的'
  },
  totalTimeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户在该单元花费的总时间（秒）'
  },
  lastStudyTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '用户最后一次学习该单元的时间'
  },
  lastPracticeTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '用户最后一次练习该单元的时间'
  },
  averageResponseTime: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
    comment: '用户回答问题的平均反应时间（秒）'
  },
  masteryLevel: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
    comment: '用户对该单元的掌握程度（0-1之间的浮点数）'
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'unitId']
    }
  ],
  comment: 'Tracks user progress for each unit, including unlock status and stars.'
});

module.exports = UnitProgress; 