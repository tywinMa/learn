const bcrypt = require('bcrypt');
const { User, Subject, Course } = require('../models');
const sequelize = require('../config/database');

const seedData = async () => {
  try {
    // 开始事务
    const t = await sequelize.transaction();
    
    try {
      // 创建用户（使用单独的create以触发钩子函数）
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

      // 创建学科
      console.log('开始创建学科...');
      const subjects = await Subject.bulkCreate([
        {
          name: '语文',
          code: 'CN',
          description: '中文语言文学课程',
          color: '#e74c3c' // 红色
        },
        {
          name: '数学',
          code: 'MATH',
          description: '数学基础与应用课程',
          color: '#3498db' // 蓝色
        },
        {
          name: '英语',
          code: 'EN',
          description: '英语语言学习课程',
          color: '#2ecc71' // 绿色
        },
        {
          name: '物理',
          code: 'PHYS',
          description: '物理科学课程',
          color: '#9b59b6' // 紫色
        },
        {
          name: '化学',
          code: 'CHEM',
          description: '化学科学课程',
          color: '#f39c12' // 橙色
        },
        {
          name: '生物',
          code: 'BIO',
          description: '生物科学课程',
          color: '#27ae60' // 深绿色
        },
        {
          name: '历史',
          code: 'HIST',
          description: '历史文化课程',
          color: '#8e44ad' // 深紫色
        },
        {
          name: '地理',
          code: 'GEO',
          description: '地理科学课程',
          color: '#16a085' // 青绿色
        },
        {
          name: '政治',
          code: 'POL',
          description: '政治思想教育课程',
          color: '#e67e22' // 深橙色
        },
        {
          name: '体育',
          code: 'PE',
          description: '体育健康课程',
          color: '#34495e' // 深灰色
        },
        {
          name: '音乐',
          code: 'MUS',
          description: '音乐艺术课程',
          color: '#f1c40f' // 黄色
        },
        {
          name: '美术',
          code: 'ART',
          description: '美术绘画课程',
          color: '#e91e63' // 粉红色
        }
      ], { transaction: t });

      console.log('学科数据已添加，共', subjects.length, '个学科');

      // 创建课程
      console.log('开始创建课程...');
      const courses = await Course.bulkCreate([
        {
          courseCode: 'CN101',
          name: '语文基础',
          description: '中文基础知识与表达能力培养',
          credits: 3,
          hours: 48,
          isVisible: true,
          subjectId: 1, // 语文
          teacherId: 2
        },
        {
          courseCode: 'CN201',
          name: '现代文阅读',
          description: '现代文学作品阅读与理解',
          credits: 3,
          hours: 48,
          isVisible: true,
          subjectId: 1, // 语文
          teacherId: 2
        },
        {
          courseCode: 'MATH101',
          name: '高等数学',
          description: '微积分基础',
          credits: 5,
          hours: 80,
          isVisible: true,
          subjectId: 2, // 数学
          teacherId: 3
        },
        {
          courseCode: 'MATH201',
          name: '线性代数',
          description: '线性代数基础理论与应用',
          credits: 4,
          hours: 64,
          isVisible: true,
          subjectId: 2, // 数学
          teacherId: 3
        },
        {
          courseCode: 'EN101',
          name: '基础英语',
          description: '英语语法与词汇基础',
          credits: 3,
          hours: 48,
          isVisible: true,
          subjectId: 3, // 英语
          teacherId: 2
        },
        {
          courseCode: 'EN201',
          name: '英语听说',
          description: '英语听力与口语训练',
          credits: 3,
          hours: 48,
          isVisible: true,
          subjectId: 3, // 英语
          teacherId: 3
        },
        {
          courseCode: 'PHYS101',
          name: '基础物理',
          description: '物理学基本概念与原理',
          credits: 4,
          hours: 64,
          isVisible: true,
          subjectId: 4, // 物理
          teacherId: 2
        },
        {
          courseCode: 'CHEM101',
          name: '基础化学',
          description: '化学基本理论与实验',
          credits: 4,
          hours: 64,
          isVisible: true,
          subjectId: 5, // 化学
          teacherId: 3
        }
      ], { transaction: t });

      console.log('课程数据已添加，共', courses.length, '个课程');
      
      // 提交事务
      await t.commit();
      console.log('事务提交成功');
      console.log('数据初始化完成');
      
      // 验证数据
      const userCount = await User.count();
      const subjectCount = await Subject.count();
      const courseCount = await Course.count();
      console.log('验证数据：');
      console.log(`- 用户数量: ${userCount}`);
      console.log(`- 学科数量: ${subjectCount}`);
      console.log(`- 课程数量: ${courseCount}`);
      
    } catch (error) {
      // 回滚事务
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.error('数据初始化失败:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
};

// 如果直接运行此文件，则执行种子数据初始化
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('种子数据初始化完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('种子数据初始化失败:', error);
      process.exit(1);
    });
}

module.exports = seedData; 