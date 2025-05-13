const { Exercise, Subject, Unit } = require('../models');

/**
 * 添加新类型的练习题
 */
const addNewExerciseTypes = async () => {
  try {
    console.log('开始添加多样化习题...');

    // 获取数学学科
    const mathSubject = await Subject.findOne({ where: { code: 'math' } });
    if (!mathSubject) {
      throw new Error('找不到数学学科，请先初始化学科数据');
    }
    const mathSubjectId = mathSubject.id;
    const mathSubjectCode = mathSubject.code;

    // 匹配题
    const matchingExercises = [
      {
        id: `${mathSubjectCode}-1-2-4`,
        unitId: 'math-1-2',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '将左侧的因式分解式与右侧的表达式进行匹配',
        type: 'matching',
        options: {
          left: ['x² - 4', 'x² - 4x + 4', 'x² + 4x + 4', 'x² + 6x + 9'],
          right: ['(x+2)²', '(x-2)²', '(x+3)²', '(x-2)(x+2)']
        },
        correctAnswer: [3, 1, 0, 2],  // 索引匹配：左侧项目与右侧项目的配对索引
        explanation: 'x² - 4 = (x-2)(x+2)，x² - 4x + 4 = (x-2)²，x² + 4x + 4 = (x+2)²，x² + 6x + 9 = (x+3)²',
        difficulty: 2
      },
      {
        id: `${mathSubjectCode}-1-5-5`,
        unitId: 'math-1-5',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '匹配函数与其图像特征',
        type: 'matching',
        options: {
          left: ['y = x²', 'y = -x²', 'y = (x-2)²', 'y = x² + 3'],
          right: ['抛物线开口向下', '抛物线向上平移3个单位', '抛物线向右平移2个单位', '标准抛物线']
        },
        correctAnswer: [3, 0, 2, 1],
        explanation: 'y = x²是标准抛物线，y = -x²抛物线开口向下，y = (x-2)²是向右平移2个单位，y = x² + 3是向上平移3个单位',
        difficulty: 2
      }
    ];

    // 填空题
    const fillBlankExercises = [
      {
        id: `${mathSubjectCode}-1-3-3`,
        unitId: 'math-1-3',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '使用配方法解一元二次方程 x² + 6x + 8 = 0。\n第一步，移项：x² + 6x = -8\n第二步，配方：x² + 6x + ____ = -8 + ____\n第三步，因式分解：(x + ____)² = ____\n第四步，求解：x + 3 = ±____，即x = ____ 或 x = ____',
        type: 'fill_blank',
        options: null,
        correctAnswer: ['9', '9', '3', '1', '1', '-4', '-2'],
        explanation: '配方: x² + 6x + 9 = -8 + 9 → (x + 3)² = 1 → x + 3 = ±1 → x = -2 或 x = -4',
        difficulty: 3
      },
      {
        id: `${mathSubjectCode}-2-2-3`,
        unitId: 'math-2-2',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '已知直角三角形的斜边长为10，一条直角边长为6，则另一条直角边长为____。',
        type: 'fill_blank',
        options: null,
        correctAnswer: ['8'],
        explanation: '根据勾股定理，c² = a² + b²，10² = 6² + b²，b² = 100 - 36 = 64，b = 8',
        difficulty: 2
      }
    ];

    // 排序题
    const sortExercises = [
      {
        id: `${mathSubjectCode}-1-4-4`,
        unitId: 'math-1-4',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '按照解一元二次方程的正确步骤排序',
        type: 'sort',
        options: [
          '计算判别式Δ = b² - 4ac',
          '将方程写成标准形式ax² + bx + c = 0',
          '根据公式x = (-b ± √Δ) / 2a求解',
          '判断方程根的情况(Δ > 0, Δ = 0, 或 Δ < 0)'
        ],
        correctAnswer: [1, 0, 3, 2],
        explanation: '解一元二次方程的步骤：首先写成标准形式，然后计算判别式，接着判断根的情况，最后使用公式求解',
        difficulty: 2
      }
    ];

    // 拖拽题
    const dragDropExercises = [
      {
        id: `${mathSubjectCode}-1-5-6`,
        unitId: 'math-1-5',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '将函数图像的各个部分拖放到正确的位置',
        type: 'drag_drop',
        options: {
          elements: ['顶点', '对称轴', 'x轴截距', 'y轴截距'],
          positions: ['(h,k)', 'x = h', 'x = -c/a 或 x = 0', 'y = c']
        },
        correctAnswer: [0, 1, 2, 3],
        explanation: '二次函数y = a(x-h)²+k的顶点是(h,k)，对称轴是x = h，x轴截距是方程a(x-h)²+k = 0的解，y轴截距是y = f(0)',
        difficulty: 3,
        media: {
          type: 'image',
          url: 'https://example.com/quadratic_function.png'
        }
      }
    ];

    // 数学计算题
    const mathExercises = [
      {
        id: `${mathSubjectCode}-3-3-5`,
        unitId: 'math-3-3',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '有一袋10个球，其中3个红球、4个蓝球和3个绿球。随机抽取2个球，求抽到的球颜色相同的概率。',
        type: 'math',
        options: null,
        correctAnswer: {
          value: '3/10',
          steps: [
            '颜色相同意味着:抽2个红球、抽2个蓝球或抽2个绿球',
            'P(2红) = C(3,2)/C(10,2) = 3/45',
            'P(2蓝) = C(4,2)/C(10,2) = 6/45',
            'P(2绿) = C(3,2)/C(10,2) = 3/45',
            'P(颜色相同) = 3/45 + 6/45 + 3/45 = 12/45 = 4/15',
            'P(颜色相同) = 4/15'
          ]
        },
        explanation: '总的可能性是C(10,2)=45种。其中两球颜色相同的情况有:C(3,2)=3种方式抽2个红球，C(4,2)=6种方式抽2个蓝球，C(3,2)=3种方式抽2个绿球，共12种，所以概率是12/45=4/15。',
        difficulty: 4,
        hints: [
          '思考哪些情况下两个球的颜色是相同的',
          '计算从每种颜色中选择2个球的组合数',
          '总的可能性是从10个球中选择2个的组合数'
        ]
      },
      {
        id: `${mathSubjectCode}-1-6-4`,
        unitId: 'math-1-6',
        subject: mathSubjectCode,
        subjectId: mathSubjectId,
        subjectCode: mathSubjectCode,
        question: '有一个长方形，周长固定为20米。如果要使面积最大，请计算长和宽各是多少？并证明这是最大值。',
        type: 'math',
        options: null,
        correctAnswer: {
          value: '长=宽=5',
          steps: [
            '设长为x，宽为y',
            '周长：2x + 2y = 20',
            '解得：y = 10 - x',
            '面积：S = x·y = x(10-x) = 10x - x²',
            '求导：S\'(x) = 10 - 2x',
            '令S\'(x) = 0，解得x = 5',
            '此时y = 10 - 5 = 5',
            '所以长=宽=5时，面积最大'
          ]
        },
        explanation: '当周长固定时，正方形的面积最大。证明：设长为x，宽为y，周长2x+2y=20，面积S=xy=x(10-x)=10x-x²，求导得S\'(x)=10-2x，当S\'(x)=0时x=5，此时y=5，所以是正方形。',
        difficulty: 4,
        hints: [
          '使用变量表示长和宽',
          '通过周长约束消去一个变量',
          '面积是关于一个变量的二次函数',
          '使用微积分求最值'
        ]
      }
    ];

    // 综合所有新类型习题
    const allNewExercises = [
      ...matchingExercises,
      ...fillBlankExercises,
      ...sortExercises,
      ...dragDropExercises,
      ...mathExercises
    ];

    // 检查每个习题对应的单元是否存在
    for (let i = 0; i < allNewExercises.length; i++) {
      const exercise = allNewExercises[i];
      const unitExists = await Unit.findOne({ where: { id: exercise.unitId } });
      if (!unitExists) {
        console.log(`单元 ${exercise.unitId} 不存在，跳过添加习题 ${exercise.id}`);
        // 从数组中移除这个习题
        allNewExercises.splice(i, 1);
        i--; // 调整索引，因为数组长度变小了
        continue;
      }

      // 检查这些习题是否已存在
      const exists = await Exercise.findOne({ where: { id: exercise.id } });
      if (!exists) {
        try {
          await Exercise.create(exercise);
          console.log(`成功添加${exercise.type}类型习题: ${exercise.id}`);
        } catch (err) {
          console.error(`添加习题${exercise.id}失败:`, err.message);
        }
      } else {
        console.log(`习题${exercise.id}已存在，更新内容...`);
        try {
          await Exercise.update(exercise, { where: { id: exercise.id } });
        } catch (err) {
          console.error(`更新习题${exercise.id}失败:`, err.message);
        }
      }
    }

    console.log(`多样化习题处理完成`);
  } catch (error) {
    console.error('添加多样化习题出错:', error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  addNewExerciseTypes().then(() => {
    console.log('多样化习题添加完毕');
    process.exit();
  }).catch(err => {
    console.error('添加多样化习题失败:', err);
    process.exit(1);
  });
}

module.exports = addNewExerciseTypes; 