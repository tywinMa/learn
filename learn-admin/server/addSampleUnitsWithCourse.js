const sequelize = require('./src/config/database');
const { Unit, Course, Subject } = require('./src/models');

async function addSampleUnits() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取现有的课程和学科数据
    const courses = await Course.findAll({
      include: [
        { model: Subject, as: 'subject' }
      ]
    });
    
    console.log(`找到 ${courses.length} 个课程`);
    
    if (courses.length === 0) {
      console.log('没有找到课程数据，请先创建课程');
      return;
    }

    // 示例单元数据
    const sampleUnits = [
      // 数学单元
      {
        id: 'math-basic-1',
        subject: 'MATH',
        title: '函数基础概念',
        description: '学习函数的基本概念和性质',
        content: '函数是数学中的重要概念，描述了两个集合之间的对应关系...',
        level: 1,
        order: 1,
        unitType: 'normal',
        position: 'default',
        isMajor: true,
        isPublished: true,
        color: '#1890ff',
        secondaryColor: '#f0f9ff'
      },
      {
        id: 'math-basic-2',
        subject: 'MATH',
        title: '导数的计算',
        description: '掌握导数的基本计算方法',
        content: '导数是函数在某一点的变化率，是微积分的核心概念...',
        level: 2,
        order: 1,
        parentId: 'math-basic-1',
        unitType: 'normal',
        position: 'default',
        isMajor: false,
        isPublished: true,
        color: '#52c41a',
        secondaryColor: '#f6ffed'
      },
      // 语文单元
      {
        id: 'cn-reading-1',
        subject: 'CN',
        title: '现代文阅读技巧',
        description: '提升现代文阅读理解能力',
        content: '现代文阅读是语文学习的重要组成部分...',
        level: 1,
        order: 1,
        unitType: 'normal',
        position: 'default',
        isMajor: true,
        isPublished: true,
        color: '#fa541c',
        secondaryColor: '#fff2e8'
      },
      // 英语单元
      {
        id: 'eng-listening-1',
        subject: 'ENG',
        title: '英语听力训练基础',
        description: '英语听力技能的基础训练',
        content: '英语听力是语言学习的重要技能...',
        level: 1,
        order: 1,
        unitType: 'normal',
        position: 'default',
        isMajor: true,
        isPublished: true,
        color: '#722ed1',
        secondaryColor: '#f9f0ff'
      }
    ];

    // 为每个单元分配相应学科的第一个课程
    for (const unitData of sampleUnits) {
      // 找到对应学科的第一个课程
      const matchingCourse = courses.find(course => 
        course.subject && course.subject.code === unitData.subject
      );
      
      if (matchingCourse) {
        unitData.courseId = matchingCourse.id;
        console.log(`为单元 ${unitData.title} 分配课程: ${matchingCourse.name} (ID: ${matchingCourse.id})`);
      } else {
        console.log(`警告: 未找到学科 ${unitData.subject} 对应的课程`);
      }
    }

    // 删除现有的示例单元数据
    await Unit.destroy({
      where: {
        id: sampleUnits.map(unit => unit.id)
      }
    });
    console.log('已删除现有示例数据');

    // 批量创建单元
    const createdUnits = await Unit.bulkCreate(sampleUnits);
    console.log(`成功创建 ${createdUnits.length} 个单元`);

    // 验证创建的数据
    const allUnits = await Unit.findAll({
      include: [
        { model: Course, as: 'course' }
      ]
    });
    
    console.log('\n单元数据验证:');
    allUnits.forEach(unit => {
      console.log(`- ${unit.title} (${unit.subject}) - 课程: ${unit.course ? unit.course.name : '无'}`);
    });

    console.log('\n示例单元数据添加完成!');
  } catch (error) {
    console.error('添加示例单元数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 执行脚本
addSampleUnits(); 