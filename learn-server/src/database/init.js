const { sequelize } = require("../config/database");
const initSubjectsAndUnits = require("../utils/initSubjectsAndUnits");
const addUnit1_1Exercises = require("../utils/addUnit1_1Exercises");
const addGeometryExercises = require("../utils/addGeometryExercises");
const initUnitContent = require("../utils/initUnitContent");
const initGeometryUnitContent = require("../utils/initGeometryUnitContent");
const seedAdminData = require("../utils/seedAdminData");
const initKnowledgePoints = require("../utils/initKnowledgePoints");

/**
 * 重置数据库并重新初始化数据
 */
const initDatabase = async (options = {}) => {
  const { 
    includeAdminData = true,
    includeKnowledgePoints = true,
    force = false 
  } = options;
  
  try {
    console.log("🚀 开始初始化数据库...");
    console.log(`配置: Admin数据=${includeAdminData}, 知识点=${includeKnowledgePoints}, 强制重建=${force}`);

    // 同步数据库模型
    if (force) {
      await sequelize.sync({ force: true });
      console.log("✅ 数据库表结构已重置");
    } else {
      await sequelize.sync({ alter: true });
      console.log("✅ 数据库表结构已同步");
    }

    // 初始化App端数据
    console.log("\n📱 初始化App端数据...");
    await initSubjectsAndUnits();
    await addUnit1_1Exercises();
    await addGeometryExercises();
    await initUnitContent();
    await initGeometryUnitContent();
    console.log("✅ App端数据初始化完成");

    // 初始化Admin端数据
    if (includeAdminData) {
      console.log("\n👤 初始化Admin端数据...");
      await seedAdminData();
      console.log("✅ Admin端数据初始化完成");
    }

    // 初始化知识点
    if (includeKnowledgePoints) {
      console.log("\n📚 初始化知识点数据...");
      await initKnowledgePoints();
      console.log("✅ 知识点数据初始化完成");
    }

    console.log("\n🎉 数据库初始化完成！");
    console.log("==============================================");
    console.log("✓ 数据库模型同步");
    console.log("✓ 学科和单元数据");
    console.log("✓ 练习题数据");
    console.log("✓ 单元内容数据");
    if (includeAdminData) console.log("✓ 管理员和教师账户");
    if (includeKnowledgePoints) console.log("✓ 知识点数据和关联关系");
    console.log("==============================================");
  } catch (error) {
    console.error("❌ 数据库初始化出错:", error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  // 从命令行参数解析选项
  const args = process.argv.slice(2);
  const options = {
    includeAdminData: !args.includes('--no-admin'),
    includeKnowledgePoints: !args.includes('--no-knowledge'),
    force: args.includes('--force')
  };
  
  initDatabase(options)
    .then(() => {
      console.log("初始化脚本执行完毕");
      process.exit(0);
    })
    .catch((err) => {
      console.error("初始化脚本执行失败:", err);
      process.exit(1);
    });
}

module.exports = initDatabase; 