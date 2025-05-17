const { Exercise, Subject, Unit } = require('../models');

/**
 * 为几何单元添加练习题
 */
const addGeometryExercises = async () => {
  try {
    console.log('开始为几何单元添加练习题...');

    // 几何单元ID：math-2-1 (三角形单元)
    const unitId = 'math-2-1';
    const subjectCode = 'math';

    // 检查单元是否存在
    const unit = await Unit.findOne({ where: { id: unitId } });
    if (!unit) {
      throw new Error(`单元 ${unitId} 不存在，请先初始化学科数据`);
    }

    // 检查单元是否已有练习题
    const existingCount = await Exercise.count({ where: { unitId } });
    console.log(`单元 ${unitId} 已有 ${existingCount} 道练习题`);

    // 要添加的选择题
    const choiceExercises = [
      {
        id: `${unitId}-1`,
        unitId: unitId,
        subject: subjectCode,
        question: '三角形内角和等于多少度？',
        options: [
          '90度',
          '180度',
          '270度',
          '360度'
        ],
        correctAnswer: 1,
        type: 'choice',
        difficulty: 1,
        explanation: '三角形的内角和等于180度，这是平面几何的基本定理之一。'
      },
      {
        id: `${unitId}-2`,
        unitId: unitId,
        subject: subjectCode,
        question: '等边三角形的每个内角度数是多少？',
        options: [
          '30度',
          '45度',
          '60度',
          '90度'
        ],
        correctAnswer: 2,
        type: 'choice',
        difficulty: 1,
        explanation: '等边三角形的三个内角相等，且三角形内角和为180度，所以每个内角为180÷3=60度。'
      },
      {
        id: `${unitId}-3`,
        unitId: unitId,
        subject: subjectCode,
        question: '下列哪个三角形一定是直角三角形？',
        options: [
          '三边长分别为3、4、5的三角形',
          '三边长分别为1、2、3的三角形',
          '三边长分别为5、6、7的三角形',
          '三边长分别为2、3、4的三角形'
        ],
        correctAnswer: 0,
        type: 'choice',
        difficulty: 2,
        explanation: '根据勾股定理，如果三角形的三边满足a²+b²=c²（其中c为最长边），则此三角形是直角三角形。3²+4²=9+16=25=5²，所以边长为3、4、5的三角形是直角三角形。'
      },
    ];

    // 批量创建练习题
    for (const exercise of choiceExercises) {
      const [newExercise, created] = await Exercise.findOrCreate({
        where: { id: exercise.id },
        defaults: exercise
      });

      if (created) {
        console.log(`已添加练习题: ${newExercise.id}`);
      } else {
        console.log(`练习题 ${newExercise.id} 已存在，跳过`);
      }
    }

    console.log('几何单元练习题添加完成！');
    return true;
  } catch (error) {
    console.error('添加几何单元练习题出错:', error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  addGeometryExercises()
    .then(() => {
      console.log('几何单元练习题添加脚本执行完毕');
      process.exit(0);
    })
    .catch(err => {
      console.error('几何单元练习题添加脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = addGeometryExercises; 