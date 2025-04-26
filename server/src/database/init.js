const { Exercise, syncDatabase } = require('../models');

// 初始化数据库并导入练习题数据
const initDatabase = async () => {
  try {
    // 同步数据库模型
    await syncDatabase();

    // 检查数据库中是否已有练习题
    const count = await Exercise.count();
    if (count > 0) {
      console.log(`数据库中已有 ${count} 道练习题，跳过导入`);
      return;
    }

    // 导入练习题数据
    console.log('开始导入练习题数据...');

    // 练习题数据
    const exercisesData = {
      // 第一单元
      '1-1': [
        {
          id: '1-1-1',
          question: '解一元二次方程：x² - 5x + 6 = 0',
          options: ['x = 2 或 x = 3', 'x = -2 或 x = -3', 'x = 2 或 x = -3', 'x = -2 或 x = 3'],
          correctAnswer: 0,
        },
        {
          id: '1-1-2',
          question: '已知三角形的两边长分别为3和4，且夹角为60°，求第三边的长度。',
          options: ['5', '√13', '√19', '7'],
          correctAnswer: 2,
        },
        {
          id: '1-1-3',
          question: '函数 f(x) = -2x² + 4x - 1 的最大值是多少？',
          options: ['1', '2', '3', '4'],
          correctAnswer: 0,
        }
      ],
      '1-2': [
        {
          id: '1-2-1',
          question: '因式分解：x² - 9',
          options: ['(x+3)(x-3)', '(x+9)(x-1)', '(x-3)²', '(x+3)²'],
          correctAnswer: 0,
        },
        {
          id: '1-2-2',
          question: '因式分解：x² + 6x + 9',
          options: ['(x+3)²', '(x-3)²', '(x+3)(x+3)', '(x+9)(x+1)'],
          correctAnswer: 0,
        },
        {
          id: '1-2-3',
          question: '因式分解：x² - 2x - 8',
          options: ['(x-4)(x+2)', '(x+4)(x-2)', '(x-4)(x-2)', '(x+4)(x+2)'],
          correctAnswer: 0,
        }
      ],
      '1-3': [
        {
          id: '1-3-1',
          question: '使用配方法解一元二次方程：x² + 6x + 5 = 0',
          options: ['x = -5 或 x = -1', 'x = -3 ± 2', 'x = -3 ± √4', 'x = -3 ± 2i'],
          correctAnswer: 0,
        },
        {
          id: '1-3-2',
          question: '使用配方法将 x² - 4x + 7 改写成完全平方式',
          options: ['(x-2)² + 3', '(x+2)² + 3', '(x-2)² - 3', '(x+2)² - 3'],
          correctAnswer: 0,
        }
      ],
      '1-4': [
        {
          id: '1-4-1',
          question: '使用公式法解一元二次方程：2x² - 7x + 3 = 0',
          options: ['x = 3 或 x = 1/2', 'x = 3/2 或 x = 1', 'x = 2 或 x = 3/4', 'x = 1/2 或 x = 3'],
          correctAnswer: 1,
        },
        {
          id: '1-4-2',
          question: '一元二次方程 ax² + bx + c = 0 的判别式为多少？',
          options: ['b² - 4ac', 'b² + 4ac', '4ac - b²', '√(b² - 4ac)'],
          correctAnswer: 0,
        },
        {
          id: '1-4-3',
          question: '若一元二次方程 x² + px + 4 = 0 有两个相等的实根，则p的值为多少？',
          options: ['±4', '±2', '±8', '±√8'],
          correctAnswer: 1,
        }
      ],

      // 第二单元
      '2-1': [
        {
          id: '2-1-1',
          question: '如果两个三角形相似，则下列哪项一定成立？',
          options: ['对应角相等', '对应边成比例', '面积相等', '周长相等'],
          correctAnswer: 0,
        },
        {
          id: '2-1-2',
          question: '如果两个三角形的三个角分别相等，那么这两个三角形是什么关系？',
          options: ['全等', '相似', '等边', '等腰'],
          correctAnswer: 1,
        }
      ],
      '2-2': [
        {
          id: '2-2-1',
          question: '勾股定理表述为：',
          options: [
            '直角三角形两直角边的平方和等于斜边的平方',
            '任意三角形三边的平方和等于180°',
            '等边三角形的高等于边长的√3/2',
            '三角形内角和等于180°'
          ],
          correctAnswer: 0,
        },
        {
          id: '2-2-2',
          question: '已知直角三角形的两条直角边长分别为3和4，则斜边长为多少？',
          options: ['5', '7', '√25', '√7'],
          correctAnswer: 0,
        }
      ],

      // 第三单元
      '3-1': [
        {
          id: '3-1-1',
          question: '以下哪个是描述数据集中趋势的统计量？',
          options: ['平均数', '标准差', '四分位距', '极差'],
          correctAnswer: 0,
        },
        {
          id: '3-1-2',
          question: '如果一组数据的标准差为0，这意味着什么？',
          options: ['所有数据都相等', '数据呈正态分布', '数据的平均数为0', '数据的中位数等于平均数'],
          correctAnswer: 0,
        }
      ],
      '3-2': [
        {
          id: '3-2-1',
          question: '从一副标准的扑克牌中随机抽一张牌，抽到红桃的概率是多少？',
          options: ['1/4', '1/2', '1/13', '13/52'],
          correctAnswer: 0,
        },
        {
          id: '3-2-2',
          question: '投掷两个骰子，点数和为7的概率是多少？',
          options: ['1/6', '7/36', '1/12', '1/36'],
          correctAnswer: 1,
        }
      ]
    };

    // 将练习题数据转换为数组格式
    const exercisesToImport = [];

    for (const unitId in exercisesData) {
      const exercises = exercisesData[unitId];
      exercises.forEach(exercise => {
        exercisesToImport.push({
          id: exercise.id,
          unitId,
          question: exercise.question,
          options: exercise.options,
          correctAnswer: exercise.correctAnswer
        });
      });
    }

    // 批量创建练习题
    await Exercise.bulkCreate(exercisesToImport);

    console.log(`成功导入 ${exercisesToImport.length} 道练习题`);
  } catch (error) {
    console.error('初始化数据库时出错:', error);
  }
};

module.exports = initDatabase;
