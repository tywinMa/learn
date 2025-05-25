const sequelize = require('./config/database');
const seedData = require('./utils/seedData');

// 初始化数据库
const setupDatabase = async () => {
  try {
    console.log('开始初始化数据库...');
    
    // 首先连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 获取环境变量
    const env = process.env.NODE_ENV || 'development';
    
    // 检查是否需要同步模型
    console.log('检查数据库表...');
    
    if (env === 'development') {
      // 开发环境：如果数据库文件不存在或为空，则重新创建表
      try {
        // 尝试简单的同步，如果失败则强制重新创建
        await sequelize.sync({ alter: true });
        console.log('数据库模型同步完成（增量模式）');
      } catch (syncError) {
        console.log('增量同步失败，尝试重新创建表...');
        // 关闭外键约束检查
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        await sequelize.sync({ force: true });
        await sequelize.query('PRAGMA foreign_keys = ON;');
        console.log('数据库模型同步完成（强制重建模式）');
      }
      
      // 初始化种子数据
      console.log('开始初始化种子数据...');
      await seedData();
      console.log('种子数据初始化完成');
    } else {
      // 生产环境：只验证连接，不修改表结构
      console.log('生产环境：跳过表结构同步');
    }
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
};

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('数据库设置完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据库设置过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase; 