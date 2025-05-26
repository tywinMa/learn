const { sequelize, User, Student, Subject, Unit, Course, Exercise, UnitProgress, AnswerRecord, KnowledgePoint } = require('../src/models');

async function createTestData() {
  try {
    console.log('开始创建测试数据...');

    // 0. 同步数据库
    console.log('同步数据库...');
    await sequelize.sync({ force: true });
    console.log('数据库同步完成');

    // 1. 清理现有数据
    console.log('清理现有数据...');
    try {
      await AnswerRecord.destroy({ where: {} });
      await UnitProgress.destroy({ where: {} });
      await Student.destroy({ where: {} });
      await Exercise.destroy({ where: {} });
      await Course.destroy({ where: {} });
      await Unit.destroy({ where: {} });
      await KnowledgePoint.destroy({ where: {} });
      await Subject.destroy({ where: {} });
      await User.destroy({ where: {} });
    } catch (error) {
      console.log('清理数据时出现错误（可能是表不存在）:', error.message);
    }
    console.log('清理完成');

    // 2. 创建管理员用户
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      name: '系统管理员',
      email: 'admin@example.com',
      role: 'admin'
    });
    console.log('创建管理员用户成功');

    // 3. 创建教师用户
    const teacher = await User.create({
      username: 'teacher1',
      password: 'teacher123',
      name: '张老师',
      email: 'teacher1@example.com',
      role: 'teacher'
    });
    console.log('创建教师用户成功');

    // 4. 创建学科
    const mathSubject = await Subject.create({
      code: 'math',
      name: '数学',
      description: '小学数学课程'
    });

    const englishSubject = await Subject.create({
      code: 'english',
      name: '英语',
      description: '小学英语课程'
    });
    console.log('创建学科成功');

    // 5. 创建大单元
    const mathUnit1 = await Unit.create({
      id: 'math_unit_1',
      title: '数与代数',
      subject: 'math',
      description: '数与代数基础知识'
    });

    const englishUnit1 = await Unit.create({
      id: 'english_unit_1',
      title: '基础词汇',
      subject: 'english',
      description: '英语基础词汇学习'
    });
    console.log('创建大单元成功');

    // 6. 创建小单元（课程）
    const mathCourse1 = await Course.create({
      id: 'math_course_1',
      title: '整数运算',
      subject: 'math',
      unitId: 'math_unit_1',
      teacherId: teacher.id,
      description: '整数的加减乘除运算'
    });

    const mathCourse2 = await Course.create({
      id: 'math_course_2',
      title: '分数运算',
      subject: 'math',
      unitId: 'math_unit_1',
      teacherId: teacher.id,
      description: '分数的基本运算'
    });

    const englishCourse1 = await Course.create({
      id: 'english_course_1',
      title: '日常用词',
      subject: 'english',
      unitId: 'english_unit_1',
      teacherId: teacher.id,
      description: '日常生活常用英语单词'
    });
    console.log('创建课程成功');

    // 7. 创建知识点
    const knowledgePoints = [];
    
    // 数学知识点
    const mathKnowledgePoints = [
      { title: '整数加法', content: '整数的加法运算规则和技巧', subject: 'math', difficulty: 1 },
      { title: '整数减法', content: '整数的减法运算规则和技巧', subject: 'math', difficulty: 1 },
      { title: '整数乘法', content: '整数的乘法运算规则和技巧', subject: 'math', difficulty: 2 },
      { title: '整数除法', content: '整数的除法运算规则和技巧', subject: 'math', difficulty: 2 },
      { title: '分数的概念', content: '分数的基本概念和表示方法', subject: 'math', difficulty: 2 },
      { title: '分数加法', content: '同分母和异分母分数的加法', subject: 'math', difficulty: 3 },
      { title: '分数减法', content: '同分母和异分母分数的减法', subject: 'math', difficulty: 3 },
      { title: '分数乘法', content: '分数乘法的运算规则', subject: 'math', difficulty: 3 },
      { title: '分数除法', content: '分数除法的运算规则', subject: 'math', difficulty: 4 },
      { title: '混合运算', content: '整数和分数的混合运算', subject: 'math', difficulty: 4 }
    ];
    
    // 英语知识点
    const englishKnowledgePoints = [
      { title: '水果单词', content: '常见水果的英语单词', subject: 'english', difficulty: 1 },
      { title: '动物单词', content: '常见动物的英语单词', subject: 'english', difficulty: 1 },
      { title: '学习用品', content: '学习用品的英语单词', subject: 'english', difficulty: 1 },
      { title: '颜色单词', content: '基本颜色的英语单词', subject: 'english', difficulty: 1 },
      { title: '数字单词', content: '1-100的英语数字表达', subject: 'english', difficulty: 2 },
      { title: '家庭成员', content: '家庭成员的英语称呼', subject: 'english', difficulty: 2 },
      { title: '日常用语', content: '日常生活常用英语表达', subject: 'english', difficulty: 2 },
      { title: '问候语', content: '英语问候和告别用语', subject: 'english', difficulty: 1 },
      { title: '时间表达', content: '英语时间的表达方法', subject: 'english', difficulty: 3 },
      { title: '简单句型', content: '基础英语句型结构', subject: 'english', difficulty: 3 }
    ];
    
    // 创建数学知识点
    for (const kpData of mathKnowledgePoints) {
      const kp = await KnowledgePoint.create(kpData);
      knowledgePoints.push(kp);
    }
    
    // 创建英语知识点
    for (const kpData of englishKnowledgePoints) {
      const kp = await KnowledgePoint.create(kpData);
      knowledgePoints.push(kp);
    }
    
    console.log('创建知识点成功');

    // 8. 创建练习题
    const exercises = [];
    
    // 数学题目
    for (let i = 1; i <= 10; i++) {
      const exercise = await Exercise.create({
        id: `math_ex_${i}`,
        title: `数学计算题${i} - 整数加法运算`,
        question: `计算: ${i} + ${i * 2} = ?`,
        type: 'choice',
        subject: 'math',
        unitId: 'math_course_1',
        options: [
          { content: `${i + i * 2}`, isCorrect: true },
          { content: `${i + i * 2 + 1}`, isCorrect: false },
          { content: `${i + i * 2 - 1}`, isCorrect: false },
          { content: `${i * 2}`, isCorrect: false }
        ],
        correctAnswer: [`${i + i * 2}`],
        difficulty: Math.floor(Math.random() * 5) + 1
      });
      exercises.push(exercise);
    }

    // 英语题目
    const words = ['apple', 'book', 'cat', 'dog', 'elephant'];
    const wordTitles = ['苹果', '书本', '猫咪', '小狗', '大象'];
    const answers = ['苹果', '书', '猫', '狗', '大象'];
    for (let i = 0; i < words.length; i++) {
      const exercise = await Exercise.create({
        id: `english_ex_${i + 1}`,
        title: `英语单词${i + 1} - ${wordTitles[i]}的英文`,
        question: `What does "${words[i]}" mean in Chinese?`,
        type: 'choice',
        subject: 'english',
        unitId: 'english_course_1',
        options: [
          { content: '苹果', isCorrect: i === 0 },
          { content: '书', isCorrect: i === 1 },
          { content: '猫', isCorrect: i === 2 },
          { content: '狗', isCorrect: i === 3 },
          { content: '大象', isCorrect: i === 4 }
        ],
        correctAnswer: [answers[i]],
        difficulty: Math.floor(Math.random() * 3) + 1
      });
      exercises.push(exercise);
    }
    console.log('创建练习题成功');

    // 9. 创建学生
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const student = await Student.create({
        studentId: `student${i}`,
        password: 'student123',
        name: `学生${i}`,
        email: `student${i}@example.com`,
        grade: '三年级',
        school: '实验小学',
        teacherId: teacher.id,
        totalPoints: Math.floor(Math.random() * 1000),
        currentLevel: Math.floor(Math.random() * 5) + 1,
        totalStudyTime: Math.floor(Math.random() * 10000)
      });
      students.push(student);
    }
    console.log('创建学生成功');

    // 10. 创建学习进度记录
    for (const student of students) {
      // 为每个学生创建课程进度
      const courses = [mathCourse1, mathCourse2, englishCourse1];
      
      for (const course of courses) {
        const progress = await UnitProgress.create({
          studentId: student.id,
          unitId: course.id,
          completed: Math.random() > 0.3,
          stars: Math.floor(Math.random() * 4),
          studyCount: Math.floor(Math.random() * 20) + 1,
          practiceCount: Math.floor(Math.random() * 30) + 1,
          correctCount: Math.floor(Math.random() * 50) + 10,
          incorrectCount: Math.floor(Math.random() * 20),
          totalAnswerCount: Math.floor(Math.random() * 70) + 30,
          totalTimeSpent: Math.floor(Math.random() * 3600) + 600,
          masteryLevel: Math.random(),
          averageResponseTime: Math.random() * 30 + 5,
          lastStudyTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          lastPracticeTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }
    }
    console.log('创建学习进度记录成功');

    // 11. 创建答题记录
    for (const student of students) {
      // 为每个学生创建50-100条答题记录
      const recordCount = Math.floor(Math.random() * 50) + 50;
      
      for (let i = 0; i < recordCount; i++) {
        const exercise = exercises[Math.floor(Math.random() * exercises.length)];
        const isCorrect = Math.random() > 0.3; // 70%正确率
        const responseTime = Math.floor(Math.random() * 60) + 5; // 5-65秒
        const submitTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // 过去30天内
        
        // 生成用户答案
        let userAnswer;
        if (isCorrect) {
          userAnswer = exercise.correctAnswer; // 正确答案
        } else {
          // 错误答案：从选项中随机选择一个非正确答案
          const wrongOptions = exercise.options.filter(opt => !opt.isCorrect);
          userAnswer = wrongOptions.length > 0 ? [wrongOptions[0].content] : ['错误答案'];
        }
        
        await AnswerRecord.create({
          studentId: student.id,
          exerciseId: exercise.id,
          unitId: exercise.unitId,
          subject: exercise.subject,
          isCorrect,
          userAnswer,
          correctAnswer: exercise.correctAnswer,
          score: isCorrect ? 100 : 0,
          responseTime,
          submitTime,
          attemptNumber: Math.floor(Math.random() * 3) + 1,
          practiceMode: ['normal', 'review', 'wrong_redo'][Math.floor(Math.random() * 3)],
          isWrongAnswer: !isCorrect,
          wrongAnswerType: !isCorrect ? ['calculation', 'concept', 'careless'][Math.floor(Math.random() * 3)] : null,
          pointsEarned: isCorrect ? Math.floor(Math.random() * 20) + 10 : 0,
          timeOfDay: submitTime.getHours(),
          weekday: submitTime.getDay()
        });
      }
    }
    console.log('创建答题记录成功');

    console.log('测试数据创建完成！');
    console.log(`创建了 ${students.length} 个学生`);
    console.log(`创建了 ${exercises.length} 道练习题`);
    console.log(`创建了 ${knowledgePoints.length} 个知识点`);
    console.log('可以使用以下账号登录：');
    console.log('管理员: admin / admin123');
    console.log('教师: teacher1 / teacher123');
    console.log('学生: student1-student5 / student123');

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createTestData();
}

module.exports = createTestData; 