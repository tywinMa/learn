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
  ]
});

module.exports = WrongExercise;
