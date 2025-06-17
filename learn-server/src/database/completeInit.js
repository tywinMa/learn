const { sequelize } = require("../config/database");
const { Subject, Unit, Course, Exercise, ExerciseGroup, User, KnowledgePoint, Student, Grade, SubjectGrade } = require("../models");

/**
 * 完整的数据库初始化脚本
 * 基于新架构：习题独立存在只关联学科，通过习题组组织，课程通过exerciseGroupIds关联习题组
 */
const completeInit = async (options = {}) => {
  const { 
    includeAdminData = true,
    includeKnowledgePoints = true,
    force = true 
  } = options;
  
  try {
    console.log("🚀 开始完整数据库初始化...");
    console.log(`配置: Admin数据=${includeAdminData}, 知识点=${includeKnowledgePoints}, 强制重建=${force}`);

    // 1. 同步数据库模型
    if (force) {
      await sequelize.sync({ force: true });
      console.log("✅ 数据库表结构已重置");
    } else {
      await sequelize.sync({ alter: true });
      console.log("✅ 数据库表结构已同步");
    }

    // 2. 初始化学科数据
    console.log("\n📚 初始化学科数据...");
    const subjects = await initSubjects();
    console.log(`✅ 创建学科: ${subjects.length}个`);

    // 3. 初始化年级数据
    console.log("\n🏫 初始化年级数据...");
    const grades = await initGrades();
    console.log(`✅ 创建年级: ${grades.length}个`);

    // 4. 初始化学科年级关联数据
    console.log("\n🔗 初始化学科年级关联...");
    const subjectGrades = await initSubjectGrades(subjects, grades);
    console.log(`✅ 创建学科年级关联: ${subjectGrades.length}个`);

    // 5. 初始化单元数据
    console.log("\n📖 初始化单元和课程数据...");
    const { units, courses } = await initUnitsAndCourses(subjects);
    console.log(`✅ 创建大单元: ${units.length}个, 课程: ${courses.length}个`);

    // 6. 初始化练习题数据（独立存在，只关联学科）
    console.log("\n📝 初始化练习题数据...");
    const exercises = await initExercises(subjects);
    console.log(`✅ 创建练习题: ${exercises.length}道`);

    // 7. 初始化习题组数据
    console.log("\n📋 初始化习题组数据...");
    const exerciseGroups = await initExerciseGroups(subjects, exercises);
    console.log(`✅ 创建习题组: ${exerciseGroups.length}个`);

    // 8. 关联课程和习题组
    console.log("\n🔗 关联课程和习题组...");
    await linkCoursesWithExerciseGroups(courses, exerciseGroups);
    console.log("✅ 课程习题组关联完成");

    // 9. 初始化课程内容
    console.log("\n📄 初始化课程内容...");
    await initCourseContents(courses);
    console.log("✅ 课程内容初始化完成");

    // 10. 初始化管理员数据
    if (includeAdminData) {
      console.log("\n👤 初始化管理员数据...");
      const users = await initAdminData();
      console.log(`✅ 创建用户: ${users.length}个`);
    }

    // 11. 初始化测试学生数据
    console.log("\n👨‍🎓 初始化测试学生数据...");
    const students = await initStudentData();
    console.log(`✅ 创建学生: ${students.length}个`);

    // 12. 初始化知识点数据
    if (includeKnowledgePoints) {
      console.log("\n🧠 初始化知识点数据...");
      const knowledgePoints = await initKnowledgePointsData(exercises);
      console.log(`✅ 创建知识点: ${knowledgePoints.length}个`);
    }

    console.log("\n🎉 完整数据库初始化完成！");
    console.log("==============================================");
    console.log(`✓ 学科数据: ${subjects.length}个`);
    console.log(`✓ 年级数据: ${grades.length}个`);
    console.log(`✓ 学科年级关联: ${subjectGrades.length}个`);
    console.log(`✓ 大单元: ${units.length}个`);
    console.log(`✓ 课程: ${courses.length}个`);
    console.log(`✓ 练习题: ${exercises.length}道`);
    console.log(`✓ 习题组: ${exerciseGroups.length}个`);
    if (includeAdminData) console.log(`✓ 用户账户: 3个`);
    if (includeKnowledgePoints) console.log(`✓ 知识点: 很多个`);
    console.log("==============================================");

    return {
      subjects,
      grades,
      subjectGrades,
      units,
      courses,
      exercises,
      exerciseGroups,
      success: true
    };
    
  } catch (error) {
    console.error("❌ 完整数据库初始化出错:", error);
    throw error;
  }
};

/**
 * 初始化学科数据
 */
const initSubjects = async () => {
  const subjectsData = [
    {
      code: 'math',
      name: '数学',
      color: '#58CC02',
      description: '数学学科，包括代数、几何、统计等',
      order: 1
    },
    {
      code: 'physics',
      name: '物理',
      color: '#FF4B4B',
      description: '物理学科，包括力学、电磁学等',
      order: 2
    },
    {
      code: 'chemistry',
      name: '化学',
      color: '#DD6154',
      description: '化学学科，包括有机化学、无机化学等',
      order: 3
    },
    {
      code: 'biology',
      name: '生物',
      color: '#8CB153',
      description: '生物学科，包括细胞生物学、分子生物学等',
      order: 4
    }
  ];

  const subjects = [];
  for (const subjectData of subjectsData) {
    const [subject, created] = await Subject.findOrCreate({
      where: { code: subjectData.code },
      defaults: subjectData
    });
    subjects.push(subject);
    if (created) {
      console.log(`学科 ${subject.name} 创建成功`);
    }
  }
  return subjects;
};

/**
 * 初始化单元和课程数据
 */
