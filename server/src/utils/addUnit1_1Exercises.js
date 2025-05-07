const { Exercise, sequelize } = require('../models');

/**
 * 为单元1-1添加多种类型的练习题
 */
const addUnit1_1Exercises = async () => {
  try {
    console.log('开始为单元1-1添加多样化练习题...');
    
    const unitId = '1-1'; // 第一阶段第一部分
    
    // 检查单元是否已有练习题
    const existingCount = await Exercise.count({ where: { unitId } });
    console.log(`单元 ${unitId} 已有 ${existingCount} 道练习题`);
    
    // 要添加的选择题
    const choiceExercises = [
      {
        id: '1-1-1',
        unitId,
        question: '以下哪个是解一元一次方程 3x + 6 = 0 的正确步骤？',
        options: [
          '3x = -6，x = -2',
          '3x = 6，x = 2',
          '3x = -6，x = 2',
          '3x = 6，x = -2'
        ],
        correctAnswer: 0,
        type: 'choice',
        difficulty: 1,
        explanation: '解一元一次方程的步骤：移项得 3x = -6，然后两边同除以3得 x = -2'
      },
      {
        id: '1-1-2',
        unitId,
        question: '实数的基本运算中，以下哪个表达式计算结果为负数？',
        options: [
          '|-5| + |5|',
          '|-7| - |3|',
          '|-4| - |6|',
          '|-8| × |-2|'
        ],
        correctAnswer: 2,
        type: 'choice',
        difficulty: 2,
        explanation: '|-4| - |6| = 4 - 6 = -2，结果为负数'
      },
      {
        id: '1-1-3',
        unitId,
        question: '若一次函数f(x) = 2x - 3，则f(2)的值是？',
        options: ['1', '2', '3', '4'],
        correctAnswer: 0,
        type: 'choice',
        difficulty: 1,
        explanation: 'f(2) = 2×2 - 3 = 4 - 3 = 1'
      }
    ];
    
    // 要添加的填空题
    const fillBlankExercises = [
      {
        id: '1-1-4',
        unitId,
        question: '解不等式 2x - 5 > 3，解得 x > ____。',
        type: 'fill_blank',
        correctAnswer: ['4'],
        difficulty: 2,
        explanation: '2x - 5 > 3，移项得 2x > 8，两边除以2得 x > 4'
      },
      {
        id: '1-1-5',
        unitId,
        question: '已知函数f(x) = ax² + bx + c的图像通过点(1, 2)、(2, 1)和(-1, 4)，则a = ____, b = ____, c = ____。',
        type: 'fill_blank',
        correctAnswer: ['1', '-4', '5'],
        difficulty: 3,
        explanation: '将三个点代入函数方程式，得到三个方程：a + b + c = 2，4a + 2b + c = 1，a - b + c = 4。解方程组得a = 1, b = -4, c = 5'
      }
    ];
    
    // 要添加的匹配题
    const matchingExercises = [
      {
        id: '1-1-6',
        unitId,
        question: '将左侧的代数式与右侧的等价形式匹配',
        type: 'matching',
        options: {
          left: ['a² - b²', 'a² + 2ab + b²', 'a² - 2ab + b²', 'a³ - b³'],
          right: ['(a+b)²', '(a-b)(a+b)', '(a-b)²', '(a-b)(a²+ab+b²)']
        },
        correctAnswer: [1, 0, 2, 3],
        difficulty: 2,
        explanation: 'a² - b² = (a-b)(a+b)，a² + 2ab + b² = (a+b)²，a² - 2ab + b² = (a-b)²，a³ - b³ = (a-b)(a²+ab+b²)'
      },
      {
        id: '1-1-7',
        unitId,
        question: '匹配函数与其图像特征',
        type: 'matching',
        options: {
          left: ['y = x', 'y = |x|', 'y = x²', 'y = 1/x'],
          right: ['抛物线', '绝对值函数图像', '双曲线', '直线']
        },
        correctAnswer: [3, 1, 0, 2],
        difficulty: 2,
        explanation: 'y = x 是直线，y = |x| 是绝对值函数，y = x² 是抛物线，y = 1/x 是双曲线'
      }
    ];
    
    // 要添加的拖拽题
    const dragDropExercises = [
      {
        id: '1-1-8',
        unitId,
        question: '将下列数学概念拖拽到对应的描述上',
        type: 'drag_drop',
        options: {
          elements: ['函数', '方程', '不等式', '向量'],
          positions: ['表示两个变量之间的对应关系', '含有未知数的等式', '用于比较两个表达式的大小关系', '既有大小又有方向的量']
        },
        correctAnswer: [0, 1, 2, 3],
        difficulty: 1,
        explanation: '函数表示两个变量之间的对应关系；方程是含有未知数的等式；不等式用于比较两个表达式的大小关系；向量是既有大小又有方向的量'
      },
      {
        id: '1-1-9',
        unitId,
        question: '将代数运算法则与对应的公式对应起来',
        type: 'drag_drop',
        options: {
          elements: ['分配律', '平方差公式', '完全平方公式', '立方和公式'],
          positions: ['a(b+c) = ab+ac', 'a² - b² = (a-b)(a+b)', '(a+b)² = a²+2ab+b²', 'a³ + b³ = (a+b)(a²-ab+b²)']
        },
        correctAnswer: [0, 1, 2, 3],
        difficulty: 2,
        explanation: '分配律：a(b+c) = ab+ac；平方差公式：a² - b² = (a-b)(a+b)；完全平方公式：(a+b)² = a²+2ab+b²；立方和公式：a³ + b³ = (a+b)(a²-ab+b²)'
      }
    ];
    
    // 所有要添加的练习题
    const allExercises = [
      ...choiceExercises,
      ...fillBlankExercises,
      ...matchingExercises,
      ...dragDropExercises
    ];
    
    // 检查并添加每道题
    for (const exercise of allExercises) {
      // 检查题目是否已存在
      const exists = await Exercise.findOne({ where: { id: exercise.id } });
      
      if (!exists) {
        // 创建新题目
        await Exercise.create(exercise);
        console.log(`成功添加${exercise.type}类型习题: ${exercise.id}`);
      } else {
        // 更新已有题目
        await Exercise.update(exercise, { where: { id: exercise.id } });
        console.log(`更新${exercise.type}类型习题: ${exercise.id}`);
      }
    }
    
    // 统计单元内题目数量
    const newCount = await Exercise.count({ where: { unitId } });
    console.log(`处理完成，单元 ${unitId} 现在有 ${newCount} 道练习题`);
    
    console.log('单元1-1多样化练习题添加/更新完成！');
  } catch (error) {
    console.error('添加单元1-1练习题出错:', error);
  }
};

// 如果直接运行该文件
if (require.main === module) {
  addUnit1_1Exercises().then(() => {
    console.log('脚本执行完毕');
    process.exit();
  }).catch(err => {
    console.error('脚本执行失败:', err);
    process.exit(1);
  });
}

module.exports = addUnit1_1Exercises; 