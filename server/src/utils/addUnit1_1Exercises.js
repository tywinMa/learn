const { Exercise, Subject, Unit, sequelize } = require('../models');

/**
 * 为单元1-1添加多种类型的练习题
 */
const addUnit1_1Exercises = async () => {
  try {
    console.log('开始为单元1-1添加多样化练习题...');

    const unitId = '1-1'; // 数学学科的第一阶段第一部分
    const subjectCode = 'math'; // 学科代码

    // 获取数学学科ID
    const mathSubject = await Subject.findOne({ where: { code: subjectCode } });
    if (!mathSubject) {
      throw new Error('找不到数学学科，请先初始化学科数据');
    }

    // 检查单元是否存在，如果不存在则创建
    const fullUnitId = `${subjectCode}-${unitId}`;
    let unit = await Unit.findOne({ where: { id: fullUnitId } });
    if (!unit) {
      console.log(`单元 ${fullUnitId} 不存在，将自动创建`);
      unit = await Unit.create({
        id: fullUnitId,  // 直接使用完整ID，避免hooks再次添加前缀
        subject: subjectCode,
        title: '数学单元1-1',
        description: '数学第一单元第一部分',
        level: 2,
        order: 1
      });
      console.log(`已创建单元: ${unit.id}`);
    }

    // 检查单元是否已有练习题
    const existingCount = await Exercise.count({ where: { unitId: fullUnitId } });
    console.log(`单元 ${fullUnitId} 已有 ${existingCount} 道练习题`);

    // 要添加的选择题
    const choiceExercises = [
      {
        id: `${fullUnitId}-1`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-2`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-3`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-4`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: '解不等式 2x - 5 > 3，解得 x > ____。',
        type: 'fill_blank',
        correctAnswer: ['4'],
        difficulty: 2,
        explanation: '2x - 5 > 3，移项得 2x > 8，两边除以2得 x > 4'
      },
      {
        id: `${fullUnitId}-5`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-6`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-7`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-8`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: '在一次数学考试中，班级的平均分是72分。已知及格线是60分，班级内及格人数占总人数的80%。如果班级总人数是50人，请计算班级内不及格同学的平均分是多少？请写出完整的解题过程并拍照上传。',
        type: 'application',
        options: {
          allowPhoto: true,
          hint: '设不及格同学的平均分为x，可以列方程求解'
        },
        correctAnswer: {
          failAvg: 30,
          steps: [
            '班级总人数是50人，及格率是80%，所以及格人数是50×80%=40人，不及格人数是50-40=10人',
            '设全班的总分为S，则S=50×72=3600',
            '设不及格同学的平均分为x，则及格同学的总分为40×60=2400',
            '根据总分关系，有：40×60+10×x=3600',
            '2400+10x=3600',
            '10x=1200',
            'x=120÷10=30',
            '所以不及格同学的平均分是30分'
          ]
        },
        difficulty: 3,
        explanation: '这是一道典型的平均数问题。通过总人数和及格率计算出及格人数和不及格人数，再利用总分=及格总分+不及格总分的关系列方程求解。根据计算，不及格同学的平均分是30分。'
      },
      {
        id: `${fullUnitId}-9`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-10`,
        unitId: fullUnitId,
        subject: subjectCode,
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
        id: `${fullUnitId}-11`,
        unitId: fullUnitId,
        subject: subjectCode,
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
      },
      {
        id: `${fullUnitId}-12`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: '一列火车从A站出发，以每小时60千米的速度行驶。2小时后，另一列火车从同一站沿同一方向出发，以每小时80千米的速度行驶。请问第二列火车需要多少小时才能追上第一列火车？请写出解题过程并拍照上传。',
        type: 'application',
        options: {
          allowPhoto: true,
          hint: '设第二列火车行驶了t小时才追上第一列火车，可以列方程求解'
        },
        correctAnswer: {
          time: 6,
          steps: [
            '设第二列火车行驶了t小时追上第一列火车',
            '追上时，第一列火车已行驶(t+2)小时',
            '追上时两列火车行驶的距离相等，即：',
            '60(t+2) = 80t',
            '60t + 120 = 80t',
            '60t - 80t = -120',
            '-20t = -120',
            't = 6',
            '所以第二列火车需要行驶6小时才能追上第一列火车'
          ]
        },
        difficulty: 3,
        explanation: '这是一道追及问题，需要根据"距离相等"列方程。第一列火车速度为60千米/小时，第二列为80千米/小时，两列火车出发时间相差2小时。设第二列行驶t小时后追上第一列，则有60(t+2) = 80t，解得t = 6小时。'
      }
    ];

    // 批量创建所有练习题
    const allExercises = [
      ...choiceExercises,
      ...fillBlankExercises,
      ...matchingExercises,
      ...applicationExercises
    ];

    // 检查是否已存在相同ID的练习题
    for (const exercise of allExercises) {
      const existingExercise = await Exercise.findOne({ where: { id: exercise.id } });
      if (existingExercise) {
        console.log(`练习题 ${exercise.id} 已存在，将跳过`);
        continue;
      }

      try {
        await Exercise.create(exercise);
        console.log(`已创建练习题: ${exercise.id}`);
      } catch (err) {
        console.error(`创建练习题 ${exercise.id} 失败:`, err);
      }
    }

    console.log(`成功添加 ${allExercises.length} 道练习题到单元 ${fullUnitId}`);
  } catch (error) {
    console.error('添加练习题出错:', error);
    throw error;
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