const initUnitsAndCourses = async (subjects) => {
  // 获取SubjectGrade关联信息
  const { SubjectGrade, Grade } = require('../models');
  const subjectGrades = await SubjectGrade.findAll({
    include: [
      { model: require('../models').Subject, as: 'subject' },
      { model: Grade, as: 'grade' }
    ]
  });
  
  const chapterColors = {
    math: [
      { primary: '#58CC02', secondary: '#7FDD33' },
      { primary: '#1CB0F6', secondary: '#53C6FF' },
      { primary: '#FF9600', secondary: '#FFB84D' }
    ],
    physics: [
      { primary: '#FF4B4B', secondary: '#FF7878' },
      { primary: '#9E58FF', secondary: '#BC8CFF' }
    ],
    chemistry: [
      { primary: '#DD6154', secondary: '#E68A80' }
    ],
    biology: [
      { primary: '#8CB153', secondary: '#ADC782' }
    ]
  };

  const units = [];
  const courses = [];

  // 数学单元和课程 - 以初一数学为例
  const mathGrade7SubjectGrade = subjectGrades.find(sg => 
    sg.subjectCode === 'math' && sg.grade.code === 'grade7'
  );
  
  if (mathGrade7SubjectGrade) {
    // 数与代数单元
    const algebraUnit = await Unit.create({
      id: 'math-grade7-1',
      subjectGradeId: mathGrade7SubjectGrade.id,
      title: '数与代数',
      description: '包含代数基础、一元二次方程、二次函数等内容',
      order: 1,
      color: chapterColors.math[0].primary,
      secondaryColor: chapterColors.math[0].secondary,
      courseIds: ['math-1-1', 'math-1-2', 'math-1-3', 'math-1-4', 'math-1-5', 'math-1-6']
    });
    units.push(algebraUnit);

    const algebraCourses = [
      { 
        id: 'math-1-1', 
        subject: 'math', 
        title: '一元二次方程', 
        description: '一元二次方程的解法和应用',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-1-1']
      },
      { 
        id: 'math-1-2', 
        subject: 'math', 
        title: '因式分解', 
        description: '多项式的因式分解方法',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-1-2']
      },
      { 
        id: 'math-1-3', 
        subject: 'math', 
        title: '配方法', 
        description: '使用配方法解一元二次方程',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-1-3']
      },
      { 
        id: 'math-1-4', 
        subject: 'math', 
        title: '第一次月考', 
        description: '代数章节综合测试',
        unitType: 'exercise', 
        position: 'right',
        exerciseGroupIds: ['group-math-1-4']
      },
      { 
        id: 'math-1-5', 
        subject: 'math', 
        title: '二次函数', 
        description: '二次函数的性质和图像',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-1-5']
      },
      { 
        id: 'math-1-6', 
        subject: 'math', 
        title: '二次函数应用', 
        description: '二次函数在实际问题中的应用',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-1-6']
      }
    ];

    for (const courseData of algebraCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }

    // 几何单元
    const geometryUnit = await Unit.create({
      id: 'math-grade7-2',
      subjectGradeId: mathGrade7SubjectGrade.id,
      title: '几何',
      description: '包含平面几何、空间几何等内容',
      order: 2,
      color: chapterColors.math[1].primary,
      secondaryColor: chapterColors.math[1].secondary,
      courseIds: ['math-2-1', 'math-2-2', 'math-2-3']
    });
    units.push(geometryUnit);

    const geometryCourses = [
      { 
        id: 'math-2-1', 
        subject: 'math', 
        title: '三角形', 
        description: '三角形的性质和计算',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-2-1']
      },
      { 
        id: 'math-2-2', 
        subject: 'math', 
        title: '圆', 
        description: '圆的性质和计算',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-2-2']
      },
      { 
        id: 'math-2-3', 
        subject: 'math', 
        title: '几何综合', 
        description: '几何章节综合练习',
        unitType: 'exercise',
        exerciseGroupIds: ['group-math-2-3']
      }
    ];

    for (const courseData of geometryCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }

    // 统计与概率单元
    const statsUnit = await Unit.create({
      id: 'math-grade7-3',
      subjectGradeId: mathGrade7SubjectGrade.id,
      title: '统计与概率',
      description: '数据统计和概率计算',
      order: 3,
      color: chapterColors.math[2].primary,
      secondaryColor: chapterColors.math[2].secondary,
      courseIds: ['math-3-1', 'math-3-2', 'math-3-3']
    });
    units.push(statsUnit);

    const statsCourses = [
      { 
        id: 'math-3-1', 
        subject: 'math', 
        title: '数据统计', 
        description: '数据的收集整理和分析',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-3-1']
      },
      { 
        id: 'math-3-2', 
        subject: 'math', 
        title: '概率计算', 
        description: '概率的基本概念和计算',
        unitType: 'normal',
        exerciseGroupIds: ['group-math-3-2']
      },
      { 
        id: 'math-3-3', 
        subject: 'math', 
        title: '匹配练习', 
        description: '数学匹配题练习（新格式）',
        unitType: 'exercise',
        exerciseGroupIds: ['group-math-matching']
      }
    ];

    for (const courseData of statsCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }
  }

  // 物理单元和课程 - 以初二物理为例
  const physicsGrade8SubjectGrade = subjectGrades.find(sg => 
    sg.subjectCode === 'physics' && sg.grade.code === 'grade8'
  );
  
  if (physicsGrade8SubjectGrade) {
    const mechanicsUnit = await Unit.create({
      id: 'physics-grade8-1',
      subjectGradeId: physicsGrade8SubjectGrade.id,
      title: '力学',
      description: '力学基础和运动学',
      order: 1,
      color: chapterColors.physics[0].primary,
      secondaryColor: chapterColors.physics[0].secondary,
      courseIds: ['physics-1-1', 'physics-1-2']
    });
    units.push(mechanicsUnit);

    const physicsCourses = [
      { 
        id: 'physics-1-1', 
        subject: 'physics', 
        title: '运动学', 
        description: '描述物体运动的规律',
        unitType: 'normal',
        exerciseGroupIds: ['group-physics-1-1']
      },
      { 
        id: 'physics-1-2', 
        subject: 'physics', 
        title: '力学', 
        description: '研究力与运动的关系',
        unitType: 'normal',
        exerciseGroupIds: ['group-physics-1-2']
      }
    ];

    for (const courseData of physicsCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }
  }

  // 化学单元和课程 - 以初三化学为例
  const chemistryGrade9SubjectGrade = subjectGrades.find(sg => 
    sg.subjectCode === 'chemistry' && sg.grade.code === 'grade9'
  );
  
  if (chemistryGrade9SubjectGrade) {
    const basicChemUnit = await Unit.create({
      id: 'chemistry-grade9-1',
      subjectGradeId: chemistryGrade9SubjectGrade.id,
      title: '化学基础',
      description: '化学基本概念和原理',
      order: 1,
      color: chapterColors.chemistry[0].primary,
      secondaryColor: chapterColors.chemistry[0].secondary,
      courseIds: ['chemistry-1-1']
    });
    units.push(basicChemUnit);

    const chemistryCourses = [
      { 
        id: 'chemistry-1-1', 
        subject: 'chemistry', 
        title: '原子结构', 
        description: '原子的组成和结构',
        unitType: 'normal',
        exerciseGroupIds: ['group-chemistry-1-1']
      }
    ];

    for (const courseData of chemistryCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }
  }

  // 生物单元和课程 - 以初一生物为例
  const biologyGrade7SubjectGrade = subjectGrades.find(sg => 
    sg.subjectCode === 'biology' && sg.grade.code === 'grade7'
  );
  
  if (biologyGrade7SubjectGrade) {
    const cellBioUnit = await Unit.create({
      id: 'biology-grade7-1',
      subjectGradeId: biologyGrade7SubjectGrade.id,
      title: '细胞生物学',
      description: '细胞的结构和功能',
      order: 1,
      color: chapterColors.biology[0].primary,
      secondaryColor: chapterColors.biology[0].secondary,
      courseIds: ['biology-1-1']
    });
    units.push(cellBioUnit);

    const biologyCourses = [
      { 
        id: 'biology-1-1', 
        subject: 'biology', 
        title: '细胞结构', 
        description: '细胞的基本结构和组成',
        unitType: 'normal',
        exerciseGroupIds: ['group-biology-1-1']
      }
    ];

    for (const courseData of biologyCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }
  }

  return { units, courses };
};

