const sequelize = require('../config/database');

/**
 * 为exercises表添加author字段的迁移
 */
async function addAuthorField() {
  console.log('开始执行迁移: 添加作者字段');
  
  try {
    // 获取表结构信息
    const tableInfo = await sequelize.query(
      "PRAGMA table_info(exercises);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('当前exercises表结构:', tableInfo.map(col => col.name));
    
    // 检查author字段是否已存在
    const hasAuthor = tableInfo.some(column => column.name === 'author');
    if (!hasAuthor) {
      console.log('添加author字段...');
      await sequelize.query(
        "ALTER TABLE exercises ADD COLUMN author TEXT;",
        { type: sequelize.QueryTypes.RAW }
      );
      console.log('author字段添加成功');
    } else {
      console.log('author字段已存在，跳过添加');
    }
    
    console.log('作者字段迁移完成');
    return true;
  } catch (error) {
    console.error('迁移执行失败:', error);
    throw error;
  }
}

module.exports = addAuthorField; 