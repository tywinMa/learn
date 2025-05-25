const path = require('path');
const fs = require('fs');

// 运行迁移脚本
async function runMigrations() {
  console.log('开始执行数据库迁移...');
  
  // 获取迁移目录下的所有JS文件（排除当前文件）
  const migrationFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js') && file !== 'index.js')
    .sort(); // 确保按文件名排序，可以控制迁移顺序
  
  console.log(`找到${migrationFiles.length}个迁移文件`);
  
  // 按顺序执行每个迁移脚本
  for (const migrationFile of migrationFiles) {
    console.log(`\n执行迁移: ${migrationFile}`);
    try {
      // 导入迁移模块
      const migrationModule = require(path.join(__dirname, migrationFile));
      
      // 检查模块的导出类型
      if (typeof migrationModule === 'function') {
        // 如果导出的是函数，直接执行
        await migrationModule();
      } else if (migrationModule.run && typeof migrationModule.run === 'function') {
        // 如果导出的是带run方法的对象，执行run方法
        await migrationModule.run();
      } else {
        console.log(`迁移 ${migrationFile} 没有可执行的函数或run方法，跳过`);
        continue;
      }
      
      console.log(`迁移 ${migrationFile} 执行成功`);
    } catch (error) {
      console.error(`迁移 ${migrationFile} 执行失败:`, error);
      throw error;  // 向上传递错误，让调用方决定是否终止
    }
  }
  
  console.log('\n所有迁移执行完成');
}

// 如果直接运行此文件，则执行所有迁移
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('迁移过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 