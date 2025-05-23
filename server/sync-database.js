const { sequelize } = require('./src/config/database');
const Exercise = require('./src/models/Exercise');

async function syncDatabase() {
  try {
    console.log('开始同步数据库模型...');
    
    // 同步所有模型到数据库，alter: true 会更新现有表结构
    await sequelize.sync({ alter: true });
    
    console.log('数据库模型同步完成！');
    console.log('已为 Exercise 模型添加 knowledgePoints 字段');
    
    process.exit(0);
  } catch (error) {
    console.error('同步数据库时出错:', error);
    process.exit(1);
  }
}

syncDatabase(); 