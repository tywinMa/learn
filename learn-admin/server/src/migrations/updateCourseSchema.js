const { Sequelize, DataTypes } = require('sequelize');
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
async function migrateCourseTable() {
  try {
    console.log('开始迁移课程表结构...');
    
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
    
    // 检查sources字段是否已存在
    const sourcesExists = courseTableInfo.some(column => column.name === 'sources');
    if (sourcesExists) {
      console.log('sources字段已存在，无需迁移');
      return true;
    }
    
    // 4. 检查旧字段是否存在
    const coverImageExists = courseTableInfo.some(column => column.name === 'cover_image');
    const videoUrlExists = courseTableInfo.some(column => column.name === 'video_url');
    
    if (!coverImageExists && !videoUrlExists) {
      console.log('旧字段不存在，直接添加sources字段');
      await sequelize.query(
        "ALTER TABLE Courses ADD COLUMN sources TEXT;"
      );
      console.log('已添加sources字段');
      return true;
    }
    
    // 5. 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      // 6. 获取所有课程数据
      const [courses] = await sequelize.query(
        "SELECT id, cover_image, video_url FROM Courses;",
        { transaction }
      );
      
      // 7. 添加sources字段
      await sequelize.query(
        "ALTER TABLE Courses ADD COLUMN sources TEXT;",
        { transaction }
      );
      
      // 8. 迁移数据
      for (const course of courses) {
        const sources = [];
        
        if (course.cover_image) {
          sources.push({ type: 'image', url: course.cover_image });
        }
        
        if (course.video_url) {
          sources.push({ type: 'video', url: course.video_url });
        }
        
        if (sources.length > 0) {
          await sequelize.query(
            `UPDATE Courses SET sources = ? WHERE id = ?;`,
            {
              replacements: [JSON.stringify(sources), course.id],
              transaction
            }
          );
        }
      }
      
      // 9. 提交事务
      await transaction.commit();
      console.log('数据迁移成功');
      
      // 10. 在另一个事务中移除旧字段
      // 注意：SQLite不支持在ALTER TABLE中DROP COLUMN，因此我们需要使用其他方法
      // 为简化操作，我们可以保留旧字段，但不再使用它们
      console.log('旧字段将保留但不再使用，数据已迁移到sources字段');
      return true;
      
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      console.error('迁移失败:', error);
      return false;
    }
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
    return false;
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 导出迁移函数，使其符合迁移系统的要求
module.exports = migrateCourseTable;

// 如果直接运行此文件，则执行迁移
if (require.main === module) {
  migrateCourseTable()
    .then((success) => {
      if (success) {
        console.log('课程表结构迁移完成');
        process.exit(0);
      } else {
        console.error('课程表结构迁移失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('迁移过程中发生未处理的错误:', error);
      process.exit(1);
    });
}