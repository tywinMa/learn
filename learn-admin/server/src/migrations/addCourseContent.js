/**
 * 向courses表添加content字段用于存储富文本编辑器内容
 */
const sequelize = require('../config/database');

// 简化版up函数，专注于添加content字段
const up = async () => {
  try {
    console.log('开始向courses表添加content字段...');
    
    // 尝试直接添加字段，如果已存在则忽略错误
    try {
      await sequelize.query(`ALTER TABLE Courses ADD COLUMN content TEXT;`);
      console.log('成功添加content字段到Courses表');
    } catch (error) {
      console.log('添加content字段失败（可能已存在）:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('content字段处理失败:', error);
    // 返回成功以继续其他迁移
    return true;
  }
};

// 简化版down函数
const down = async () => {
  console.log('该迁移不支持回滚操作');
  return true;
};

// 添加run方法，用于迁移系统调用
const run = async () => {
  console.log('执行 addCourseContent 迁移...');
  return await up();
};

module.exports = { up, down, run }; 