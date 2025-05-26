const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * 答题记录模型 - 整合UserRecord和WrongExercise
 * 用于全面记录用户答题行为，便于学习分析
 */
const AnswerRecord = sequelize.define('AnswerRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // ===== 基础信息 =====
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '学生ID，关联Student表'
  },
  exerciseId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '练习题ID'
  },
  unitId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '单元ID，包含学科前缀'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码'
  },
  
  // ===== 答题结果 =====
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: '是否答对'
  },
  userAnswer: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '用户的具体答案，JSON格式存储'
  },
  correctAnswer: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '正确答案，便于分析错误模式'
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: '得分，支持部分正确的情况'
  },
  
  // ===== 时间数据 =====
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应时间（秒）'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始答题时间'
  },
  submitTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '提交答案时间'
  },
  
  // ===== 尝试相关 =====
  attemptNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '第几次尝试（1表示首次）'
  },
  totalAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '该题目的总尝试次数'
  },
  isFirstAttempt: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否首次尝试'
  },
  previousResult: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: '上一次尝试的结果'
  },
  
  // ===== 上下文信息 =====
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '学习会话ID，用于分析学习会话模式'
  },
  practiceMode: {
    type: DataTypes.ENUM('normal', 'review', 'wrong_redo', 'test', 'unlock_test'),
    defaultValue: 'normal',
    comment: '练习模式：normal-正常练习, review-复习, wrong_redo-错题重做, test-测试, unlock_test-解锁测试'
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '设备信息，如设备类型、操作系统等'
  },
  
  // ===== 学习行为 =====
  hintsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用提示的次数'
  },
  helpRequested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否请求了帮助'
  },
  knowledgePointsViewed: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '查看的知识点列表'
  },
  
  // ===== 题目属性 =====
  exerciseType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '题目类型：choice, fill_blank, matching等'
  },
  difficultyLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '题目难度级别（1-5）'
  },
  
  // ===== 用户状态 =====
  confidence: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '答题信心度（1-5），如果前端支持收集'
  },
  studyTimeBeforeAnswer: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '答题前的学习时间（秒）'
  },
  
  // ===== 错题管理 =====
  isWrongAnswer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为错误答案'
  },
  wrongAnswerType: {
    type: DataTypes.ENUM('calculation', 'concept', 'careless', 'unknown'),
    allowNull: true,
    comment: '错误类型：calculation-计算错误, concept-概念错误, careless-粗心错误, unknown-未知'
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '作为错题被复习的次数'
  },
  lastReviewTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后复习时间'
  },
  masteredAfterAttempts: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '经过多少次尝试后掌握（连续答对的次数）'
  },
  
  // ===== 分析字段 =====
  timeOfDay: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '答题时间段（小时）0-23'
  },
  weekday: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '星期几（0-6，0表示周日）'
  },
  learningStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '连续学习天数'
  },
  
  // ===== 成绩与进度 =====
  pointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '本次答题获得的积分'
  },
  experienceGained: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '获得的经验值'
  },
  masteryContribution: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: '对单元掌握度的贡献值'
  }
}, {
  timestamps: true,
  indexes: [
    // 基础查询索引
    { fields: ['studentId', 'exerciseId'] },
    { fields: ['studentId', 'unitId'] },
    { fields: ['studentId', 'subject'] },
    
    // 结果分析索引
    { fields: ['isCorrect'] },
    { fields: ['isWrongAnswer'] },
    { fields: ['practiceMode'] },
    
    // 时间分析索引
    { fields: ['submitTime'] },
    { fields: ['timeOfDay'] },
    { fields: ['weekday'] },
    
    // 学习行为索引
    { fields: ['attemptNumber'] },
    { fields: ['sessionId'] },
    { fields: ['responseTime'] },
    
    // 复合索引用于复杂查询
    { fields: ['studentId', 'isCorrect', 'submitTime'] },
    { fields: ['studentId', 'practiceMode', 'isCorrect'] },
    { fields: ['subject', 'exerciseType', 'isCorrect'] }
  ],
  hooks: {
    beforeCreate: async (record) => {
      // 自动设置时间相关字段
      const submitTime = record.submitTime || new Date();
      record.timeOfDay = submitTime.getHours();
      record.weekday = submitTime.getDay();
      
      // 设置错题标识
      record.isWrongAnswer = !record.isCorrect;
      
      // 如果没有提供subject，尝试从关联的Exercise中获取
      if (!record.subject && record.exerciseId) {
        try {
          const { Exercise } = require('./index');
          const exercise = await Exercise.findByPk(record.exerciseId);
          if (exercise) {
            record.subject = exercise.subject;
            record.exerciseType = exercise.type;
            record.correctAnswer = exercise.correctAnswer;
          }
        } catch (error) {
          console.error('获取练习题信息出错:', error);
        }
      }
    },
    
    beforeUpdate: async (record) => {
      // 更新时重新计算某些字段
      record.isWrongAnswer = !record.isCorrect;
    }
  },
  comment: '用户答题记录表，整合了原UserRecord和WrongExercise的功能，增加了丰富的分析维度'
});

module.exports = AnswerRecord; 