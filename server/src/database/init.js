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
      '1-5': [
        {
          id: '1-5-1',
          question: '二次函数 f(x) = ax² + bx + c 的图像是什么形状？',
          options: ['抛物线', '直线', '双曲线', '圆形'],
          correctAnswer: 0,
        },
        {
          id: '1-5-2',
          question: '当 a > 0 时，二次函数 f(x) = ax² + bx + c 的图像开口方向是？',
          options: ['向上', '向下', '向左', '向右'],
          correctAnswer: 0,
        },
        {
          id: '1-5-3',
          question: '二次函数 f(x) = x² - 6x + 8 的顶点坐标是多少？',
          options: ['(3, -1)', '(3, 1)', '(-3, 1)', '(-3, -1)'],
          correctAnswer: 0,
        },
        {
          id: '1-5-4',
          question: '二次函数 f(x) = -2x² + 4x - 1 的最大值在哪个点取得？',
          options: ['x = 1', 'x = 2', 'x = -1', 'x = 0'],
          correctAnswer: 0,
        }
      ],
      '1-6': [
        {
          id: '1-6-1',
          question: '某物体从高处自由落下，其下落距离s与时间t的关系为s = 4.9t²，则2秒后下落了多少米？',
          options: ['4.9米', '9.8米', '19.6米', '39.2米'],
          correctAnswer: 2,
        },
        {
          id: '1-6-2',
          question: '小明以每秒5米的速度向一堵墙扔球，球离手时距离墙10米，则球飞行的总时间约为多少秒？',
          options: ['1秒', '2秒', '3秒', '4秒'],
          correctAnswer: 2,
        },
        {
          id: '1-6-3',
          question: '一块长方形农田的周长为60米，为了使其面积最大，长和宽应各为多少米？',
          options: ['15米和15米', '20米和10米', '30米和0米', '25米和5米'],
          correctAnswer: 0,
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
      '2-3': [
        {
          id: '2-3-1',
          question: '平行四边形的定义是什么？',
          options: [
            '对边平行且相等的四边形',
            '四条边都相等的四边形',
            '有一组对边平行的四边形',
            '对角线互相平分的四边形'
          ],
          correctAnswer: 0,
        },
        {
          id: '2-3-2',
          question: '平行四边形的对角线互相平分，这句话的正确性是？',
          options: ['正确', '错误', '部分正确', '无法判断'],
          correctAnswer: 0,
        },
        {
          id: '2-3-3',
          question: '如果一个四边形的对边分别平行，那么这个四边形一定是？',
          options: ['平行四边形', '菱形', '矩形', '正方形'],
          correctAnswer: 0,
        }
      ],
      '2-4': [
        {
          id: '2-4-1',
          question: '圆的切线与半径的夹角是多少度？',
          options: ['90度', '60度', '45度', '30度'],
          correctAnswer: 0,
        },
        {
          id: '2-4-2',
          question: '如果两个圆相交，它们最多有几个交点？',
          options: ['1个', '2个', '3个', '4个'],
          correctAnswer: 1,
        },
        {
          id: '2-4-3',
          question: '圆内接四边形的对角之和是多少度？',
          options: ['180度', '270度', '360度', '540度'],
          correctAnswer: 2,
        },
        {
          id: '2-4-4',
          question: '一个圆的面积是64π平方厘米，则它的半径是多少厘米？',
          options: ['4', '8', '16', '32'],
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
      ],
      '3-3': [
        {
          id: '3-3-1',
          question: '如果事件A和事件B互斥，则 P(A∩B) 等于多少？',
          options: ['0', 'P(A)×P(B)', 'P(A)+P(B)', '1-P(A)-P(B)'],
          correctAnswer: 0,
        },
        {
          id: '3-3-2',
          question: '如果事件A和事件B独立，则 P(A|B) 等于多少？',
          options: ['P(A)', 'P(B)', 'P(A)×P(B)', 'P(A)/P(B)'],
          correctAnswer: 0,
        },
        {
          id: '3-3-3',
          question: '一个袋子里有3个红球和2个蓝球，随机取出2个球，取出的两个球都是红球的概率是多少？',
          options: ['3/10', '3/5', '9/25', '6/25'],
          correctAnswer: 0,
        },
        {
          id: '3-3-4',
          question: '如果一个随机变量X服从标准正态分布，则 P(X > 0) 等于多少？',
          options: ['0.5', '0.6827', '0.9545', '0.9973'],
          correctAnswer: 0,
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
