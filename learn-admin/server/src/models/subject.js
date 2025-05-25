const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '学科标签颜色，如#1677ff'
  }
});

module.exports = Subject; 