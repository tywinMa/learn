const { sequelize } = require('../config/database');
const initSubjectsAndUnits = require('./initSubjectsAndUnits');
const addUnit1_1Exercises = require('./addUnit1_1Exercises');
const addMissingExercises = require('./addMissingExercises');
const addNewExerciseTypes = require('./addNewExerciseTypes');
const initLearningContent = require('./initLearningContent');
const fixLearningContentIds = require('./fixLearningContentIds');

/**
 * 重置数据库并重新初始化数据
 */
const initData = async () => {
  try {
    console.log('开始初始化数据...');

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

    // 修复学习内容ID格式
    await fixLearningContentIds();

    console.log('数据初始化完成！');
  } catch (error) {
    console.error('数据初始化出错:', error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  initData().then(() => {
    console.log('初始化脚本执行完毕');
    process.exit();
  }).catch(err => {
    console.error('初始化脚本执行失败:', err);
    process.exit(1);
  });
}

module.exports = initData; 