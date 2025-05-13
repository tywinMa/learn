const { Subject, Unit } = require('../models');

/**
 * 初始化学科和单元
 */
const initSubjectsAndUnits = async () => {
  try {
    console.log('开始初始化学科和单元...');

    // 初始化学科数据
    const subjects = [
      {
        code: 'math',
        name: '数学',
        description: '包含数与代数、几何、统计与概率等内容',
        color: '#5EC0DE',
        icon: 'calculator',
        order: 1
      },
      {
        code: 'physics',
        name: '物理',
        description: '包含力学、电磁学、热学、光学等内容',
        color: '#FF9600',
        icon: 'flask',
        order: 2
      },
      {
        code: 'chemistry',
        name: '化学',
        description: '包含元素周期表、化学反应、有机化学等内容',
        color: '#58CC02',
        icon: 'flask-outline',
        order: 3
      },
      {
        code: 'biology',
        name: '生物',
        description: '包含细胞生物学、遗传学、生态学等内容',
        color: '#9E58FF',
        icon: 'leaf',
        order: 4
      }
    ];

    // 创建学科
    const createdSubjects = await Subject.bulkCreate(subjects);
    console.log(`成功创建 ${createdSubjects.length} 条学科记录`);

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

    // 生成次要颜色的函数
    const getLighterColor = (hexColor) => {
      // 从十六进制颜色中提取RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      // 计算较浅的颜色（混合白色）
      const lighterR = Math.min(255, r + 50);
      const lighterG = Math.min(255, g + 50);
      const lighterB = Math.min(255, b + 50);

      // 转回十六进制
      return `#${lighterR.toString(16).padStart(2, "0")}${lighterG.toString(16).padStart(2, "0")}${lighterB
        .toString(16)
        .padStart(2, "0")}`;
    };

    // 为每个学科创建单元
    const units = [];

    // 数学单元
    const mathSubject = createdSubjects.find(s => s.code === 'math');
    if (mathSubject) {
      // 大章节：代数
      units.push({
        id: `${mathSubject.code}-1`,
        subject: mathSubject.code,
        title: '数与代数',
        description: '包含代数基础、一元二次方程等内容',
        level: 1,
        order: 1,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary
      });

      // 小节：一元二次方程
      units.push({
        id: `${mathSubject.code}-1-1`,
        subject: mathSubject.code,
        title: '一元二次方程',
        description: '一元二次方程的解法和应用',
        parentId: `${mathSubject.code}-1`,
        level: 1,
        order: 2,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary
      });

      // 小节：因式分解
      units.push({
        id: `${mathSubject.code}-1-2`,
        subject: mathSubject.code,
        title: '因式分解',
        description: '多项式的因式分解方法',
        parentId: `${mathSubject.code}-1`,
        level: 1,
        order: 3,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary
      });

      // 小节：配方法
      units.push({
        id: `${mathSubject.code}-1-3`,
        subject: mathSubject.code,
        title: '配方法',
        description: '使用配方法解一元二次方程',
        parentId: `${mathSubject.code}-1`,
        level: 1,
        order: 4,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary
      });

      // 小节：公式法
      units.push({
        id: `${mathSubject.code}-1-4`,
        subject: mathSubject.code,
        title: '公式法',
        description: '使用公式法解一元二次方程',
        parentId: `${mathSubject.code}-1`,
        level: 1,
        order: 5,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary
      });

      // 小节：二次函数
      units.push({
        id: `${mathSubject.code}-1-5`,
        subject: mathSubject.code,
        title: '二次函数',
        description: '二次函数的性质和图像',
        parentId: `${mathSubject.code}-1`,
        level: 1,
        order: 6,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary
      });

      // 小节：二次函数应用
      units.push({
        id: `${mathSubject.code}-1-6`,
        subject: mathSubject.code,
        title: '二次函数应用',
        description: '二次函数在实际问题中的应用',
        parentId: `${mathSubject.code}-1`,
        level: 1,
        order: 7,
        color: chapterColors.math[0].primary,
        secondaryColor: chapterColors.math[0].secondary
      });

      // 大章节：几何
      units.push({
        id: `${mathSubject.code}-2`,
        subject: mathSubject.code,
        title: '几何',
        description: '包含平面几何、空间几何等内容',
        level: 2,
        order: 1,
        color: chapterColors.math[1].primary,
        secondaryColor: chapterColors.math[1].secondary
      });

      // 小节：三角形
      units.push({
        id: `${mathSubject.code}-2-1`,
        subject: mathSubject.code,
        title: '三角形',
        description: '三角形的性质和计算',
        parentId: `${mathSubject.code}-2`,
        level: 2,
        order: 2,
        color: chapterColors.math[1].primary,
        secondaryColor: chapterColors.math[1].secondary
      });

      // 小节：直角三角形
      units.push({
        id: `${mathSubject.code}-2-2`,
        subject: mathSubject.code,
        title: '直角三角形',
        description: '直角三角形的性质和勾股定理',
        parentId: `${mathSubject.code}-2`,
        level: 2,
        order: 3,
        color: chapterColors.math[1].primary,
        secondaryColor: chapterColors.math[1].secondary
      });

      // 小节：四边形
      units.push({
        id: `${mathSubject.code}-2-3`,
        subject: mathSubject.code,
        title: '四边形',
        description: '平行四边形、矩形、正方形等四边形的性质',
        parentId: `${mathSubject.code}-2`,
        level: 2,
        order: 4,
        color: chapterColors.math[1].primary,
        secondaryColor: chapterColors.math[1].secondary
      });

      // 小节：圆
      units.push({
        id: `${mathSubject.code}-2-4`,
        subject: mathSubject.code,
        title: '圆',
        description: '圆的性质和计算',
        parentId: `${mathSubject.code}-2`,
        level: 2,
        order: 5,
        color: chapterColors.math[1].primary,
        secondaryColor: chapterColors.math[1].secondary
      });

      // 大章节：统计与概率
      units.push({
        id: `${mathSubject.code}-3`,
        subject: mathSubject.code,
        title: '统计与概率',
        description: '包含统计学基础和概率论',
        level: 3,
        order: 1,
        color: chapterColors.math[2].primary,
        secondaryColor: chapterColors.math[2].secondary
      });

      // 小节：数据分析
      units.push({
        id: `${mathSubject.code}-3-1`,
        subject: mathSubject.code,
        title: '数据分析',
        description: '数据的收集、整理和分析',
        parentId: `${mathSubject.code}-3`,
        level: 3,
        order: 2,
        color: chapterColors.math[2].primary,
        secondaryColor: chapterColors.math[2].secondary
      });

      // 小节：概率基础
      units.push({
        id: `${mathSubject.code}-3-2`,
        subject: mathSubject.code,
        title: '概率基础',
        description: '随机事件与概率',
        parentId: `${mathSubject.code}-3`,
        level: 3,
        order: 3,
        color: chapterColors.math[2].primary,
        secondaryColor: chapterColors.math[2].secondary
      });

      // 小节：概率论基础
      units.push({
        id: `${mathSubject.code}-3-3`,
        subject: mathSubject.code,
        title: '概率论基础',
        description: '随机事件、条件概率、独立性等概念',
        parentId: `${mathSubject.code}-3`,
        level: 3,
        order: 4,
        color: chapterColors.math[2].primary,
        secondaryColor: chapterColors.math[2].secondary
      });
    }

    // 物理单元
    const physicsSubject = createdSubjects.find(s => s.code === 'physics');
    if (physicsSubject) {
      // 大章节：力学
      units.push({
        id: `${physicsSubject.code}-1`,
        subject: physicsSubject.code,
        title: '力学',
        description: '包含运动学、动力学等内容',
        level: 1,
        order: 1,
        color: chapterColors.physics[0].primary,
        secondaryColor: chapterColors.physics[0].secondary
      });

      // 小节：牛顿运动定律
      units.push({
        id: `${physicsSubject.code}-1-1`,
        subject: physicsSubject.code,
        title: '牛顿运动定律',
        description: '牛顿三大运动定律及其应用',
        parentId: `${physicsSubject.code}-1`,
        level: 1,
        order: 2,
        color: chapterColors.physics[0].primary,
        secondaryColor: chapterColors.physics[0].secondary
      });

      // 大章节：电磁学
      units.push({
        id: `${physicsSubject.code}-2`,
        subject: physicsSubject.code,
        title: '电磁学',
        description: '包含静电场、磁场等内容',
        level: 2,
        order: 1,
        color: chapterColors.physics[1].primary,
        secondaryColor: chapterColors.physics[1].secondary
      });

      // 小节：电场
      units.push({
        id: `${physicsSubject.code}-2-1`,
        subject: physicsSubject.code,
        title: '电场',
        description: '电场的性质和计算',
        parentId: `${physicsSubject.code}-2`,
        level: 2,
        order: 2,
        color: chapterColors.physics[1].primary,
        secondaryColor: chapterColors.physics[1].secondary
      });
    }

    // 化学单元
    const chemistrySubject = createdSubjects.find(s => s.code === 'chemistry');
    if (chemistrySubject) {
      // 大章节：元素与物质
      units.push({
        id: `${chemistrySubject.code}-1`,
        subject: chemistrySubject.code,
        title: '元素与物质',
        description: '包含元素周期表、元素性质等内容',
        level: 1,
        order: 1,
        color: chapterColors.chemistry[0].primary,
        secondaryColor: chapterColors.chemistry[0].secondary
      });

      // 小节：元素周期表
      units.push({
        id: `${chemistrySubject.code}-1-1`,
        subject: chemistrySubject.code,
        title: '元素周期表',
        description: '元素周期表的规律和应用',
        parentId: `${chemistrySubject.code}-1`,
        level: 1,
        order: 2,
        color: chapterColors.chemistry[0].primary,
        secondaryColor: chapterColors.chemistry[0].secondary
      });
    }

    // 生物单元
    const biologySubject = createdSubjects.find(s => s.code === 'biology');
    if (biologySubject) {
      // 大章节：细胞生物学
      units.push({
        id: `${biologySubject.code}-1`,
        subject: biologySubject.code,
        title: '细胞生物学',
        description: '包含细胞结构、细胞分裂等内容',
        level: 1,
        order: 1,
        color: chapterColors.biology[0].primary,
        secondaryColor: chapterColors.biology[0].secondary
      });

      // 小节：细胞结构
      units.push({
        id: `${biologySubject.code}-1-1`,
        subject: biologySubject.code,
        title: '细胞结构',
        description: '细胞的基本结构和功能',
        parentId: `${biologySubject.code}-1`,
        level: 1,
        order: 2,
        color: chapterColors.biology[0].primary,
        secondaryColor: chapterColors.biology[0].secondary
      });
    }

    // 创建单元
    const createdUnits = await Unit.bulkCreate(units);
    console.log(`成功创建 ${createdUnits.length} 条单元记录`);

  } catch (error) {
    console.error('初始化学科和单元出错:', error);
    throw error;
  }
};

module.exports = initSubjectsAndUnits; 