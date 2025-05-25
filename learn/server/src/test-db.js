const { testConnection } = require('./config/database');
const initDatabase = require('./database/init');
const { Exercise } = require('./models');

// 测试数据库连接和初始化
const testDatabase = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 初始化数据库
    await initDatabase();
    
    // 查询所有练习题
    const exercises = await Exercise.findAll();
    console.log(`数据库中共有 ${exercises.length} 道练习题`);
    
    // 查询第一单元的练习题
    const unit1Exercises = await Exercise.findAll({
      where: { unitId: '1-1' }
    });
    console.log(`第一单元共有 ${unit1Exercises.length} 道练习题`);
    
    // 显示第一道练习题
    if (unit1Exercises.length > 0) {
      console.log('第一道练习题:');
      console.log(unit1Exercises[0].toJSON());
    }
    
    console.log('数据库测试完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库测试出错:', error);
    process.exit(1);
  }
};

testDatabase();