/**
 * 初始化练习题数据（独立存在，只关联学科）
 */
const initExercises = async (subjects) => {
  const exercises = [];

  // 数学练习题
  const mathSubject = subjects.find(s => s.code === 'math');
  if (mathSubject) {
    // 一元二次方程练习题
    const equationExercises = [
      {
        id: 'math-1-1-1',
        subject: 'math',
        title: '一元二次方程第1题',
        question: '解下列一元二次方程:<h1>x² - 5x + 6 = 0</h1>',
        options: ['<h2>x = 2或x = 3</h2>', 'x = 1或x = 6', 'x = -2或x = -3', 'x = 0或x = 5'],
        correctAnswer: 0,
        explanation: '使用因式分解法：<h3>x² - 5x + 6 = (x-2)(x-3) = 0</h3>，所以x = 2或x = 3',
        type: 'choice',
        difficulty: 2
      },
      {
        id: 'math-1-1-2',
        subject: 'math',
        title: '一元二次方程第2题',
        question: '已知方程x² + bx + c = 0的两根为2和3，求b和c的值',
        options: ['b = -5, c = 6', 'b = 5, c = 6', 'b = -5, c = -6', 'b = 5, c = -6'],
        correctAnswer: 0,
        explanation: '根据韦达定理：x₁ + x₂ = -b，x₁ × x₂ = c，所以2 + 3 = -b，2 × 3 = c，得b = -5, c = 6',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'math-1-1-3',
        subject: 'math',
        title: '一元二次方程第3题',
        question: '用公式法解方程：2x² - 7x + 3 = 0',
        options: ['x = 3或x = 0.5', 'x = 1或x = 1.5', 'x = 2或x = 0.75', 'x = 3或x = 1'],
        correctAnswer: 0,
        explanation: 'a = 2, b = -7, c = 3，Δ = 49 - 24 = 25，x = (7 ± 5) / 4，所以x = 3或x = 0.5',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'math-1-1-4',
        subject: 'math',
        title: '一元二次方程第4题',
        question: '判断方程x² - 4x + 5 = 0的根的情况',
        options: ['两个相等的实数根', '两个不相等的实数根', '没有实数根', '一个实数根'],
        correctAnswer: 2,
        explanation: 'Δ = b² - 4ac = 16 - 20 = -4 < 0，所以方程没有实数根',
        type: 'choice',
        difficulty: 3
      },
      {
        id: 'math-1-1-5',
        subject: 'math',
        title: '一元二次方程第5题',
        question: '如果方程kx² - 3x + 1 = 0是一元二次方程，则k的取值范围是',
        options: ['k ≠ 0', 'k > 0', 'k < 0', 'k = 1'],
        correctAnswer: 0,
        explanation: '一元二次方程要求二次项系数不为零，即k ≠ 0',
        type: 'choice',
        difficulty: 2
      },
      {
        id: 'math-1-1-6',
        subject: 'math',
        title: '一元二次方程第6题',
        question: '已知x² - 3x + 2 = 0，求x² + 1/x²的值',
        options: ['5', '7', '9', '11'],
        correctAnswer: 0,
        explanation: 'x² - 3x + 2 = 0，即x² + 2 = 3x，所以x + 2/x = 3，则x² + 1/x² = (x + 1/x)² - 2 = 9 - 4 = 5',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'math-1-1-7',
        subject: 'math',
        title: '一元二次方程第7题',
        question: '利用配方法解方程：x² + 6x - 7 = 0',
        options: ['x = 1或x = -7', 'x = -1或x = 7', 'x = 2或x = -8', 'x = -2或x = 8'],
        correctAnswer: 0,
        explanation: 'x² + 6x - 7 = 0，配方得(x + 3)² = 16，所以x + 3 = ±4，x = 1或x = -7',
        type: 'choice',
        difficulty: 3
      }
    ];

    // 月考综合题
    const examExercises = [
      {
        id: 'math-1-4-1',
        subject: 'math',
        title: '第一次月考第1题',
        question: '计算：(x + 2)² - (x - 1)(x + 3)',
        options: ['x + 7', '2x + 7', 'x + 1', '2x + 1'],
        correctAnswer: 0,
        explanation: '(x + 2)² - (x - 1)(x + 3) = x² + 4x + 4 - (x² + 2x - 3) = x + 7',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'math-1-4-2',
        subject: 'math',
        title: '第一次月考第2题',
        question: '分解因式：x² - 4x + 4',
        options: ['(x - 2)²', '(x + 2)²', '(x - 2)(x + 2)', 'x(x - 4) + 4'],
        correctAnswer: 0,
        explanation: 'x² - 4x + 4是完全平方式，等于(x - 2)²',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'math-1-4-3',
        subject: 'math',
        title: '第一次月考第3题',
        question: '已知a + b = 5，ab = 6，求a² + b²的值',
        options: ['13', '11', '17', '19'],
        correctAnswer: 0,
        explanation: 'a² + b² = (a + b)² - 2ab = 25 - 12 = 13',
        type: 'choice',
        difficulty: 2
      },
      {
        id: 'math-1-4-4',
        subject: 'math',
        title: '第一次月考第4题',
        question: '若(x + 1)² = 4，则x的值为',
        options: ['x = 1或x = -3', 'x = 3或x = -1', 'x = 2或x = -4', 'x = 4或x = -2'],
        correctAnswer: 0,
        explanation: '(x + 1)² = 4，所以x + 1 = ±2，x = 1或x = -3',
        type: 'choice',
        difficulty: 3
      },
      {
        id: 'math-1-4-5',
        subject: 'math',
        title: '第一次月考第5题',
        question: '解不等式：x² - 3x + 2 > 0',
        options: ['x < 1或x > 2', 'x > 1或x < 2', '1 < x < 2', 'x ≤ 1或x ≥ 2'],
        correctAnswer: 0,
        explanation: 'x² - 3x + 2 = (x - 1)(x - 2)，当x < 1或x > 2时，不等式成立',
        type: 'choice',
        difficulty: 2
      },
      {
        id: 'math-1-4-6',
        subject: 'math',
        title: '第一次月考第6题',
        question: '化简：√(x² - 6x + 9)',
        options: ['|x - 3|', 'x - 3', '3 - x', '±(x - 3)'],
        correctAnswer: 0,
        explanation: '√(x² - 6x + 9) = √((x - 3)²) = |x - 3|',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'math-1-4-7',
        subject: 'math',
        title: '第一次月考第7题',
        question: '若关于x的方程x² + 2x + k = 0有两个相等的实数根，则k的值为',
        options: ['1', '-1', '2', '-2'],
        correctAnswer: 0,
        explanation: '有两个相等实数根时，Δ = 0，即4 - 4k = 0，所以k = 1',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'math-1-4-8',
        subject: 'math',
        title: '第一次月考第8题',
        question: '已知二次函数y = x² - 4x + 3，求它的顶点坐标',
        options: ['(2, -1)', '(-2, -1)', '(2, 1)', '(-2, 1)'],
        correctAnswer: 0,
        explanation: '配方得y = (x - 2)² - 1，所以顶点坐标为(2, -1)',
        type: 'choice',
        difficulty: 1
      }
    ];

    // 二次函数应用题
    const quadraticApplications = [
      {
        id: 'math-1-6-1',
        subject: 'math',
        title: '抛物运动问题',
        question: '一个物体向上抛出，其高度h（米）与时间t（秒）的关系式为：h = -5t² + 20t + 2。求物体达到最高点的时间。',
        options: ['2秒', '3秒', '4秒', '5秒'],
        correctAnswer: 0,
        explanation: '二次函数h = -5t² + 20t + 2的最高点在对称轴处，t = -b/(2a) = -20/(2×(-5)) = 2秒。',
        type: 'choice',
        difficulty: 'medium'
      },
      {
        id: 'math-1-6-2',
        subject: 'math',
        title: '商业利润最值问题',
        question: '某商品的日销量y（件）与单价x（元）满足关系：y = -2x + 100。若成本为每件20元，求单价为多少时利润最大？',
        options: ['30元', '35元', '40元', '45元'],
        correctAnswer: 1,
        explanation: '利润P = (x-20)(-2x+100) = -2x² + 140x - 2000，对称轴x = 140/(2×2) = 35元时利润最大。',
        type: 'choice',
        difficulty: 'hard'
      },
      {
        id: 'math-1-6-3',
        subject: 'math',
        title: '矩形面积最值',
        question: '用长度为20米的铁丝围成一个矩形，当矩形的长为多少时，面积最大？',
        options: ['4米', '5米', '6米', '7米'],
        correctAnswer: 1,
        explanation: '设长为x，则宽为(20-2x)/2 = 10-x。面积S = x(10-x) = -x² + 10x，对称轴x = 5时面积最大。',
        type: 'choice',
        difficulty: 'medium'
      },
      {
        id: 'math-1-6-4',
        subject: 'math',
        title: '二次函数图像分析',
        question: '二次函数y = ax² + bx + c的图像开口向下，且经过点(1,0)和(3,0)，对称轴为x = 2。当x = 2时，y的值为：',
        options: ['正数', '负数', '零', '无法确定'],
        correctAnswer: 0,
        explanation: '由于开口向下且经过(1,0)和(3,0)，对称轴x = 2是最高点，所以y > 0。',
        type: 'choice',
        difficulty: 'medium'
      },
      {
        id: 'math-1-6-5',
        subject: 'math',
        title: '二次函数实际应用填空',
        question: '一个球被垂直向上抛出，高度h（米）与时间t（秒）的关系为h = -4.9t² + 14.7t + 1.5。球落地时的时间约为 ____ 秒。',
        options: null,
        correctAnswer: ['3.1'],
        explanation: '球落地时h = 0，即-4.9t² + 14.7t + 1.5 = 0。解得t ≈ 3.1秒（取正值）。',
        type: 'fill_blank',
        difficulty: 'hard'
      }
    ];

    // 三角形练习题
    const triangleExercises = [
      {
        id: 'math-2-1-1',
        subject: 'math',
        title: '三角形第1题',
        question: '在三角形ABC中，如果∠A = 60°，∠B = 80°，那么∠C的度数是',
        options: ['40°', '50°', '60°', '70°'],
        correctAnswer: 0,
        explanation: '三角形内角和为180°，所以∠C = 180° - 60° - 80° = 40°',
        type: 'choice',
        difficulty: 3
      },
      {
        id: 'math-2-1-2',
        subject: 'math',
        title: '三角形第2题',
        question: '直角三角形的两直角边长分别为3和4，求斜边长',
        options: ['5', '6', '7', '8'],
        correctAnswer: 0,
        explanation: '根据勾股定理：c² = a² + b² = 9 + 16 = 25，所以c = 5',
        type: 'choice',
        difficulty: 3
      },
      {
        id: 'math-2-1-3',
        subject: 'math',
        title: '三角形第3题',
        question: '等腰三角形的底边长为8，腰长为5，求其面积',
        options: ['12', '15', '20', '24'],
        correctAnswer: 0,
        explanation: '底边上的高为√(5² - 4²) = 3，面积为(1/2) × 8 × 3 = 12',
        type: 'choice',
        difficulty: 3
      }
    ];

    // 合并所有数学练习题
    exercises.push(...equationExercises, ...examExercises, ...quadraticApplications, ...triangleExercises);

    // 添加匹配题示例数据（用于测试新的对象格式）
    const matchingExercises = [
      {
        id: 'math-matching-1',
        subject: 'math',
        title: '数字与汉字匹配',
        question: '请将阿拉伯数字与对应的汉字进行匹配：',
        options: {
          left: ['1', '2', '3', '4'],
          right: ['四', '二', '一', '三']
        },
        correctAnswer: {
          "0": "2",  // 左侧索引0("1")对应右侧索引2("一")
          "1": "1",  // 左侧索引1("2")对应右侧索引1("二") 
          "2": "3",  // 左侧索引2("3")对应右侧索引3("三")
          "3": "0"   // 左侧索引3("4")对应右侧索引0("四")
        },
        explanation: '阿拉伯数字与汉字的对应关系：1-一，2-二，3-三，4-四',
        type: 'matching',
        difficulty: 1
      },
      {
        id: 'math-matching-2',
        subject: 'math',
        title: '几何图形与名称匹配',
        question: '请将几何图形与其名称进行匹配：',
        options: {
          left: ['三条边的图形', '四条边的图形', '圆形边界', '五条边的图形'],
          right: ['圆形', '四边形', '三角形', '五边形']
        },
        correctAnswer: {
          "0": "2",  // 三条边的图形 -> 三角形
          "1": "1",  // 四条边的图形 -> 四边形
          "2": "0",  // 圆形边界 -> 圆形
          "3": "3"   // 五条边的图形 -> 五边形
        },
        explanation: '根据边数确定几何图形的名称',
        type: 'matching',
        difficulty: 2
      }
    ];

    // 将匹配题添加到数学练习题中
    exercises.push(...matchingExercises);
  }

  // 物理练习题
  const physicsSubject = subjects.find(s => s.code === 'physics');
  if (physicsSubject) {
    const physicsExercises = [
      {
        id: 'physics-1-1-1',
        subject: 'physics',
        title: '运动学第1题',
        question: '一物体做匀速直线运动，速度为10m/s，在5秒内通过的距离是',
        options: ['50m', '2m', '15m', '0.5m'],
        correctAnswer: 0,
        explanation: '距离 = 速度 × 时间 = 10 × 5 = 50m',
        type: 'choice',
        difficulty: 1
      },
      {
        id: 'physics-1-2-1',
        subject: 'physics',
        title: '力学第1题',
        question: '质量为2kg的物体受到10N的作用力，其加速度为',
        options: ['5m/s²', '20m/s²', '12m/s²', '8m/s²'],
        correctAnswer: 0,
        explanation: '根据牛顿第二定律：F = ma，所以a = F/m = 10/2 = 5m/s²',
        type: 'choice',
        difficulty: 2
      }
    ];
    exercises.push(...physicsExercises);
  }

  // 化学练习题
  const chemistrySubject = subjects.find(s => s.code === 'chemistry');
  if (chemistrySubject) {
    const chemistryExercises = [
      {
        id: 'chemistry-1-1-1',
        subject: 'chemistry',
        title: '原子结构第1题',
        question: '氢原子的原子核中含有',
        options: ['1个质子', '1个中子', '1个电子', '1个质子和1个中子'],
        correctAnswer: 0,
        explanation: '氢原子的原子核只含有1个质子，没有中子',
        type: 'choice',
        difficulty: 1
      }
    ];
    exercises.push(...chemistryExercises);
  }

  // 生物练习题
  const biologySubject = subjects.find(s => s.code === 'biology');
  if (biologySubject) {
    const biologyExercises = [
      {
        id: 'biology-1-1-1',
        subject: 'biology',
        title: '细胞结构第1题',
        question: '植物细胞和动物细胞都具有的结构是',
        options: ['细胞壁', '叶绿体', '细胞膜', '中心体'],
        correctAnswer: 2,
        explanation: '细胞膜是所有细胞都具有的基本结构',
        type: 'choice',
        difficulty: 1
      }
    ];
    exercises.push(...biologyExercises);
  }

  // 批量创建练习题
  for (const exerciseData of exercises) {
    await Exercise.create(exerciseData);
  }

  console.log(`创建了${exercises.length}道练习题`);
  return exercises;
};

