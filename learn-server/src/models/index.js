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

const Task = require('./Task');
const Grade = require('./Grade');
const SubjectGrade = require('./SubjectGrade');
const UserGradeSubjectPreference = require('./UserGradeSubjectPreference');
const MediaResource = require('./MediaResource');
const CourseMediaResource = require('./CourseMediaResource');
const { sequelize } = require('../config/database');

// 定义模型之间的关系
// SubjectGrade与单元之间的关系
SubjectGrade.hasMany(Unit, { foreignKey: 'subjectGradeId', as: 'units' });
Unit.belongsTo(SubjectGrade, { foreignKey: 'subjectGradeId', as: 'subjectGrade' });

// 学科与课程之间的关系
Course.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code', as: 'subjectInfo' });
Subject.hasMany(Course, { foreignKey: 'subject', sourceKey: 'code' });

// 学科与练习题之间的关系
Exercise.belongsTo(Subject, { foreignKey: 'subject', targetKey: 'code' });
Subject.hasMany(Exercise, { foreignKey: 'subject', sourceKey: 'code' });



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

// ===== 年级相关的关系 =====
// Grade和SubjectGrade之间的关系
Grade.hasMany(SubjectGrade, { foreignKey: 'gradeId', as: 'subjectGrades' });
SubjectGrade.belongsTo(Grade, { foreignKey: 'gradeId', as: 'grade' });

// Subject和SubjectGrade之间的关系
Subject.hasMany(SubjectGrade, { foreignKey: 'subjectCode', sourceKey: 'code', as: 'subjectGrades' });
SubjectGrade.belongsTo(Subject, { foreignKey: 'subjectCode', targetKey: 'code', as: 'subject' });

// Course和Grade之间的关系
Course.belongsTo(Grade, { foreignKey: 'gradeId', as: 'grade' });
Grade.hasMany(Course, { foreignKey: 'gradeId', as: 'courses' });

// Student和UserGradeSubjectPreference之间的关系
Student.hasMany(UserGradeSubjectPreference, { foreignKey: 'studentId', as: 'gradeSubjectPreferences' });
UserGradeSubjectPreference.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Subject和UserGradeSubjectPreference之间的关系
Subject.hasMany(UserGradeSubjectPreference, { foreignKey: 'subjectCode', sourceKey: 'code', as: 'gradeSubjectPreferences' });
UserGradeSubjectPreference.belongsTo(Subject, { foreignKey: 'subjectCode', targetKey: 'code', as: 'subject' });

// Grade和UserGradeSubjectPreference之间的关系
Grade.hasMany(UserGradeSubjectPreference, { foreignKey: 'gradeId', as: 'gradeSubjectPreferences' });
UserGradeSubjectPreference.belongsTo(Grade, { foreignKey: 'gradeId', as: 'grade' });

// ===== 媒体资源相关的关系 =====
// User和MediaResource之间的关系（上传者）
User.hasMany(MediaResource, { foreignKey: 'uploadUserId', as: 'mediaResources' });
MediaResource.belongsTo(User, { foreignKey: 'uploadUserId', as: 'uploader' });

// Course和MediaResource之间的多对多关系
Course.belongsToMany(MediaResource, { 
  through: CourseMediaResource, 
  foreignKey: 'courseId', 
  otherKey: 'mediaResourceId',
  as: 'mediaResources'
});
MediaResource.belongsToMany(Course, { 
  through: CourseMediaResource, 
  foreignKey: 'mediaResourceId', 
  otherKey: 'courseId',
  as: 'courses'
});

// 关联表与主表的关系
CourseMediaResource.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CourseMediaResource.belongsTo(MediaResource, { foreignKey: 'mediaResourceId', as: 'mediaResource' });
CourseMediaResource.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Course.hasMany(CourseMediaResource, { foreignKey: 'courseId', as: 'courseMediaResources' });
MediaResource.hasMany(CourseMediaResource, { foreignKey: 'mediaResourceId', as: 'courseMediaResources' });
User.hasMany(CourseMediaResource, { foreignKey: 'createdBy', as: 'createdCourseMediaResources' });

// 同步所有模型到数据库
const syncDatabase = async () => {
  try {
    // 禁用外键约束检查（仅SQLite）
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = OFF;');
    }

    // 首先尝试正常同步，不修改现有结构
    await sequelize.sync();
    console.log('所有模型已同步到数据库');

    // 重新启用外键约束检查（仅SQLite）
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = ON;');
    }

    // 检查表是否存在
    try {
      await sequelize.query('SELECT 1 FROM Subjects LIMIT 1');
      await sequelize.query('SELECT 1 FROM Units LIMIT 1');
      await sequelize.query('SELECT 1 FROM Courses LIMIT 1');
      await sequelize.query('SELECT 1 FROM Exercises LIMIT 1');
      await sequelize.query('SELECT 1 FROM KnowledgePoints LIMIT 1');
      await sequelize.query('SELECT 1 FROM AnswerRecords LIMIT 1');
      await sequelize.query('SELECT 1 FROM Users LIMIT 1');
      await sequelize.query('SELECT 1 FROM StudentPoints LIMIT 1');
      await sequelize.query('SELECT 1 FROM Tasks LIMIT 1');
      await sequelize.query('SELECT 1 FROM MediaResources LIMIT 1');
      await sequelize.query('SELECT 1 FROM CourseMediaResources LIMIT 1');
      console.log('数据库表结构完整');
    } catch (checkError) {
      // 如果表不存在，将创建它们（已经通过上面的sync操作完成）
      console.log('部分表可能不存在，但已通过sync操作创建');
    }
  } catch (error) {
    console.error('同步模型到数据库时出错:', error);

    // 重新启用外键约束检查
    if (sequelize.getDialect() === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys = ON;');
    }

    // 如果是外键约束错误，推荐手动重置数据库
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.log('⚠️  检测到外键约束冲突');
      console.log('💡 建议运行: ./reset-data.sh --force 来重置数据库');
      throw new Error('外键约束冲突，请运行 ./reset-data.sh --force 重置数据库');
    }

    // 如果出现其他严重错误，尝试使用force模式重建表
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
  Task,
  Grade,
  SubjectGrade,
  UserGradeSubjectPreference,
  MediaResource,
  CourseMediaResource,
  sequelize,
  syncDatabase
};
