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
  // This field could be used by the frontend to know if the unit was unlocked via the special test
  // For now, `completed: true` and `stars: 0` implies this.
  // unlockedViaTest: {
  //   type: DataTypes.BOOLEAN,
  //   defaultValue: false,
  //   allowNull: false
  // }
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