/**
 * 初始化习题组数据
 */
const initExerciseGroups = async (subjects, exercises) => {
  const exerciseGroups = [];

  // 数学习题组
  const mathSubject = subjects.find(s => s.code === 'math');
  if (mathSubject) {
    const mathGroups = [
      {
        id: 'group-math-1-1',
        name: '一元二次方程习题组',
        description: '一元二次方程解法练习',
        subject: 'math',
        exerciseIds: ['math-1-1-1', 'math-1-1-2', 'math-1-1-3', 'math-1-1-4', 'math-1-1-5', 'math-1-1-6', 'math-1-1-7'],
        isActive: true
      },
      {
        id: 'group-math-1-2',
        name: '因式分解习题组',
        description: '因式分解方法练习',
        subject: 'math',
        exerciseIds: [], // 后续可以添加
        isActive: true
      },
      {
        id: 'group-math-1-3',
        name: '配方法习题组',
        description: '配方法解方程练习',
        subject: 'math',
        exerciseIds: [], // 后续可以添加
        isActive: true
      },
      {
        id: 'group-math-1-4',
        name: '第一次月考习题组',
        description: '代数章节综合测试',
        subject: 'math',
        exerciseIds: ['math-1-4-1', 'math-1-4-2', 'math-1-4-3', 'math-1-4-4', 'math-1-4-5', 'math-1-4-6', 'math-1-4-7', 'math-1-4-8'],
        isActive: true
      },
      {
        id: 'group-math-1-5',
        name: '二次函数习题组',
        description: '二次函数性质和图像',
        subject: 'math',
        exerciseIds: [], // 后续可以添加
        isActive: true
      },
      {
        id: 'group-math-1-6',
        name: '二次函数应用习题组',
        description: '二次函数实际应用问题',
        subject: 'math',
        exerciseIds: ['math-1-6-1', 'math-1-6-2', 'math-1-6-3', 'math-1-6-4', 'math-1-6-5'],
        isActive: true
      },
      {
        id: 'group-math-2-1',
        name: '三角形习题组',
        description: '三角形性质和计算',
        subject: 'math',
        exerciseIds: ['math-2-1-1', 'math-2-1-2', 'math-2-1-3'],
        isActive: true
      },
      {
        id: 'group-math-2-2',
        name: '圆习题组',
        description: '圆的性质和计算',
        subject: 'math',
        exerciseIds: [], // 后续可以添加
        isActive: true
      },
      {
        id: 'group-math-2-3',
        name: '几何综合习题组',
        description: '几何章节综合练习',
        subject: 'math',
        exerciseIds: [], // 后续可以添加
        isActive: true
      },
      {
        id: 'group-math-3-1',
        name: '数据统计习题组',
        description: '数据收集整理和分析',
        subject: 'math',
        exerciseIds: [], // 后续可以添加
        isActive: true
      },
      {
        id: 'group-math-3-2',
        name: '概率计算习题组',
        description: '概率基本概念和计算',
        subject: 'math',
        exerciseIds: [], // 后续可以添加
        isActive: true
      },
      {
        id: 'group-math-matching',
        name: '匹配题习题组',
        description: '数学匹配题练习（测试新格式）',
        subject: 'math',
        exerciseIds: ['math-matching-1', 'math-matching-2'],
        isActive: true
      }
    ];

    for (const groupData of mathGroups) {
      const group = await ExerciseGroup.create(groupData);
      exerciseGroups.push(group);
    }
  }

  // 物理习题组
  const physicsSubject = subjects.find(s => s.code === 'physics');
  if (physicsSubject) {
    const physicsGroups = [
      {
        id: 'group-physics-1-1',
        name: '运动学习题组',
        description: '物体运动规律',
        subject: 'physics',
        exerciseIds: ['physics-1-1-1'],
        isActive: true
      },
      {
        id: 'group-physics-1-2',
        name: '力学习题组',
        description: '力与运动关系',
        subject: 'physics',
        exerciseIds: ['physics-1-2-1'],
        isActive: true
      }
    ];

    for (const groupData of physicsGroups) {
      const group = await ExerciseGroup.create(groupData);
      exerciseGroups.push(group);
    }
  }

  // 化学习题组
  const chemistrySubject = subjects.find(s => s.code === 'chemistry');
  if (chemistrySubject) {
    const chemistryGroups = [
      {
        id: 'group-chemistry-1-1',
        name: '原子结构习题组',
        description: '原子组成和结构',
        subject: 'chemistry',
        exerciseIds: ['chemistry-1-1-1'],
        isActive: true
      }
    ];

    for (const groupData of chemistryGroups) {
      const group = await ExerciseGroup.create(groupData);
      exerciseGroups.push(group);
    }
  }

  // 生物习题组
  const biologySubject = subjects.find(s => s.code === 'biology');
  if (biologySubject) {
    const biologyGroups = [
      {
        id: 'group-biology-1-1',
        name: '细胞结构习题组',
        description: '细胞基本结构和组成',
        subject: 'biology',
        exerciseIds: ['biology-1-1-1'],
        isActive: true
      }
    ];

    for (const groupData of biologyGroups) {
      const group = await ExerciseGroup.create(groupData);
      exerciseGroups.push(group);
    }
  }

  console.log(`创建了${exerciseGroups.length}个习题组`);
  return exerciseGroups;
};

