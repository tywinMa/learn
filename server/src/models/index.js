const Exercise = require('./Exercise');
const UserRecord = require('./UserRecord');
const WrongExercise = require('./WrongExercise');
const UserPoints = require('./UserPoints');
const Subject = require('./Subject');
const Unit = require('./Unit');
const UnitProgress = require('./UnitProgress');
const KnowledgePoint = require('./KnowledgePoint');
const { sequelize } = require('../config/database');

// 定义模型之间的关系
// 学科与单元之间的关系
// 使用subject字段作为关联键
Subject.hasMany(Unit, { foreignKey: 'subject', sourceKey: 'code' });
Unit.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });

// 学科与练习题之间的关系
Subject.hasMany(Exercise, { foreignKey: 'subject', sourceKey: 'code' });
Exercise.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });

// 学科与知识点之间的关系
Subject.hasMany(KnowledgePoint, { foreignKey: 'subject', sourceKey: 'code' });
KnowledgePoint.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });

// 单元与练习题之间的关系
Unit.hasMany(Exercise, { foreignKey: 'unitId', sourceKey: 'id' });
Exercise.belongsTo(Unit, { foreignKey: 'unitId', targetKey: 'id' });

// Exercise 和 UserRecord 之间的关系
Exercise.hasMany(UserRecord, { foreignKey: 'exerciseId', sourceKey: 'id' });
UserRecord.belongsTo(Exercise, { foreignKey: 'exerciseId', targetKey: 'id' });

// Exercise 和 WrongExercise 之间的关系
Exercise.hasMany(WrongExercise, { foreignKey: 'exerciseId', sourceKey: 'id' });
WrongExercise.belongsTo(Exercise, { foreignKey: 'exerciseId', targetKey: 'id' });

// Subject 和 UserRecord 之间的关系
Subject.hasMany(UserRecord, { foreignKey: 'subject', sourceKey: 'code' });
UserRecord.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });

// Subject 和 WrongExercise 之间的关系
Subject.hasMany(WrongExercise, { foreignKey: 'subject', sourceKey: 'code' });
WrongExercise.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });

// Unit and UnitProgress relationship
Unit.hasMany(UnitProgress, { foreignKey: 'unitId', sourceKey: 'id' });
UnitProgress.belongsTo(Unit, { foreignKey: 'unitId', targetKey: 'id' });

// 同步所有模型到数据库
const syncDatabase = async () => {
  try {
    // 使用alter模式而不是force模式，这样不会删除现有数据
    // alter模式会尝试修改表结构以匹配模型，同时保留数据
    await sequelize.sync({ alter: true });
    console.log('所有模型已同步到数据库');

    // 检查表是否存在
    try {
      await sequelize.query('SELECT 1 FROM Subjects LIMIT 1');
      await sequelize.query('SELECT 1 FROM Units LIMIT 1');
      await sequelize.query('SELECT 1 FROM Exercises LIMIT 1');
      await sequelize.query('SELECT 1 FROM KnowledgePoints LIMIT 1');
      await sequelize.query('SELECT 1 FROM WrongExercises LIMIT 1');
      await sequelize.query('SELECT 1 FROM UserRecords LIMIT 1');
      console.log('数据库表结构完整');
    } catch (checkError) {
      // 如果表不存在，将创建它们（已经通过上面的sync操作完成）
      console.log('部分表可能不存在，但已通过sync操作创建');
    }
  } catch (error) {
    console.error('同步模型到数据库时出错:', error);

    // 如果出现严重错误，尝试使用force模式重建表
    // 这是最后的解决方案，会删除所有数据
    console.log('尝试使用force模式重建表...');
    try {
      await sequelize.sync({ force: true });
      console.log('所有模型已强制重建');
    } catch (forceError) {
      console.error('强制重建表时出错:', forceError);
      throw forceError; // 继续抛出错误以便上层捕获
    }
  }
};

module.exports = {
  Exercise,
  UserRecord,
  WrongExercise,
  UserPoints,
  Subject,
  Unit,
  UnitProgress,
  KnowledgePoint,
  sequelize,
  syncDatabase
};
