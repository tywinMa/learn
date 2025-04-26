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
    type: DataTypes.TEXT, // 存储为JSON字符串
    allowNull: false,
    get() {
      return JSON.parse(this.getDataValue('options'));
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value));
    }
  },
  correctAnswer: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Exercise;