/**
 * 关联课程和习题组
 */
const linkCoursesWithExerciseGroups = async (courses, exerciseGroups) => {
  // 课程的exerciseGroupIds已经在创建时设置，这里可以验证或更新
  console.log('课程和习题组关联已在课程创建时完成');
};

/**
 * 初始化课程内容
 */
const initCourseContents = async (courses) => {
  const mathCourse = courses.find(c => c.id === 'math-1-1');
  if (mathCourse) {
    const content = `<h1>一元二次方程的基本概念</h1>
<p>一元二次方程是指含有一个未知数，并且未知数的最高次数是2的方程。其一般形式为：</p>
<p class="formula">ax² + bx + c = 0 (a ≠ 0)</p>
<p>其中a、b、c是已知数，x是未知数，a ≠ 0。</p>

<h2>解法总结</h2>
<ol>
  <li><strong>因式分解法</strong>：适用于容易分解的方程</li>
  <li><strong>配方法</strong>：将方程配成完全平方式</li>
  <li><strong>公式法</strong>：使用求根公式，适用于所有方程</li>
</ol>

<h2>判别式</h2>
<p>对于方程ax² + bx + c = 0，判别式Δ = b² - 4ac</p>
<ul>
  <li>Δ > 0：两个不相等的实数根</li>
  <li>Δ = 0：两个相等的实数根</li>
  <li>Δ < 0：没有实数根</li>
</ul>`;

    const media = [
      {
        type: 'video',
        title: '一元二次方程简介',
        url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        metadata: { duration: '9:56', resolution: '720p' }
      }
    ];

    await mathCourse.update({ content, media });
    console.log(`更新课程内容: ${mathCourse.title}`);
  }

  // 更新二次函数应用课程内容
  const quadraticCourse = courses.find(c => c.id === 'math-1-6');
  if (quadraticCourse) {
    const content = `<h1>二次函数的实际应用</h1>
<p>二次函数在生活中有广泛的应用，包括：</p>

<h2>1. 抛物运动</h2>
<p>物体在重力作用下的运动轨迹是抛物线，高度与时间的关系为二次函数。</p>

<h2>2. 利润最大化问题</h2>
<p>商业中，价格与销量的关系常常可以用二次函数描述，通过求极值来获得最大利润。</p>

<h2>3. 几何最值问题</h2>
<p>在给定周长的情况下求最大面积，或给定面积求最小周长等问题。</p>

<h2>解题步骤</h2>
<ol>
  <li>理解题意，设定变量</li>
  <li>建立二次函数模型</li>
  <li>求出函数的最值（通过对称轴或配方）</li>
  <li>检验答案的合理性</li>
</ol>`;

    await quadraticCourse.update({ content });
    console.log(`更新课程内容: ${quadraticCourse.title}`);
  }
};

