const { User, Subject, Unit, Course, UnitProgress, Exercise, AnswerRecord } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function createTestData() {
  try {
    // 同步数据库
    await sequelize.sync({ force: true });
    console.log('数据库已重置');

    // 创建学科
    const mathSubject = await Subject.create({
      code: 'math',
      name: '数学',
      description: '数学学科'
    });

    const englishSubject = await Subject.create({
      code: 'english',
      name: '英语',
      description: '英语学科'
    });

    // 创建大单元
    const mathUnit = await Unit.create({
      id: 'math-unit-1',
      title: '数学基础',
      subject: 'math',
      description: '数学基础单元'
    });

    const englishUnit = await Unit.create({
      id: 'english-unit-1',
      title: '英语基础',
      subject: 'english',
      description: '英语基础单元'
    });

    // 创建小单元（课程）
    const mathCourse1 = await Course.create({
      id: 'math-course-1',
      title: '加法运算',
      subject: 'math',
      unitId: 'math-unit-1',
      description: '学习加法运算'
    });

    const mathCourse2 = await Course.create({
      id: 'math-course-2',
      title: '减法运算',
      subject: 'math',
      unitId: 'math-unit-1',
      description: '学习减法运算'
    });

    const englishCourse1 = await Course.create({
      id: 'english-course-1',
      title: '基础词汇',
      subject: 'english',
      unitId: 'english-unit-1',
      description: '学习基础词汇'
    });

    // 创建测试用户
    const testUser = await User.create({
      username: 'test-user-1',
      name: '测试学生',
      email: 'test@example.com',
      password: 'password123'
    });

    // 创建练习题
    const exercise1 = await Exercise.create({
      id: 'exercise-1',
      title: '基础加法运算',
      question: '1+1等于多少？',
      type: 'choice',
      subject: 'math',
      unitId: 'math-course-1',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      difficulty: 1
    });

    const exercise2 = await Exercise.create({
      id: 'exercise-2',
      title: '基础减法运算',
      question: '3-1等于多少？',
      type: 'choice',
      subject: 'math',
      unitId: 'math-course-2',
      options: ['1', '2', '3', '4'],
      correctAnswer: '2',
      difficulty: 1
    });

    const exercise3 = await Exercise.create({
      id: 'exercise-3',
      title: '基础英语词汇',
      question: 'Apple的中文意思是？',
      type: 'choice',
      subject: 'english',
      unitId: 'english-course-1',
      options: ['苹果', '香蕉', '橙子', '梨'],
      correctAnswer: '苹果',
      difficulty: 1
    });

    // 创建学习进度
    await UnitProgress.create({
      userId: testUser.id,
      unitId: 'math-course-1',
      completed: true,
      stars: 3,
      studyCount: 5,
      practiceCount: 10,
      correctCount: 8,
      incorrectCount: 2,
      totalAnswerCount: 10,
      totalTimeSpent: 1800, // 30分钟
      masteryLevel: 0.8,
      lastStudyTime: new Date(),
      lastPracticeTime: new Date()
    });

    await UnitProgress.create({
      userId: testUser.id,
      unitId: 'math-course-2',
      completed: false,
      stars: 1,
      studyCount: 3,
      practiceCount: 5,
      correctCount: 3,
      incorrectCount: 2,
      totalAnswerCount: 5,
      totalTimeSpent: 900, // 15分钟
      masteryLevel: 0.6,
      lastStudyTime: new Date(),
      lastPracticeTime: new Date()
    });

    await UnitProgress.create({
      userId: testUser.id,
      unitId: 'english-course-1',
      completed: true,
      stars: 2,
      studyCount: 4,
      practiceCount: 8,
      correctCount: 6,
      incorrectCount: 2,
      totalAnswerCount: 8,
      totalTimeSpent: 1200, // 20分钟
      masteryLevel: 0.75,
      lastStudyTime: new Date(),
      lastPracticeTime: new Date()
    });

    // 创建答题记录
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // 正确答题记录
    await AnswerRecord.create({
      userId: testUser.id,
      exerciseId: 'exercise-1',
      unitId: 'math-course-1',
      subject: 'math',
      isCorrect: true,
      userAnswer: '2',
      correctAnswer: '2',
      responseTime: 15,
      submitTime: now,
      practiceMode: 'normal',
      exerciseType: 'choice'
    });

    // 错误答题记录
    await AnswerRecord.create({
      userId: testUser.id,
      exerciseId: 'exercise-2',
      unitId: 'math-course-2',
      subject: 'math',
      isCorrect: false,
      isWrongAnswer: true,
      userAnswer: '1',
      correctAnswer: '2',
      responseTime: 20,
      submitTime: yesterday,
      practiceMode: 'normal',
      exerciseType: 'choice',
      wrongAnswerType: 'calculation'
    });

    await AnswerRecord.create({
      userId: testUser.id,
      exerciseId: 'exercise-2',
      unitId: 'math-course-2',
      subject: 'math',
      isCorrect: false,
      isWrongAnswer: true,
      userAnswer: '3',
      correctAnswer: '2',
      responseTime: 18,
      submitTime: twoDaysAgo,
      practiceMode: 'normal',
      exerciseType: 'choice',
      wrongAnswerType: 'careless'
    });

    await AnswerRecord.create({
      userId: testUser.id,
      exerciseId: 'exercise-3',
      unitId: 'english-course-1',
      subject: 'english',
      isCorrect: false,
      isWrongAnswer: true,
      userAnswer: '香蕉',
      correctAnswer: '苹果',
      responseTime: 25,
      submitTime: yesterday,
      practiceMode: 'normal',
      exerciseType: 'choice',
      wrongAnswerType: 'concept'
    });

    console.log('测试数据创建完成！');
    console.log('测试用户ID:', testUser.id);
    console.log('可以使用这个ID来测试进度查看功能');

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

createTestData(); 