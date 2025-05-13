const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 错题本模型
const WrongExercise = sequelize.define('WrongExercise', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false // 确保不是唯一的
  },
  exerciseId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false // 确保不是唯一的
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，如math、physics等，用于标识所属学科'
  },
  unitId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'exerciseId']
    }
  ],
  hooks: {
    beforeCreate: async (record) => {
      // 如果没有提供subject，尝试从关联的Exercise中获取
      if (!record.subject && record.exerciseId) {
        try {
          const { Exercise } = require('./index');
          const exercise = await Exercise.findByPk(record.exerciseId);
          if (exercise && exercise.subject) {
            record.subject = exercise.subject;
          }
        } catch (error) {
          console.error('获取练习题学科信息出错:', error);
        }
      }
    }
  }
});

module.exports = WrongExercise;
