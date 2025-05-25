// 用于手动执行数据库迁移的脚本
const setupDatabase = require('./src/setupDatabase');

console.log('开始执行数据库迁移...');

setupDatabase()
  .then(success => {
    if (success) {
      console.log('数据库迁移成功完成');
    } else {
      console.error('数据库迁移失败');
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('数据库迁移过程中发生错误:', error);
    process.exit(1);
  }); 