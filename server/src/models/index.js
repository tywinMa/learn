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
    // 先尝试删除有问题的表
    try {
      await sequelize.query('DROP TABLE IF EXISTS WrongExercises');
      await sequelize.query('DROP TABLE IF EXISTS UserRecords');
      console.log('已删除旧的表');
    } catch (dropError) {
      console.error('删除表时出错:', dropError);
    }

    // 强制重新创建所有表
    await sequelize.sync({ force: true });
    console.log('所有模型已同步到数据库');
  } catch (error) {
    console.error('同步模型到数据库时出错:', error);
    throw error; // 抛出错误以便上层捕获
  }
};

module.exports = {
  Exercise,
  UserRecord,
  WrongExercise,
  sequelize,
  syncDatabase
};
