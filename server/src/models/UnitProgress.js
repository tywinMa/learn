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
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    // references: { model: User, key: 'id' } // Uncomment if User model exists and is imported
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
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'unitId']
    }
  ],
  comment: 'Tracks user progress for each unit, including unlock status and stars.'
});

module.exports = UnitProgress; 