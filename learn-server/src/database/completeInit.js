const { sequelize } = require("../config/database");
const { Subject, Unit, Course, Exercise, User, KnowledgePoint, Student } = require("../models");

/**
 * 完整的数据库初始化脚本
 * 集中管理所有数据初始化操作
 */
const completeInit = async (options = {}) => {
  const { 
    includeAdminData = true,
    includeKnowledgePoints = true,
    force = false 
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

    // 3. 初始化单元数据
    console.log("\n📖 初始化单元数据...");
    const { units, courses } = await initUnitsAndCourses(subjects);
    console.log(`✅ 创建大单元: ${units.length}个, 小单元: ${courses.length}个`);

    // 4. 初始化练习题数据
    console.log("\n📝 初始化练习题数据...");
    const exercises = await initExercises(courses);
    console.log(`✅ 创建练习题: ${exercises.length}道`);

    // 5. 初始化单元内容
    console.log("\n📋 初始化单元内容...");
    await initUnitContents(courses);
    console.log("✅ 单元内容初始化完成");

    // 6. 初始化管理员数据
    if (includeAdminData) {
      console.log("\n👤 初始化管理员数据...");
      const users = await initAdminData(courses);
      console.log(`✅ 创建用户: ${users.length}个`);
    }

    // 7. 初始化测试学生数据
    console.log("\n👨‍🎓 初始化测试学生数据...");
    const students = await initStudentData();
    console.log(`✅ 创建学生: ${students.length}个`);

    // 8. 初始化知识点数据
    if (includeKnowledgePoints) {
      console.log("\n🧠 初始化知识点数据...");
      const knowledgePoints = await initKnowledgePointsData(exercises);
      console.log(`✅ 创建知识点: ${knowledgePoints.length}个`);
    }

    console.log("\n🎉 完整数据库初始化完成！");
    console.log("==============================================");
    console.log(`✓ 学科数据: ${subjects.length}个`);
    console.log(`✓ 大单元: ${units.length}个`);
    console.log(`✓ 小单元: ${courses.length}个`);
    console.log(`✓ 练习题: ${exercises.length}道`);
    if (includeAdminData) console.log(`✓ 用户账户: 3个`);
    if (includeKnowledgePoints) console.log(`✓ 知识点: 8个`);
    console.log("==============================================");

    return {
      subjects,
      units,
      courses,
      exercises,
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

  // 数学单元
  const mathSubject = subjects.find(s => s.code === 'math');
  if (mathSubject) {
    // 数与代数
    const algebraUnit = await Unit.create({
      id: 'math-1',
      subject: 'math',
      title: '数与代数',
      description: '包含代数基础、一元二次方程等内容',
      order: 1,
      color: chapterColors.math[0].primary,
      secondaryColor: chapterColors.math[0].secondary,
      courseIds: ['math-1-1', 'math-1-2', 'math-1-3', 'math-1-4', 'math-1-5', 'math-1-6']
    });
    units.push(algebraUnit);

    const algebraCourses = [
      { id: 'math-1-1', subject: 'math', unitId: 'math-1', title: '一元二次方程', description: '一元二次方程的解法和应用', unitType: 'normal' },
      { id: 'math-1-2', subject: 'math', unitId: 'math-1', title: '因式分解', description: '多项式的因式分解方法', unitType: 'normal' },
      { id: 'math-1-3', subject: 'math', unitId: 'math-1', title: '配方法', description: '使用配方法解一元二次方程', unitType: 'normal' },
      { id: 'math-1-4', subject: 'math', unitId: 'math-1', title: '第一次月考', description: '使用公式法解一元二次方程', unitType: 'exercise', position: 'right' },
      { id: 'math-1-5', subject: 'math', unitId: 'math-1', title: '二次函数', description: '二次函数的性质和图像', unitType: 'normal' },
      { id: 'math-1-6', subject: 'math', unitId: 'math-1', title: '二次函数应用', description: '二次函数在实际问题中的应用', unitType: 'normal' }
    ];

    for (const courseData of algebraCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }

    // 几何
    const geometryUnit = await Unit.create({
      id: 'math-2',
      subject: 'math',
      title: '几何',
      description: '包含平面几何、空间几何等内容',
      order: 2,
      color: chapterColors.math[1].primary,
      secondaryColor: chapterColors.math[1].secondary,
      courseIds: ['math-2-1', 'math-2-2', 'math-2-3', 'math-2-4']
    });
    units.push(geometryUnit);

    const geometryCourses = [
      { id: 'math-2-1', subject: 'math', unitId: 'math-2', title: '三角形', description: '三角形的性质和计算', unitType: 'normal' },
      { id: 'math-2-2', subject: 'math', unitId: 'math-2', title: '直角三角形', description: '直角三角形的性质和勾股定理', unitType: 'normal' },
      { id: 'math-2-3', subject: 'math', unitId: 'math-2', title: '四边形', description: '平行四边形、矩形、正方形等四边形的性质', unitType: 'normal' },
      { id: 'math-2-4', subject: 'math', unitId: 'math-2', title: '圆', description: '圆的性质和计算', unitType: 'normal' }
    ];

    for (const courseData of geometryCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }

    // 统计与概率
    const statisticsUnit = await Unit.create({
      id: 'math-3',
      subject: 'math',
      title: '统计与概率',
      description: '包含统计学基础和概率论',
      order: 3,
      color: chapterColors.math[2].primary,
      secondaryColor: chapterColors.math[2].secondary,
      courseIds: ['math-3-1', 'math-3-2', 'math-3-3']
    });
    units.push(statisticsUnit);

    const statisticsCourses = [
      { id: 'math-3-1', subject: 'math', unitId: 'math-3', title: '数据分析', description: '数据的收集、整理和分析', unitType: 'normal' },
      { id: 'math-3-2', subject: 'math', unitId: 'math-3', title: '概率基础', description: '随机事件与概率', unitType: 'normal' },
      { id: 'math-3-3', subject: 'math', unitId: 'math-3', title: '概率论基础', description: '随机事件、条件概率、独立性等概念', unitType: 'normal' }
    ];

    for (const courseData of statisticsCourses) {
      const course = await Course.create(courseData);
      courses.push(course);
    }
  }

  // 物理单元
  const physicsSubject = subjects.find(s => s.code === 'physics');
  if (physicsSubject) {
    const mechanicsUnit = await Unit.create({
      id: 'physics-1',
      subject: 'physics',
      title: '力学',
      description: '包含运动学、动力学等内容',
      order: 1,
      color: chapterColors.physics[0].primary,
      secondaryColor: chapterColors.physics[0].secondary,
      courseIds: ['physics-1-1']
    });
    units.push(mechanicsUnit);

    const course1 = await Course.create({
      id: 'physics-1-1',
      subject: 'physics',
      unitId: 'physics-1',
      title: '牛顿运动定律',
      description: '牛顿三大运动定律及其应用',
      unitType: 'normal'
    });
    courses.push(course1);

    const electromagnetismUnit = await Unit.create({
      id: 'physics-2',
      subject: 'physics',
      title: '电磁学',
      description: '包含静电场、磁场等内容',
      order: 2,
      color: chapterColors.physics[1].primary,
      secondaryColor: chapterColors.physics[1].secondary,
      courseIds: ['physics-2-1']
    });
    units.push(electromagnetismUnit);

    const course2 = await Course.create({
      id: 'physics-2-1',
      subject: 'physics',
      unitId: 'physics-2',
      title: '电场',
      description: '电场的性质和计算',
      unitType: 'normal'
    });
    courses.push(course2);
  }

  // 化学和生物单元（简化版）
  const chemistrySubject = subjects.find(s => s.code === 'chemistry');
  if (chemistrySubject) {
    const unit = await Unit.create({
      id: 'chemistry-1',
      subject: 'chemistry',
      title: '元素与物质',
      description: '包含元素周期表、元素性质等内容',
      order: 1,
      color: chapterColors.chemistry[0].primary,
      secondaryColor: chapterColors.chemistry[0].secondary,
      courseIds: ['chemistry-1-1']
    });
    units.push(unit);

    const course = await Course.create({
      id: 'chemistry-1-1',
      subject: 'chemistry',
      unitId: 'chemistry-1',
      title: '元素周期表',
      description: '元素周期表的规律和应用',
      unitType: 'normal'
    });
    courses.push(course);
  }

  const biologySubject = subjects.find(s => s.code === 'biology');
  if (biologySubject) {
    const unit = await Unit.create({
      id: 'biology-1',
      subject: 'biology',
      title: '细胞生物学',
      description: '包含细胞结构、细胞分裂等内容',
      order: 1,
      color: chapterColors.biology[0].primary,
      secondaryColor: chapterColors.biology[0].secondary,
      courseIds: ['biology-1-1']
    });
    units.push(unit);

    const course = await Course.create({
      id: 'biology-1-1',
      subject: 'biology',
      unitId: 'biology-1',
      title: '细胞结构',
      description: '细胞的基本结构和功能',
      unitType: 'normal'
    });
    courses.push(course);
  }

  console.log(`创建了${units.length}个大单元，${courses.length}个小单元`);
  return { units, courses };
};

/**
 * 初始化练习题数据
 */
const initExercises = async (courses) => {
  const exercises = [];

  // 为数学课程创建练习题
  const mathCourses = courses.filter(c => c.subject === 'math');
  
  for (const course of mathCourses) {
    if (course.unitType === 'exercise' || course.id === 'math-1-1' || course.id === 'math-2-1') {
      const exerciseCount = course.unitType === 'exercise' ? 8 : (course.id === 'math-1-1' ? 7 : 3);
      
             for (let i = 1; i <= exerciseCount; i++) {
         const exercise = await Exercise.create({
           id: `${course.id}-${i}`,
           subject: course.subject,
           unitId: course.id,
           title: `${course.title}第${i}题`,
           question: `${course.title}练习题${i}`,
           options: ['选项A', '选项B', '选项C', '选项D'],
           correctAnswer: 0,
           explanation: `这是${course.title}第${i}题的解析`,
           difficulty: Math.floor(Math.random() * 3) + 1,
           type: 'choice'
         });
         exercises.push(exercise);
       }
    }
  }

  console.log(`创建了${exercises.length}道练习题`);
  return exercises;
};

/**
 * 初始化单元内容
 */
const initUnitContents = async (courses) => {
  const mathCourse = courses.find(c => c.id === 'math-1-1');
  if (mathCourse) {
    console.log(`为课程 ${mathCourse.title} 初始化内容`);
    
    // 准备内容
    const content = `<h1>一元二次方程的基本概念</h1>
<p>一元二次方程是指含有一个未知数，并且未知数的最高次数是2的方程。其一般形式为：</p>
<p class="formula">ax² + bx + c = 0 (a ≠ 0)</p>
<p>其中a、b、c是已知数，x是未知数，a ≠ 0。</p>
<p>例如：</p>
<ul>
  <li>x² - 5x + 6 = 0</li>
  <li>2x² + 3x - 1 = 0</li>
  <li>3x² - 7 = 0</li>
</ul>

<h1>一元二次方程的解法 - 因式分解法</h1>
<p>因式分解法是解一元二次方程的最基本方法，适用于容易分解因式的方程。</p>
<p>步骤：</p>
<ol>
  <li>将方程左边因式分解为两个一次因式的乘积</li>
  <li>令每个因式等于0，解出x的值</li>
</ol>
<p>例如，解方程：x² - 5x + 6 = 0</p>
<p>解：</p>
<p>x² - 5x + 6 = 0</p>
<p>(x - 2)(x - 3) = 0</p>
<p>所以x = 2或x = 3</p>
<p>答案：x = 2或x = 3</p>

<h1>一元二次方程的解法 - 公式法</h1>
<p>公式法是解一元二次方程的通用方法，适用于所有一元二次方程。</p>
<p>一元二次方程ax² + bx + c = 0 (a ≠ 0)的解为：</p>
<p class="formula">x = (-b ± √(b² - 4ac)) / (2a)</p>
<p>其中，b² - 4ac称为判别式，记作Δ（Delta）。</p>
<ul>
  <li>当Δ > 0时，方程有两个不相等的实数解</li>
  <li>当Δ = 0时，方程有两个相等的实数解</li>
  <li>当Δ < 0时，方程没有实数解</li>
</ul>
<p>例如，解方程：2x² - 5x + 2 = 0</p>
<p>解：a = 2, b = -5, c = 2</p>
<p>Δ = b² - 4ac = (-5)² - 4×2×2 = 25 - 16 = 9</p>
<p>x = (-b ± √Δ) / (2a) = (5 ± 3) / 4</p>
<p>x₁ = (5 + 3) / 4 = 2</p>
<p>x₂ = (5 - 3) / 4 = 0.5</p>
<p>答案：x = 2或x = 0.5</p>`;

    // 准备媒体内容
    const media = [
      {
        type: 'video',
        title: '一元二次方程简介视频',
        url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        metadata: { duration: '9:56', resolution: '720p' }
      },
      {
        type: 'image',
        title: '因式分解法图解',
        url: 'https://examples.com/factorization-method.jpg',
        metadata: { width: 800, height: 600, format: 'jpg' }
      },
      {
        type: 'video',
        title: '公式法视频讲解',
        url: 'https://d23dyxeqlo5psv.cloudfront.net/equation_solving.mp4',
        metadata: { duration: '7:23', resolution: '1080p' }
      }
    ];

    // 更新小单元内容
    await mathCourse.update({
      content,
      media
    });

    console.log(`成功初始化小单元 ${mathCourse.id} 的内容`);
  }
};

/**
 * 初始化管理员数据
 */
const initAdminData = async (courses) => {
  const users = [];
  
  // 创建管理员
  const admin = await User.create({
    username: 'admin',
    password: 'admin123',
    email: 'admin@learn.com',
    role: 'admin',
    name: '系统管理员'
  });
  users.push(admin);

  // 创建教师
  const teacher1 = await User.create({
    username: 'teacher1',
    password: 'teacher123',
    email: 'teacher1@learn.com',
    role: 'teacher',
    name: '张老师'
  });
  users.push(teacher1);

  const teacher2 = await User.create({
    username: 'teacher2',
    password: 'teacher123',
    email: 'teacher2@learn.com',
    role: 'teacher',
    name: '李老师'
  });
  users.push(teacher2);

  console.log(`创建了${users.length}个用户账户`);
  return users;
};

/**
 * 初始化测试学生数据
 */
const initStudentData = async () => {
  const students = [];

  // 创建测试学生
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
  // 创建知识点
  const knowledgePointsData = [
    { title: '一元二次方程基础', content: '一元二次方程的定义和基本概念', subject: 'math' },
    { title: '配方法', content: '使用配方法解一元二次方程', subject: 'math' },
    { title: '因式分解法', content: '使用因式分解法解一元二次方程', subject: 'math' },
    { title: '公式法', content: '使用求根公式解一元二次方程', subject: 'math' },
    { title: '二次函数基础', content: '二次函数的定义和基本性质', subject: 'math' },
    { title: '三角形性质', content: '三角形的基本性质和计算', subject: 'math' },
    { title: '几何计算', content: '几何图形的计算方法', subject: 'math' },
    { title: '概率基础', content: '概率的基本概念和计算', subject: 'math' }
  ];

  const knowledgePoints = [];
  for (const kpData of knowledgePointsData) {
    const kp = await KnowledgePoint.create(kpData);
    knowledgePoints.push(kp);
  }

  // 更新练习题的知识点关联
  const associations = [];
  for (const exercise of exercises) {
    // 根据练习题的单元ID分配知识点
    let kpIndices = [];
    if (exercise.unitId.includes('math-1-1')) kpIndices = [0];
    else if (exercise.unitId.includes('math-1-3')) kpIndices = [1];
    else if (exercise.unitId.includes('math-1-2')) kpIndices = [2];
    else if (exercise.unitId.includes('math-1-4')) kpIndices = [3];
    else if (exercise.unitId.includes('math-1-5') || exercise.unitId.includes('math-1-6')) kpIndices = [4];
    else if (exercise.unitId.includes('math-2-1')) kpIndices = [5, 6];
    else if (exercise.unitId.includes('math-3')) kpIndices = [7];
    
    const knowledgePointIds = [];
    for (const kpIndex of kpIndices) {
      if (knowledgePoints[kpIndex]) {
        knowledgePointIds.push(knowledgePoints[kpIndex].id);
        associations.push({ exercise: exercise.id, kp: knowledgePoints[kpIndex].title });
      }
    }
    
    // 更新练习题的知识点ID数组
    if (knowledgePointIds.length > 0) {
      await exercise.update({ knowledgePointIds });
    }
  }

  console.log(`创建了${knowledgePoints.length}个知识点，${associations.length}个关联`);
  return knowledgePoints;
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