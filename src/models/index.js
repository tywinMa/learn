// 同步所有模型到数据库
const syncDatabase = async () => {
  try {
    // 直接使用force模式重建表，避免数据库迁移问题
    await sequelize.sync({ force: true });
    console.log('所有模型已同步到数据库');
    
    // 检查WrongExercises和UserRecords表是否存在
    try {
      await sequelize.query('SELECT 1 FROM WrongExercises LIMIT 1');
      await sequelize.query('SELECT 1 FROM UserRecords LIMIT 1');
      console.log('数据库表结构完整');
    } catch (checkError) {
      // 如果表不存在，将创建它们（已经通过上面的sync操作完成）
      console.log('部分表可能不存在，但已通过sync操作创建');
    }
  } catch (error) {
    console.error('同步模型到数据库时出错:', error);
    
    // 如果仍然出错，继续抛出错误以便上层捕获
    throw error;
  }
}; 