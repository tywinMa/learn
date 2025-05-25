const { Subject, Unit, Course } = require('../models');

/**
 * 初始化学科和单元
 */
const initSubjectsAndUnits = async () => {
  try {
    console.log('开始初始化学科和单元数据...');

    // 定义学科数据
    const subjects = [
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

    // 创建学科（如果不存在）
    const createdSubjects = [];
    for (const subjectData of subjects) {
      const [subject, created] = await Subject.findOrCreate({
        where: { code: subjectData.code },
        defaults: subjectData
      });
      createdSubjects.push(subject);
      if (created) {
        console.log(`学科 ${subject.name} 创建成功`);
      } else {
        console.log(`学科 ${subject.name} 已存在`);
      }
    }

    // 定义章节颜色库
    const chapterColors = {
      math: [
        { primary: '#58CC02', secondary: '#7FDD33' }, // 数与代数
        { primary: '#1CB0F6', secondary: '#53C6FF' }, // 几何
        { primary: '#FF9600', secondary: '#FFB84D' }  // 统计与概率
      ],
      physics: [
        { primary: '#FF4B4B', secondary: '#FF7878' }, // 力学
        { primary: '#9E58FF', secondary: '#BC8CFF' }  // 电磁学
      ],
      chemistry: [
        { primary: '#DD6154', secondary: '#E68A80' }  // 元素与物质
      ],
      biology: [
        { primary: '#8CB153', secondary: '#ADC782' }  // 细胞生物学
      ]
    };

    // 为每个学科创建大单元和小单元
    const units = [];
    const courses = [];

    // 数学单元
    const mathSubject = createdSubjects.find(s => s.code === 'math');
    if (mathSubject) {
      // 大单元：代数
      const algebraUnit = {
        id: `${mathSubject.code}-1`,
        subject: mathSubject.code,
        title: '数与代数',
        description: '包含代数基础、一元二次方程等内容',
        order: 1,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary,
      };
      units.push(algebraUnit);

      // 小单元：代数相关
      const algebraCourses = [
        {
          id: `${mathSubject.code}-1-1`,
          subject: mathSubject.code,
          unitId: algebraUnit.id,
          title: '一元二次方程',
          description: '一元二次方程的解法和应用',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-1-2`,
          subject: mathSubject.code,
          unitId: algebraUnit.id,
          title: '因式分解',
          description: '多项式的因式分解方法',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-1-3`,
          subject: mathSubject.code,
          unitId: algebraUnit.id,
          title: '配方法',
          description: '使用配方法解一元二次方程',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-1-4`,
          subject: mathSubject.code,
          unitId: algebraUnit.id,
          title: '第一次月考',
          description: '使用公式法解一元二次方程',
          unitType: 'exercise',
          position: 'right'
        },
        {
          id: `${mathSubject.code}-1-5`,
          subject: mathSubject.code,
          unitId: algebraUnit.id,
          title: '二次函数',
          description: '二次函数的性质和图像',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-1-6`,
          subject: mathSubject.code,
          unitId: algebraUnit.id,
          title: '二次函数应用',
          description: '二次函数在实际问题中的应用',
          unitType: 'normal'
        }
      ];
      courses.push(...algebraCourses);

      // 大单元：几何
      const geometryUnit = {
        id: `${mathSubject.code}-2`,
        subject: mathSubject.code,
        title: '几何',
        description: '包含平面几何、空间几何等内容',
        order: 2,
        color: chapterColors.math[1].primary,
        secondaryColor: chapterColors.math[1].secondary,
      };
      units.push(geometryUnit);

      // 小单元：几何相关
      const geometryCourses = [
        {
          id: `${mathSubject.code}-2-1`,
          subject: mathSubject.code,
          unitId: geometryUnit.id,
          title: '三角形',
          description: '三角形的性质和计算',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-2-2`,
          subject: mathSubject.code,
          unitId: geometryUnit.id,
          title: '直角三角形',
          description: '直角三角形的性质和勾股定理',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-2-3`,
          subject: mathSubject.code,
          unitId: geometryUnit.id,
          title: '四边形',
          description: '平行四边形、矩形、正方形等四边形的性质',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-2-4`,
          subject: mathSubject.code,
          unitId: geometryUnit.id,
          title: '圆',
          description: '圆的性质和计算',
          unitType: 'normal'
        }
      ];
      courses.push(...geometryCourses);

      // 大单元：统计与概率
      const statisticsUnit = {
        id: `${mathSubject.code}-3`,
        subject: mathSubject.code,
        title: '统计与概率',
        description: '包含统计学基础和概率论',
        order: 3,
        color: chapterColors.math[2].primary,
        secondaryColor: chapterColors.math[2].secondary,
      };
      units.push(statisticsUnit);

      // 小单元：统计与概率相关
      const statisticsCourses = [
        {
          id: `${mathSubject.code}-3-1`,
          subject: mathSubject.code,
          unitId: statisticsUnit.id,
          title: '数据分析',
          description: '数据的收集、整理和分析',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-3-2`,
          subject: mathSubject.code,
          unitId: statisticsUnit.id,
          title: '概率基础',
          description: '随机事件与概率',
          unitType: 'normal'
        },
        {
          id: `${mathSubject.code}-3-3`,
          subject: mathSubject.code,
          unitId: statisticsUnit.id,
          title: '概率论基础',
          description: '随机事件、条件概率、独立性等概念',
          unitType: 'normal'
        }
      ];
      courses.push(...statisticsCourses);
    }

    // 物理单元
    const physicsSubject = createdSubjects.find(s => s.code === 'physics');
    if (physicsSubject) {
      // 大单元：力学
      const mechanicsUnit = {
        id: `${physicsSubject.code}-1`,
        subject: physicsSubject.code,
        title: '力学',
        description: '包含运动学、动力学等内容',
        order: 1,
        color: chapterColors.physics[0].primary,
        secondaryColor: chapterColors.physics[0].secondary,
      };
      units.push(mechanicsUnit);

      // 小单元：力学相关
      const mechanicsCourses = [
        {
          id: `${physicsSubject.code}-1-1`,
          subject: physicsSubject.code,
          unitId: mechanicsUnit.id,
          title: '牛顿运动定律',
          description: '牛顿三大运动定律及其应用',
          unitType: 'normal'
        }
      ];
      courses.push(...mechanicsCourses);

      // 大单元：电磁学
      const electromagnetismUnit = {
        id: `${physicsSubject.code}-2`,
        subject: physicsSubject.code,
        title: '电磁学',
        description: '包含静电场、磁场等内容',
        order: 2,
        color: chapterColors.physics[1].primary,
        secondaryColor: chapterColors.physics[1].secondary,
      };
      units.push(electromagnetismUnit);

      // 小单元：电磁学相关
      const electromagnetismCourses = [
        {
          id: `${physicsSubject.code}-2-1`,
          subject: physicsSubject.code,
          unitId: electromagnetismUnit.id,
          title: '电场',
          description: '电场的性质和计算',
          unitType: 'normal'
        }
      ];
      courses.push(...electromagnetismCourses);
    }

    // 化学单元
    const chemistrySubject = createdSubjects.find(s => s.code === 'chemistry');
    if (chemistrySubject) {
      // 大单元：元素与物质
      const elementsUnit = {
        id: `${chemistrySubject.code}-1`,
        subject: chemistrySubject.code,
        title: '元素与物质',
        description: '包含元素周期表、元素性质等内容',
        order: 1,
        color: chapterColors.chemistry[0].primary,
        secondaryColor: chapterColors.chemistry[0].secondary,
      };
      units.push(elementsUnit);

      // 小单元：元素与物质相关
      const elementsCourses = [
        {
          id: `${chemistrySubject.code}-1-1`,
          subject: chemistrySubject.code,
          unitId: elementsUnit.id,
          title: '元素周期表',
          description: '元素周期表的规律和应用',
          unitType: 'normal'
        }
      ];
      courses.push(...elementsCourses);
    }

    // 生物单元
    const biologySubject = createdSubjects.find(s => s.code === 'biology');
    if (biologySubject) {
      // 大单元：细胞生物学
      const cellBiologyUnit = {
        id: `${biologySubject.code}-1`,
        subject: biologySubject.code,
        title: '细胞生物学',
        description: '包含细胞结构、细胞分裂等内容',
        order: 1,
        color: chapterColors.biology[0].primary,
        secondaryColor: chapterColors.biology[0].secondary,
      };
      units.push(cellBiologyUnit);

      // 小单元：细胞生物学相关
      const cellBiologyCourses = [
        {
          id: `${biologySubject.code}-1-1`,
          subject: biologySubject.code,
          unitId: cellBiologyUnit.id,
          title: '细胞结构',
          description: '细胞的基本结构和功能',
          unitType: 'normal'
        }
      ];
      courses.push(...cellBiologyCourses);
    }

    // 创建大单元（如果不存在）
    const createdUnits = [];
    for (const unitData of units) {
      const [unit, created] = await Unit.findOrCreate({
        where: { id: unitData.id },
        defaults: unitData
      });
      createdUnits.push(unit);
      if (created) {
        console.log(`大单元 ${unit.title} 创建成功`);
      } else {
        console.log(`大单元 ${unit.title} 已存在`);
      }
    }

    // 创建小单元（如果不存在）
    const createdCourses = [];
    for (const courseData of courses) {
      const [course, created] = await Course.findOrCreate({
        where: { id: courseData.id },
        defaults: courseData
      });
      createdCourses.push(course);
      if (created) {
        console.log(`小单元 ${course.title} 创建成功`);
      } else {
        console.log(`小单元 ${course.title} 已存在`);
      }
    }

    // 更新大单元的courseIds字段
    for (const unit of createdUnits) {
      const unitCourses = createdCourses.filter(course => course.unitId === unit.id);
      const courseIds = unitCourses.map(course => course.id);
      await unit.update({ courseIds });
      console.log(`大单元 ${unit.title} 的小单元列表已更新: ${courseIds.join(', ')}`);
    }

    console.log('学科和单元数据初始化完成');
    return { createdSubjects, createdUnits, createdCourses };
  } catch (error) {
    console.error('初始化学科和单元数据出错:', error);
    throw error;
  }
};

module.exports = initSubjectsAndUnits; 