const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 练习题模型
const Exercise = sequelize.define('Exercise', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  unitId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true, // 允许为空，因为不是所有题型都需要选项
  },
  correctAnswer: {
    type: DataTypes.JSON, // 改为JSON类型以支持多种答案格式
    allowNull: false,
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true, // 解释可选
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'choice', // 选择题
    // 可能的值: 'choice', 'matching', 'fill_blank', 'application', 'sort', 'math'
  },
  difficulty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // 1-5的难度评级
    validate: {
      min: 1,
      max: 5
    }
  },
  media: {
    type: DataTypes.JSON,
    allowNull: true, // 可选媒体元素(图片、图表等)
  },
  hints: {
    type: DataTypes.JSON,
    allowNull: true, // 可选提示
  }
}, {
  timestamps: true
});

module.exports = Exercise;