/**
 * 初始化管理员数据
 */
const initAdminData = async () => {
  const users = [];
  
  const admin = await User.create({
    username: 'admin',
    password: '123456',
    email: 'admin@learn.com',
    role: 'admin',
    name: '系统管理员'
  });
  users.push(admin);

  const teacher1 = await User.create({
    username: 'teacher',
    password: '123456',
    email: 'teacher1@learn.com',
    role: 'teacher',
    name: '张老师'
  });
  users.push(teacher1);

  console.log(`创建了${users.length}个用户账户`);
  return users;
};

/**
 * 初始化测试学生数据
 */
const initStudentData = async () => {
  const students = [];

  const student1 = await Student.create({
    studentId: 'student1',
    password: 'student123',
    name: '张小明',
    nickname: '小明',
    email: 'student1@learn.com',
    grade: '九年级',
    school: '实验中学',
    totalPoints: 100,
    currentLevel: 1,
    status: 'active'
  });
  students.push(student1);

  const student2 = await Student.create({
    studentId: 'student2', 
    password: 'student123',
    name: '李小红',
    nickname: '小红',
    email: 'student2@learn.com',
    grade: '九年级',
    school: '实验中学',
    totalPoints: 200,
    currentLevel: 1,
    status: 'active'
  });
  students.push(student2);

  const student3 = await Student.create({
    studentId: 'student3',
    password: 'student123', 
    name: '王小华',
    nickname: '小华',
    email: 'student3@learn.com',
    grade: '九年级',
    school: '实验中学',
    totalPoints: 150,
    currentLevel: 1,
    status: 'active'
  });
  students.push(student3);

  console.log(`创建了${students.length}个测试学生`);
  return students;
};

