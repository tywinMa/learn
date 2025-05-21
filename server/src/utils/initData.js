const { sequelize } = require("../config/database");
const initSubjectsAndUnits = require("./initSubjectsAndUnits");
const addUnit1_1Exercises = require("./addUnit1_1Exercises");
const addGeometryExercises = require("./addGeometryExercises");
// 保留引用但不再使用
// const addGeometryLearningContent = require("./addGeometryLearningContent");
// const initLearningContent = require("./initLearningContent");
// const migrateContentToUnit = require("./migrateContentToUnit");
const initUnitContent = require("./initUnitContent");
const initGeometryUnitContent = require("./initGeometryUnitContent");

/**
 * 重置数据库并重新初始化数据
 */
const initData = async () => {
  try {
    console.log("开始初始化数据...");

    // 同步数据库模型（重建表结构）
    await sequelize.sync({ force: true });
    console.log("数据库表结构已重置");

    // 初始化学科和单元
    await initSubjectsAndUnits();
    
    // 注释掉旧的学习内容初始化和迁移代码
    // 在数据迁移完成后，这些代码不再需要
    // await initLearningContent();
    
    // 添加单元1-1的练习题
    await addUnit1_1Exercises();
    // 添加几何单元的练习题
    await addGeometryExercises();
    
    // 初始化单元内容（新方法，直接使用Unit模型）
    await initUnitContent();
    // 初始化几何单元内容
    await initGeometryUnitContent();
    
    // 注释掉旧的内容初始化和迁移代码
    // 添加几何单元的学习内容
    // await addGeometryLearningContent();
    // 将学习内容迁移到Unit模型中
    // await migrateContentToUnit();

    console.log("数据初始化完成！");
  } catch (error) {
    console.error("数据初始化出错:", error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  initData()
    .then(() => {
      console.log("初始化脚本执行完毕");
      process.exit();
    })
    .catch((err) => {
      console.error("初始化脚本执行失败:", err);
      process.exit(1);
    });
}

module.exports = initData;
