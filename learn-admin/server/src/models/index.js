const User = require('./user');
const Subject = require('./subject');
const Course = require('./course');
const Unit = require('./unit');
const Exercise = require('./exercise');

// 定义模型之间的关联
User.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

Subject.hasMany(Course, { foreignKey: 'subjectId', as: 'courses' });
Course.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

// 恢复课程与单元关联 - Unit可以关联到具体的Course
Course.hasMany(Unit, { foreignKey: 'courseId', as: 'units' });
Unit.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Unit自关联（父子关系）
Unit.hasMany(Unit, { foreignKey: 'parentId', as: 'children' });
Unit.belongsTo(Unit, { foreignKey: 'parentId', as: 'parent' });

// 课程与练习题关联（多对多）
Course.hasMany(Exercise, { foreignKey: 'courseId', as: 'exercises' });
Exercise.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// 课程与练习题的一对一关联（关联习题）
Course.belongsTo(Exercise, { 
  foreignKey: 'related_exercise_id',
  targetKey: 'exerciseCode',
  as: 'relatedExercise',
  constraints: false
});

Exercise.hasOne(Course, { 
  foreignKey: 'related_exercise_id',
  sourceKey: 'exerciseCode',
  as: 'relatedCourse', 
  constraints: false 
});

// 单元与练习题关联 - 更新为使用unitId字符串
Unit.hasMany(Exercise, { foreignKey: 'unitId', as: 'exercises' });
Exercise.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

module.exports = {
  User,
  Subject,
  Course,
  Unit,
  Exercise
}; 