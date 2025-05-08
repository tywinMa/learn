const { sequelize } = require('../config/database');
const addUnit1_1Exercises = require('./addUnit1_1Exercises');

/**
 * 重置数据库并重新初始化数据
 */
const initData = async () => {
  try {
    console.log('开始初始化数据...');
    
    // 同步数据库模型（重建表结构）
    await sequelize.sync({ force: true });
    console.log('数据库表结构已重置');
    
    // 添加单元1-1的练习题
    await addUnit1_1Exercises();
    
    console.log('数据初始化完成！');
  } catch (error) {
    console.error('数据初始化出错:', error);
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