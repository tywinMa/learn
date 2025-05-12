const { sequelize } = require('../config/database');
const { syncDatabase } = require('../models');
const initSubjectsAndUnits = require('../utils/initSubjectsAndUnits');
const addUnit1_1Exercises = require('../utils/addUnit1_1Exercises');
const addMissingExercises = require('../utils/addMissingExercises');
const addNewExerciseTypes = require('../utils/addNewExerciseTypes');
const initLearningContent = require('../utils/initLearningContent');

/**
 * 重置数据库并重新初始化数据
 */
const initDatabase = async () => {
  try {
    console.log('开始初始化数据库...');

    // 同步数据库模型（重建表结构）
    await sequelize.sync({ force: true });
    console.log('数据库表结构已重置');

    // 初始化学科和单元
    await initSubjectsAndUnits();

    // 添加单元1-1的练习题
    await addUnit1_1Exercises();

    // 添加其他练习题
    await addMissingExercises();

    // 添加新的练习题类型
    await addNewExerciseTypes();

    // 初始化学习内容
    await initLearningContent();

    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化出错:', error);
    throw error;
  }
};

module.exports = initDatabase;
