const sequelize = require('../config/database');

/**
 * 移除exercises表中不再需要的老字段
 */
async function removeOldFields() {
  console.log('开始执行迁移: 移除老字段');
  
  try {
    // SQLite不支持直接删除列，需要重建表
    console.log('SQLite不支持直接删除列，开始重建表...');
    
    // 1. 创建新表结构
    await sequelize.query(`
      CREATE TABLE exercises_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exercise_code TEXT UNIQUE,
        title TEXT,
        description TEXT,
        subject TEXT,
        author TEXT,
        content TEXT,
        unit_id INTEGER,
        course_id INTEGER,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        FOREIGN KEY (unit_id) REFERENCES Units (id),
        FOREIGN KEY (course_id) REFERENCES Courses (id)
      );
    `, { type: sequelize.QueryTypes.RAW });
    
    console.log('新表结构创建成功');
    
    // 2. 复制数据到新表
    await sequelize.query(`
      INSERT INTO exercises_new (
        id, exercise_code, title, description, subject, author, content,
        unit_id, course_id, created_at, updated_at
      )
      SELECT 
        id, exercise_code, title, description, subject, author, content,
        unit_id, course_id, created_at, updated_at
      FROM exercises;
    `, { type: sequelize.QueryTypes.RAW });
    
    console.log('数据复制完成');
    
    // 3. 删除旧表
    await sequelize.query('DROP TABLE exercises;', { type: sequelize.QueryTypes.RAW });
    console.log('旧表删除成功');
    
    // 4. 重命名新表
    await sequelize.query('ALTER TABLE exercises_new RENAME TO exercises;', { type: sequelize.QueryTypes.RAW });
    console.log('表重命名完成');
    
    console.log('老字段移除完成');
    return true;
  } catch (error) {
    console.error('迁移执行失败:', error);
    throw error;
  }
}

module.exports = removeOldFields; 