/**
 * 初始化知识点数据
 */
const initKnowledgePointsData = async (exercises) => {
  const knowledgePointsData = [
    { title: '一元二次方程基础', content: '一元二次方程的定义和基本概念', subject: 'math' },
    { title: '因式分解法', content: '使用因式分解法解一元二次方程', subject: 'math' },
    { title: '配方法', content: '使用配方法解一元二次方程', subject: 'math' },
    { title: '公式法', content: '使用求根公式解一元二次方程', subject: 'math' },
    { title: '二次函数基础', content: '二次函数的定义和基本性质', subject: 'math' },
    { title: '二次函数应用', content: '二次函数在实际问题中的应用', subject: 'math' },
    { title: '三角形性质', content: '三角形的基本性质和计算', subject: 'math' },
    { title: '运动学基础', content: '物体运动的基本规律', subject: 'physics' },
    { title: '力学基础', content: '力与运动的关系', subject: 'physics' },
    { title: '原子结构', content: '原子的组成和结构', subject: 'chemistry' },
    { title: '细胞结构', content: '细胞的基本结构和功能', subject: 'biology' }
  ];

  const knowledgePoints = [];
  for (const kpData of knowledgePointsData) {
    const kp = await KnowledgePoint.create(kpData);
    knowledgePoints.push(kp);
  }

  // 更新练习题的知识点关联
  const mathEquationExerciseIds = ['math-1-1-1', 'math-1-1-2', 'math-1-1-3', 'math-1-1-4', 'math-1-1-5', 'math-1-1-6', 'math-1-1-7'];
  for (const exerciseId of mathEquationExerciseIds) {
    const exercise = await Exercise.findByPk(exerciseId);
    if (exercise) {
      await exercise.update({ 
        knowledgePointIds: [knowledgePoints[0].id, knowledgePoints[1].id] 
      });
    }
  }

  const mathApplicationExerciseIds = ['math-1-6-1', 'math-1-6-2', 'math-1-6-3', 'math-1-6-4', 'math-1-6-5'];
  for (const exerciseId of mathApplicationExerciseIds) {
    const exercise = await Exercise.findByPk(exerciseId);
    if (exercise) {
      await exercise.update({ 
        knowledgePointIds: [knowledgePoints[4].id, knowledgePoints[5].id] 
      });
    }
  }

  console.log(`创建了${knowledgePoints.length}个知识点`);
  return knowledgePoints;
};

