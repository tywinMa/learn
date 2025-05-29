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
  
  // ===== 单元完成状态 =====
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: '单元是否完成，当completedExercises达到totalExercises的80%时为true'
  },
  stars: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '单元获得的星级 (0-3): 0星=未开始, 1星=>0%, 2星>=60%, 3星>=80%'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '单元完成时间戳'
  },
  
  // ===== 题目完成进度 =====
  totalExercises: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '该单元总题目数量（从课程的习题组中计算得出）'
  },
  completedExercises: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '已完成（答对）的题目数量，基于答题记录中isCorrect=true的唯一题目数'
  },
  
  // ===== 学习活动次数 =====
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
  
  // ===== 答题统计 =====
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户在该单元正确回答的题目数量（包括重复答题）'
  },
  incorrectCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户在该单元错误回答的题目数量（包括重复答题）'
  },
  totalAnswerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    comment: '用户在该单元总共回答的题目数量，包括重复的'
  },
  
  // ===== 时间统计 =====
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
  
  // ===== 掌握程度 =====
  masteryLevel: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false,
    comment: '用户对该单元的掌握程度（0-1之间的浮点数），基于完成度和正确率计算'
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['studentId', 'unitId']
    },
    // 添加一些查询优化索引
    { fields: ['studentId'] },
    { fields: ['unitId'] },
    { fields: ['completed'] },
    { fields: ['stars'] }
  ],
  comment: 'Tracks user progress for each unit, including unlock status and stars.'
});

module.exports = UnitProgress; 