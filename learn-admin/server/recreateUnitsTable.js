const sequelize = require('./src/config/database');
const Unit = require('./src/models/unit');

async function recreateUnitsTable() {
  try {
    console.log('开始重新创建单元表...');
    
    // 强制同步，这会删除现有表并重新创建
    await Unit.sync({ force: true });
    console.log('单元表重新创建成功');
    
    // 添加示例数据
    const sampleUnits = [
      {
        id: '1-1',
        subject: 'MATH',
        title: '数学基础',
        description: '数学基础概念和原理',
        content: '这是数学基础单元的内容，包含基本的数学概念。',
        media: {
          images: ['math1.jpg'],
          videos: ['math_intro.mp4']
        },
        parentId: null,
        level: 1,
        order: 1,
        isPublished: true,
        color: '#1890ff',
        secondaryColor: '#f0f9ff',
        unitType: 'normal',
        position: 'default',
        isMajor: true
      },
      {
        id: '1-2', 
        subject: 'MATH',
        title: '代数入门',
        description: '代数的基本概念和运算',
        content: '这是代数入门单元，学习变量、表达式等概念。',
        media: {
          images: ['algebra1.jpg'],
          videos: ['algebra_intro.mp4']
        },
        parentId: '1-1',
        level: 2,
        order: 1,
        isPublished: true,
        color: '#52c41a',
        secondaryColor: '#f6ffed',
        unitType: 'normal',
        position: 'left',
        isMajor: false
      },
      {
        id: '1-3',
        subject: 'MATH', 
        title: '几何基础',
        description: '平面几何的基本概念',
        content: '这是几何基础单元，学习点、线、面等基本几何概念。',
        media: {
          images: ['geometry1.jpg'],
          videos: ['geometry_intro.mp4']
        },
        parentId: '1-1',
        level: 2,
        order: 2,
        isPublished: true,
        color: '#722ed1',
        secondaryColor: '#f9f0ff',
        unitType: 'normal',
        position: 'right',
        isMajor: false
      },
      {
        id: '1-4',
        subject: 'MATH',
        title: '数学练习',
        description: '数学基础练习题',
        content: '这是数学练习单元，包含各种练习题目。',
        media: {
          images: ['math_exercise.jpg']
        },
        parentId: null,
        level: 1,
        order: 2,
        isPublished: true,
        color: '#fa8c16',
        secondaryColor: '#fff7e6',
        unitType: 'exercise',
        position: 'default',
        isMajor: false
      },
      {
        id: '2-1',
        subject: 'CN',
        title: '语文基础',
        description: '语文基础知识和阅读理解',
        content: '这是语文基础单元，学习汉字、词汇和基本语法。',
        media: {
          images: ['chinese1.jpg'],
          videos: ['chinese_intro.mp4']
        },
        parentId: null,
        level: 1,
        order: 1,
        isPublished: true,
        color: '#eb2f96',
        secondaryColor: '#fff0f6',
        unitType: 'normal',
        position: 'default',
        isMajor: true
      }
    ];
    
    await Unit.bulkCreate(sampleUnits);
    console.log('示例数据添加成功');
    
    console.log('重新创建单元表完成！');
  } catch (error) {
    console.error('重新创建单元表失败:', error);
  } finally {
    await sequelize.close();
  }
}

recreateUnitsTable(); 