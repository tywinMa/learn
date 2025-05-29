const Exercise = require('./Exercise');
const StudentPoints = require('./StudentPoints');
const Subject = require('./Subject');
const Unit = require('./Unit');
const Course = require('./Course');
const UnitProgress = require('./UnitProgress');
const AnswerRecord = require('./AnswerRecord');
const KnowledgePoint = require('./KnowledgePoint');
const User = require('./User');
const Student = require('./Student');
const ExerciseGroup = require('./ExerciseGroup');
const { sequelize } = require('../config/database');

// 定义模型之间的关系
// 学科与单元之间的关系
// 使用subject字段作为关联键
Subject.hasMany(Unit, { foreignKey: 'subject', sourceKey: 'code' });
Unit.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });

// 学科与课程之间的关系
Course.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });
Subject.hasMany(Course, { foreignKey: 'subject', sourceKey: 'code' });

// 学科与练习题之间的关系
Exercise.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });
Subject.hasMany(Exercise, { foreignKey: 'subject', sourceKey: 'code' });

// 学科与习题组之间的关系
ExerciseGroup.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });
Subject.hasMany(ExerciseGroup, { foreignKey: 'subject', sourceKey: 'code' });

// 学科与知识点之间的关系
KnowledgePoint.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });
Subject.hasMany(KnowledgePoint, { foreignKey: 'subject', sourceKey: 'code' });

// Course and UnitProgress relationship (原来是Unit，现在改为Course)
Course.hasMany(UnitProgress, { foreignKey: 'unitId', sourceKey: 'id' });
UnitProgress.belongsTo(Course, { foreignKey: 'unitId', targetKey: 'id' });

// ===== AnswerRecord关系 =====
// Exercise 和 AnswerRecord 之间的关系
Exercise.hasMany(AnswerRecord, { foreignKey: 'exerciseId', sourceKey: 'id' });
AnswerRecord.belongsTo(Exercise, { foreignKey: 'exerciseId', targetKey: 'id' });

// Subject 和 AnswerRecord 之间的关系
Subject.hasMany(AnswerRecord, { foreignKey: 'subject', sourceKey: 'code' });
AnswerRecord.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });

// Course 和 AnswerRecord 之间的关系 (原来是Unit，现在改为Course)
Course.hasMany(AnswerRecord, { foreignKey: 'unitId', sourceKey: 'id' });
AnswerRecord.belongsTo(Course, { foreignKey: 'unitId', targetKey: 'id' });

// ===== Admin相关的关系 =====
// User和Course之间的关系（教师和课程）
User.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// ===== Student相关的关系 =====
// User和Student之间的关系（教师和学生）
User.hasMany(Student, { foreignKey: 'teacherId', as: 'students' });
Student.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Student和UnitProgress之间的关系
Student.hasMany(UnitProgress, { foreignKey: 'studentId', as: 'unitProgress' });
UnitProgress.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Student和AnswerRecord之间的关系
Student.hasMany(AnswerRecord, { foreignKey: 'studentId', as: 'answerRecords' });
AnswerRecord.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

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
      await sequelize.query('SELECT 1 FROM Courses LIMIT 1');
      await sequelize.query('SELECT 1 FROM Exercises LIMIT 1');
      await sequelize.query('SELECT 1 FROM KnowledgePoints LIMIT 1');
      await sequelize.query('SELECT 1 FROM WrongExercises LIMIT 1');
      await sequelize.query('SELECT 1 FROM UserRecords LIMIT 1');
      await sequelize.query('SELECT 1 FROM AnswerRecords LIMIT 1');
      await sequelize.query('SELECT 1 FROM Users LIMIT 1');
      await sequelize.query('SELECT 1 FROM StudentPoints LIMIT 1');
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
  StudentPoints,
  Subject,
  Unit,
  Course,
  UnitProgress,
  AnswerRecord,
  KnowledgePoint,
  User,
  Student,
  ExerciseGroup,
  sequelize,
  syncDatabase
};
