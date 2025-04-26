const Exercise = require('./Exercise');
const UserRecord = require('./UserRecord');
const WrongExercise = require('./WrongExercise');
const { sequelize } = require('../config/database');

// 定义模型之间的关系
// Exercise 和 UserRecord 之间的关系
Exercise.hasMany(UserRecord, { foreignKey: 'exerciseId', sourceKey: 'id' });
UserRecord.belongsTo(Exercise, { foreignKey: 'exerciseId', targetKey: 'id' });

// Exercise 和 WrongExercise 之间的关系
Exercise.hasMany(WrongExercise, { foreignKey: 'exerciseId', sourceKey: 'id' });
WrongExercise.belongsTo(Exercise, { foreignKey: 'exerciseId', targetKey: 'id' });

// 同步所有模型到数据库
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('所有模型已同步到数据库');
  } catch (error) {
    console.error('同步模型到数据库时出错:', error);
  }
};

module.exports = {
  Exercise,
  UserRecord,
  WrongExercise,
  sequelize,
  syncDatabase
};
