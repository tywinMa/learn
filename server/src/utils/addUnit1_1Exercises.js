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
    
    // 添加应用题
    const applicationExercises = [
      {
        id: '1-1-1-1',
        unitId: '1-1-1', // 指定为1-1-1单元
        question: '小明有100元钱，他想买3个价格相同的笔记本和2支价格相同的钢笔，已知每个笔记本的价格是每支钢笔价格的2倍。如果刚好用完100元，请计算每个笔记本和每支钢笔的价格。请写出完整的解题过程并拍照上传。',
        type: 'application',
        options: {
          allowPhoto: true,
          hint: '设钢笔单价为x元，则可列方程求解'
        },
        correctAnswer: {
          notebook: 20,
          pen: 10,
          steps: [
            '设钢笔的价格为x元，则笔记本的价格为2x元',
            '根据题意，3个笔记本和2支钢笔的总价为100元',
            '可列方程：3(2x) + 2x = 100',
            '化简得：6x + 2x = 100',
            '8x = 100',
            'x = 12.5',
            '所以钢笔价格为12.5元，笔记本价格为25元'
          ]
        },
        difficulty: 3,
        explanation: '这是一个简单的方程应用题。设钢笔单价为x元，笔记本单价为2x元，则3个笔记本和2支钢笔的总价为3(2x) + 2x = 100，解得x = 10，因此笔记本单价为20元，钢笔单价为10元。'
      },
      {
        id: '1-1-1-2',
        unitId: '1-1-1', // 指定为1-1-1单元
        question: '一个长方形花坛，长是宽的1.5倍，花坛的周长是50米。请计算这个花坛的面积，并画出示意图。完成后拍照上传你的解答。',
        type: 'application',
        options: {
          allowPhoto: true,
          hint: '周长 = 2(长+宽)，面积 = 长×宽'
        },
        correctAnswer: {
          length: 15,
          width: 10,
          area: 150,
          steps: [
            '设宽为x米，则长为1.5x米',
            '根据周长公式：2(长+宽) = 50',
            '代入：2(1.5x + x) = 50',
            '2 × 2.5x = 50',
            '5x = 50',
            'x = 10',
            '长 = 1.5 × 10 = 15米',
            '面积 = 15 × 10 = 150平方米'
          ]
        },
        difficulty: 2,
        explanation: '利用周长公式和长宽关系，设宽为x，则长为1.5x，周长为2(1.5x + x) = 50，解得x = 10，长为15，面积为150平方米。'
      },
      {
        id: '1-1-1-3',
        unitId: '1-1-1', // 指定为1-1-1单元
        question: '某商店促销活动：购买两件商品可享8折优惠，购买三件商品可享7折优惠。小红买了两件单价分别为120元和80元的商品，小明买了三件单价分别为100元、90元和70元的商品。请计算谁付的钱更多，以及多多少钱？请写出计算过程并拍照上传。',
        type: 'application',
        options: {
          allowPhoto: true,
          hint: '计算各自的折后总价并比较'
        },
        correctAnswer: {
          xiaohong: 160,
          xiaoming: 182,
          difference: 22,
          steps: [
            '小红购买的商品原价总和：120 + 80 = 200元',
            '小红享受8折优惠，实付金额：200 × 0.8 = 160元',
            '小明购买的商品原价总和：100 + 90 + 70 = 260元',
            '小明享受7折优惠，实付金额：260 × 0.7 = 182元',
            '比较可知，小明付的钱更多，多付：182 - 160 = 22元'
          ]
        },
        difficulty: 2,
        explanation: '这题考查了打折计算和比较。小红购买两件商品享8折，实付160元；小明购买三件商品享7折，实付182元；两人相差22元，小明付的更多。'
      }
    ];
    
    // 所有要添加的练习题
    const allExercises = [
      ...choiceExercises,
      ...fillBlankExercises,
      ...matchingExercises,
      ...applicationExercises
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
    
    // 删除旧的拖拽题/已转换的匹配题
    const dragDropIdsToRemove = ['1-1-8', '1-1-9', '1-1-10', '1-1-11'];
    for (const id of dragDropIdsToRemove) {
      const exists = await Exercise.findOne({ where: { id } });
      if (exists) {
        await Exercise.destroy({ where: { id } });
        console.log(`删除题目: ${id}`);
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