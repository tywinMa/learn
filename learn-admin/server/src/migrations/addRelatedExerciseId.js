const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('../config/config');
const fs = require('fs');

// 获取数据库配置
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env].database;

// 创建一个新的Sequelize实例用于迁移
const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  logging: console.log
});

// 主迁移函数
async function addRelatedExerciseIdField() {
  try {
    console.log('开始添加关联习题ID字段...');
    
    // 1. 检查数据库文件是否存在
    if (!fs.existsSync(dbConfig.storage)) {
      console.error('数据库文件不存在:', dbConfig.storage);
      return false;
    }
    
    // 2. 连接到数据库
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 3. 查询当前课程表结构
    const [courseTableInfo] = await sequelize.query(
      "PRAGMA table_info(Courses);"
    );
    
    // 4. 检查related_exercise_id字段是否已存在
    const relatedExerciseIdExists = courseTableInfo.some(
      column => column.name === 'related_exercise_id' || column.name === 'relatedExerciseId'
    );
    
    if (relatedExerciseIdExists) {
      console.log('关联习题ID字段已存在，无需添加');
      return true;
    }
    
    // 5. 添加related_exercise_id字段
    console.log('添加关联习题ID字段到课程表...');
    await sequelize.query(
      "ALTER TABLE Courses ADD COLUMN related_exercise_id TEXT;"
    );
    
    console.log('关联习题ID字段添加成功');
    return true;
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    return false;
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 导出迁移函数，使其符合迁移系统的要求
module.exports = addRelatedExerciseIdField;

// 如果直接运行此文件，则执行迁移
if (require.main === module) {
  addRelatedExerciseIdField()
    .then((success) => {
      if (success) {
        console.log('关联习题ID字段迁移完成');
        process.exit(0);
      } else {
        console.error('关联习题ID字段迁移失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('迁移过程中发生未处理的错误:', error);
      process.exit(1);
    });
} 