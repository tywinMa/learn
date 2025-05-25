const bcrypt = require('bcrypt');
const { User, Subject, Course } = require('../models');
const { sequelize } = require('../config/database');

const seedAdminData = async () => {
  try {
    // 开始事务
    const t = await sequelize.transaction();
    
    try {
      // 检查是否已有用户
      const existingUsers = await User.count({ transaction: t });
      if (existingUsers > 0) {
        console.log('用户数据已存在，跳过用户创建');
      } else {
        // 创建用户
        console.log('开始创建用户...');
        const users = [];
        
        const admin = await User.create({
          username: 'admin',
          password: '123456',
          name: '系统管理员',
          role: 'superadmin',
          email: 'admin@example.com'
        }, { transaction: t });
        users.push(admin);
        console.log('管理员用户创建成功:', admin.id);
        
        const teacher1 = await User.create({
          username: 'teacher',
          password: '123456',
          name: '李老师',
          role: 'teacher',
          email: 'teacher1@example.com'
        }, { transaction: t });
        users.push(teacher1);
        console.log('教师1用户创建成功:', teacher1.id);
        
        const teacher2 = await User.create({
          username: 'teacher2',
          password: 'teacher123',
          name: '王老师',
          role: 'teacher',
          email: 'teacher2@example.com'
        }, { transaction: t });
        users.push(teacher2);
        console.log('教师2用户创建成功:', teacher2.id);

        console.log('用户数据已添加，共', users.length, '个用户');
      }

      // 检查是否需要更新Course模型的teacherId
      const mathCourses = await Course.findAll({ 
        where: { subject: 'math' },
        transaction: t 
      });
      
      if (mathCourses.length > 0) {
        // 获取一个教师用户
        const teacher = await User.findOne({ 
          where: { role: 'teacher' },
          transaction: t 
        });
        
        if (teacher) {
          // 为数学课程分配教师
          for (const course of mathCourses) {
            await course.update({ teacherId: teacher.id }, { transaction: t });
          }
          console.log(`已为 ${mathCourses.length} 个数学课程分配教师`);
        }
      }
      
      // 提交事务
      await t.commit();
      console.log('Admin数据初始化完成');
      
      // 验证数据
      const userCount = await User.count();
      console.log(`验证数据：用户数量: ${userCount}`);
      
    } catch (error) {
      // 回滚事务
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Admin数据初始化失败:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
};

// 如果直接运行此文件
if (require.main === module) {
  seedAdminData()
    .then(() => {
      console.log('Admin种子数据初始化完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('Admin种子数据初始化失败:', error);
      process.exit(1);
    });
}

module.exports = seedAdminData; 