/**
 * 初始化年级数据
 */
const initGrades = async () => {
  const gradesData = [
    // 小学年级 (primary)
    { code: 'grade1', name: '一年级', level: 'primary', levelNumber: 1, order: 1 },
    { code: 'grade2', name: '二年级', level: 'primary', levelNumber: 2, order: 2 },
    { code: 'grade3', name: '三年级', level: 'primary', levelNumber: 3, order: 3 },
    { code: 'grade4', name: '四年级', level: 'primary', levelNumber: 4, order: 4 },
    { code: 'grade5', name: '五年级', level: 'primary', levelNumber: 5, order: 5 },
    { code: 'grade6', name: '六年级', level: 'primary', levelNumber: 6, order: 6 },

    // 初中年级 (middle)
    { code: 'grade7', name: '初一', level: 'middle', levelNumber: 1, order: 7 },
    { code: 'grade8', name: '初二', level: 'middle', levelNumber: 2, order: 8 },
    { code: 'grade9', name: '初三', level: 'middle', levelNumber: 3, order: 9 },

    // 高中年级 (high)
    { code: 'grade10', name: '高一', level: 'high', levelNumber: 1, order: 10 },
    { code: 'grade11', name: '高二', level: 'high', levelNumber: 2, order: 11 },
    { code: 'grade12', name: '高三', level: 'high', levelNumber: 3, order: 12 }
  ];

  const grades = [];
  for (const gradeData of gradesData) {
    const [grade, created] = await Grade.findOrCreate({
      where: { code: gradeData.code },
      defaults: gradeData
    });
    grades.push(grade);
    if (created) {
      console.log(`年级 ${grade.name} 创建成功`);
    }
  }
  return grades;
};

/**
 * 初始化学科年级关联数据
 */
const initSubjectGrades = async (subjects, grades) => {
  const subjectGradeRelations = [
    // 数学：从小学一年级到高中三年级都有
    { subjectCode: 'math', gradeCodes: ['grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6', 'grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12'] },
    
    // 物理：从初二开始
    { subjectCode: 'physics', gradeCodes: ['grade8', 'grade9', 'grade10', 'grade11', 'grade12'] },
    
    // 化学：从初三开始
    { subjectCode: 'chemistry', gradeCodes: ['grade9', 'grade10', 'grade11', 'grade12'] },
    
    // 生物：从初一开始
    { subjectCode: 'biology', gradeCodes: ['grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12'] }
  ];

  const subjectGrades = [];
  let order = 1;

  for (const relation of subjectGradeRelations) {
    for (const gradeCode of relation.gradeCodes) {
      const grade = grades.find(g => g.code === gradeCode);
      if (grade) {
        const [subjectGrade, created] = await SubjectGrade.findOrCreate({
          where: { 
            subjectCode: relation.subjectCode,
            gradeId: grade.id
          },
          defaults: {
            subjectCode: relation.subjectCode,
            gradeId: grade.id,
            order: order++
          }
        });
        subjectGrades.push(subjectGrade);
        if (created) {
          const subject = subjects.find(s => s.code === relation.subjectCode);
          console.log(`学科年级关联创建: ${subject?.name} - ${grade.name}`);
        }
      }
    }
  }

  return subjectGrades;
};

// 如果直接运行该文件
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    includeAdminData: !args.includes('--no-admin'),
    includeKnowledgePoints: !args.includes('--no-knowledge'),
    force: args.includes('--force')
  };
  
  completeInit(options)
    .then(() => {
      console.log("完整初始化脚本执行完毕");
      process.exit(0);
    })
    .catch((err) => {
      console.error("完整初始化脚本执行失败:", err);
      process.exit(1);
    });
}

module.exports = completeInit; 