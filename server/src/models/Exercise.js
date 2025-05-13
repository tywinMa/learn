const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 练习题模型
const Exercise = sequelize.define('Exercise', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '练习题ID，如1-1-1表示数学学科第1单元第1关卡第1题'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，如math、physics等，用于标识所属学科'
  },

  unitId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '所属单元ID，如1-1'
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
  timestamps: true,
  hooks: {
    beforeCreate: (exercise) => {
      // 确保ID包含学科代码
      if (!exercise.id.startsWith(exercise.subject)) {
        // 检查unitId是否已包含学科前缀
        if (exercise.unitId.startsWith(exercise.subject)) {
          // 如果unitId已经有学科前缀，则直接使用unitId作为id的前缀
          if (!exercise.id.startsWith(exercise.unitId)) {
            exercise.id = `${exercise.unitId}-${exercise.id.split('-').pop()}`;
          }
        } else {
          // 如果unitId没有学科前缀，给ID添加学科前缀
          exercise.id = `${exercise.subject}-${exercise.id}`;
        }
      }
      
      // 确保unitId包含学科前缀
      if (!exercise.unitId.startsWith(exercise.subject)) {
        exercise.unitId = `${exercise.subject}-${exercise.unitId}`;
      }
    }
  }
});

module.exports = Exercise;
