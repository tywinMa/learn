const { Exercise, Subject, Course, sequelize } = require("../models");

/**
 * 为单元1-1添加多种类型的练习题
 */
const addExerciseUnitExercises = async () => {
  try {
    console.log("开始为exercise类型单元添加练习题...");

    // 为 math-1-4（第一次月考）添加综合练习题
    const unitId = "math-1-4";

    // 检查是否已经有练习题
    const existingCount = await Exercise.count({ where: { unitId } });
    console.log(`单元 ${unitId} 已有 ${existingCount} 道练习题`);

    if (existingCount > 0) {
      console.log(`单元 ${unitId} 已有练习题，跳过添加`);
      return;
    }

    const exercises = [
      {
        id: "math-1-4-1",
        unitId: unitId,
        subject: "math",
        question: "求解方程 $3x^2 - 5x + 2 = 0$ 的根，并描述函数 $f(x) = 3x^2 - 5x + 2$ 的图像特征。",
        type: "choice",
        options: [
          "$x = 1$ 或 $x = \\frac{2}{3}$，抛物线开口向上，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$",
          "$x = \\frac{1}{3}$ 或 $x = 2$，抛物线开口向上，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$",
          "$x = 1$ 或 $x = \\frac{2}{3}$，抛物线开口向下，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{1}{12})$",
          "$x = \\frac{1}{3}$ 或 $x = 2$，抛物线开口向下，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{1}{12})$",
        ],
        correctAnswer: 0,
        explanation:
          "解：(1) 使用求根公式：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$，其中 $a=3$, $b=-5$, $c=2$\n(2) 计算判别式：$\\Delta = b^2 - 4ac = (-5)^2 - 4 \\times 3 \\times 2 = 25 - 24 = 1$\n(3) 代入求根公式：$x = \\frac{5 \\pm \\sqrt{1}}{6} = \\frac{5 \\pm 1}{6}$，所以 $x_1 = \\frac{6}{6} = 1$，$x_2 = \\frac{4}{6} = \\frac{2}{3}$\n(4) 由于 $a = 3 > 0$，抛物线开口向上\n(5) 对称轴 $x = \\frac{-b}{2a} = \\frac{5}{6}$\n(6) 顶点坐标 $(\\frac{5}{6}, \\frac{-1}{12})$",
        difficulty: "medium",
        points: 5,
        knowledgePoints: [
          {
            title: "一元二次方程",
            content:
              "一元二次方程的标准形式为 $ax^2 + bx + c = 0$ (其中 $a ≠ 0$)。",
            type: "text",
          },
          {
            title: "二次函数图像",
            content: "二次函数 $f(x) = ax^2 + bx + c$ 的图像是抛物线，开口方向由系数 $a$ 决定。",
            type: "text",
          },
        ],
      },
      {
        id: "math-1-4-2",
        unitId: unitId,
        question: "因式分解：$x^2 - 9$",
        type: "choice",
        options: ["$(x+3)(x-3)$", "$(x+9)(x-1)$", "$(x+1)(x-9)$", "$(x-3)^2$"],
        correctAnswer: 0,
        explanation: "这是平方差公式：$x^2 - 9 = x^2 - 3^2 = (x+3)(x-3)$。",
        difficulty: "easy",
        points: 3,
        knowledgePoints: [
          {
            title: "平方差公式",
            content: "平方差公式：$a^2 - b^2 = (a+b)(a-b)$。",
            type: "text",
          },
        ],
      },
      {
        id: "math-1-4-3",
        unitId: unitId,
        question: "用配方法解方程：$x^2 + 6x + 5 = 0$",
        type: "choice",
        options: [
          "$x = -1$ 或 $x = -5$",
          "$x = 1$ 或 $x = 5$",
          "$x = -2$ 或 $x = -3$",
          "$x = 2$ 或 $x = 3$",
        ],
        correctAnswer: 0,
        explanation:
          "配方：$x^2 + 6x + 5 = (x+3)^2 - 9 + 5 = (x+3)^2 - 4 = 0$，所以 $(x+3)^2 = 4$，$x+3 = ±2$，得 $x = -1$ 或 $x = -5$。",
        difficulty: "medium",
        points: 4,
        knowledgePoints: [
          {
            title: "配方法",
            content:
              "配方法是解一元二次方程的重要方法，通过配成完全平方式来求解。",
            type: "text",
          },
        ],
      },
      {
        id: "math-1-4-4",
        unitId: unitId,
        question: "若 $x^2 - 4x + k = 0$ 有两个相等的实数根，则 $k$ 的值为：",
        type: "choice",
        options: ["$k = 4$", "$k = 2$", "$k = -4$", "$k = 0$"],
        correctAnswer: 0,
        explanation:
          "有两个相等实数根的条件是判别式 $\\Delta = 0$。$\\Delta = b^2 - 4ac = 16 - 4k = 0$，所以 $k = 4$。",
        difficulty: "hard",
        points: 6,
        knowledgePoints: [
          {
            title: "判别式",
            content:
              "对于一元二次方程 $ax^2 + bx + c = 0$，判别式 $\\Delta = b^2 - 4ac$ 决定根的性质。",
            type: "text",
          },
        ],
      },
      {
        id: "math-1-4-5",
        unitId: unitId,
        question: "计算：$(x+2)^2 - (x-1)^2$",
        type: "fill_blank",
        question_template: "$(x+2)^2 - (x-1)^2 = $ ___",
        correctAnswer: ["6x+3"],
        explanation:
          "$(x+2)^2 - (x-1)^2 = (x^2+4x+4) - (x^2-2x+1) = x^2+4x+4-x^2+2x-1 = 6x+3$。",
        difficulty: "medium",
        points: 4,
        knowledgePoints: [
          {
            title: "完全平方公式",
            content: "$(a±b)^2 = a^2 ± 2ab + b^2$",
            type: "text",
          },
        ],
      },
      {
        id: "math-1-4-6",
        unitId: unitId,
        question: "一个数的平方与这个数的3倍的差等于4，求这个数。",
        type: "choice",
        options: [
          "$x = 4$ 或 $x = -1$",
          "$x = 1$ 或 $x = 4$",
          "$x = -4$ 或 $x = 1$",
          "$x = 2$ 或 $x = -2$",
        ],
        correctAnswer: 0,
        explanation:
          "设这个数为$x$，根据题意：$x^2 - 3x = 4$，即 $x^2 - 3x - 4 = 0$。因式分解得 $(x-4)(x+1) = 0$，所以 $x = 4$ 或 $x = -1$。",
        difficulty: "medium",
        points: 5,
        knowledgePoints: [
          {
            title: "列方程解应用题",
            content: "将实际问题转化为数学方程是解决应用题的关键步骤。",
            type: "text",
          },
        ],
      },
      {
        id: "math-1-4-7",
        unitId: unitId,
        question:
          "从一个装有5个红球和3个白球的袋子中随机抽取2个球，求抽到的两个球都是红球的概率。",
        type: "choice",
        options: [
          "$\\frac{5}{8} \\times \\frac{4}{7} = \\frac{20}{56} = \\frac{5}{14}$",
          "$\\frac{5}{8} \\times \\frac{5}{7} = \\frac{25}{56}$",
          "$\\frac{C_5^2}{C_8^2} = \\frac{10}{28} = \\frac{5}{14}$",
          "$\\frac{5 \\cdot 4}{8 \\cdot 7} = \\frac{20}{56} = \\frac{5}{14}$"
        ],
        correctAnswer: 2,
        explanation:
          "解：(1) 总共有 $C_8^2 = \\frac{8 \\times 7}{2 \\times 1} = 28$ 种不同的抽取方式\n(2) 抽到2个红球的方式有 $C_5^2 = \\frac{5 \\times 4}{2 \\times 1} = 10$ 种\n(3) 所以抽到2个红球的概率是 $\\frac{C_5^2}{C_8^2} = \\frac{10}{28} = \\frac{5}{14}$\n(4) 选项A和D的结果也是 $\\frac{5}{14}$，但计算方法不同。选项A是先抽一个红球，再抽一个红球的概率。选项B的计算有误。",
        difficulty: "medium",
        points: 5,
        knowledgePoints: [
          {
            title: "组合数",
            content: "组合数 $C_n^m$ 表示从n个不同元素中取出m个元素的不同组合数量，计算公式为 $C_n^m = \\frac{n!}{m!(n-m)!}$。",
            type: "text",
          },
          {
            title: "概率计算",
            content: "概率 = 所求情况数 / 总情况数，在组合问题中，常用组合数来计算概率。",
            type: "text",
          },
        ],
      },
      {
        id: "math-1-4-8",
        unitId: unitId,
        question: "匹配下列因式分解的结果：",
        type: "matching",
        options: {
          left: ["$x^2 - 4$", "$x^2 + 4x + 4$", "$x^2 - 6x + 9$", "$x^2 - 1$"],
          right: ["$(x-3)^2$", "$(x+2)^2$", "$(x+1)(x-1)$", "$(x+2)(x-2)$"],
        },
        correctAnswer: [3, 1, 0, 2],
        explanation:
          "平方差和完全平方公式的应用：$x^2-4=(x+2)(x-2)$；$x^2+4x+4=(x+2)^2$；$x^2-6x+9=(x-3)^2$；$x^2-1=(x+1)(x-1)$。",
        difficulty: "medium",
        points: 8,
        knowledgePoints: [
          {
            title: "特殊的因式分解",
            content: "掌握平方差公式和完全平方公式是因式分解的基础。",
            type: "text",
          },
        ],
      },
    ];

    // 批量创建练习题
    for (const exercise of exercises) {
      // 为每个练习题添加subject字段
      exercise.subject = "math";
      await Exercise.create(exercise);
      console.log(`已创建练习题: ${exercise.id}`);
    }

    console.log(`成功添加 ${exercises.length} 道练习题到单元 ${unitId}`);
    console.log("Exercise类型单元练习题添加完成！");
  } catch (error) {
    console.error("添加exercise类型单元练习题时出错:", error);
    throw error;
  }
};

const addUnit1_1Exercises = async () => {
  try {
    await addExerciseUnitExercises();
    console.log("开始为单元1-1添加多样化练习题...");

    const unitId = "1-1"; // 数学学科的第一阶段第一部分
    const subjectCode = "math"; // 学科代码

    // 获取数学学科ID
    const mathSubject = await Subject.findOne({ where: { code: subjectCode } });
    if (!mathSubject) {
      throw new Error("找不到数学学科，请先初始化学科数据");
    }

    // 检查单元是否存在，如果不存在则创建
    const fullUnitId = `${subjectCode}-${unitId}`;
    let unit = await Course.findOne({ where: { id: fullUnitId } });
    if (!unit) {
      console.log(`单元 ${fullUnitId} 不存在，将自动创建`);
      unit = await Course.create({
        id: fullUnitId, // 直接使用完整ID，避免hooks再次添加前缀
        subject: subjectCode,
        title: "数学单元1-1",
        description: "数学第一单元第一部分",

      });
      console.log(`已创建单元: ${unit.id}`);
    }

    // 检查单元是否已有练习题
    const existingCount = await Exercise.count({
      where: { unitId: fullUnitId },
    });
    console.log(`单元 ${fullUnitId} 已有 ${existingCount} 道练习题`);

    // 要添加的选择题
    const choiceExercises = [
      {
        id: `${fullUnitId}-1`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: "求解方程 $3x^2 - 5x + 2 = 0$ 的根，并描述函数 $f(x) = 3x^2 - 5x + 2$ 的图像特征。",
        type: "choice",
        options: [
          "$x = 1$ 或 $x = \\frac{2}{3}$，抛物线开口向上，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$",
          "$x = \\frac{1}{3}$ 或 $x = 2$，抛物线开口向上，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$",
          "$x = 1$ 或 $x = \\frac{2}{3}$，抛物线开口向下，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{1}{12})$",
          "$x = \\frac{1}{3}$ 或 $x = 2$，抛物线开口向下，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{1}{12})$",
        ],
        correctAnswer: 0,
        explanation:
          "解：(1) 使用求根公式：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$，其中 $a=3$, $b=-5$, $c=2$\n(2) 计算判别式：$\\Delta = b^2 - 4ac = (-5)^2 - 4 \\times 3 \\times 2 = 25 - 24 = 1$\n(3) 代入求根公式：$x = \\frac{5 \\pm \\sqrt{1}}{6} = \\frac{5 \\pm 1}{6}$，所以 $x_1 = \\frac{6}{6} = 1$，$x_2 = \\frac{4}{6} = \\frac{2}{3}$\n(4) 由于 $a = 3 > 0$，抛物线开口向上\n(5) 对称轴 $x = \\frac{-b}{2a} = \\frac{5}{6}$\n(6) 顶点坐标 $(\\frac{5}{6}, \\frac{-1}{12})$",
        difficulty: "medium",
        points: 5,
        knowledgePoints: [
          {
            title: "一元二次方程",
            content:
              "一元二次方程的标准形式为 $ax^2 + bx + c = 0$ (其中 $a ≠ 0$)。",
            type: "text",
          },
          {
            title: "二次函数图像",
            content: "二次函数 $f(x) = ax^2 + bx + c$ 的图像是抛物线，开口方向由系数 $a$ 决定。",
            type: "text",
          },
        ],
      },
      {
        id: `${fullUnitId}-2`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: "实数的基本运算中，以下哪个表达式计算结果为负数？",
        options: ["|-5| + |5|", "|-7| - |3|", "|-4| - |6|", "|-8| × |-2|"],
        correctAnswer: 2,
        type: "choice",
        difficulty: 2,
        explanation: "|-4| - |6| = 4 - 6 = -2，结果为负数",
      },
      {
        id: `${fullUnitId}-3`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: "若一次函数f(x) = 2x - 3，则f(2)的值是？",
        options: ["1", "2", "3", "4"],
        correctAnswer: 0,
        type: "choice",
        difficulty: 1,
        explanation: "f(2) = 2×2 - 3 = 4 - 3 = 1",
      },
    ];

    // 要添加的填空题
    const fillBlankExercises = [
      {
        id: `${fullUnitId}-4`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: "解不等式 2x - 5 > 3，解得 x > ____。",
        type: "fill_blank",
        correctAnswer: ["4"],
        difficulty: 2,
        isAI: true,
        explanation: "2x - 5 > 3，移项得 2x > 8，两边除以2得 x > 4",
      },
      {
        id: `${fullUnitId}-5`,
        unitId: fullUnitId,
        subject: subjectCode,
        question:
          "已知函数f(x) = ax² + bx + c的图像通过点(1, 2)、(2, 1)和(-1, 4)，则a = ____, b = ____, c = ____。",
        type: "fill_blank",
        correctAnswer: ["1", "-4", "5"],
        difficulty: 3,
        explanation:
          "将三个点代入函数方程式，得到三个方程：a + b + c = 2，4a + 2b + c = 1，a - b + c = 4。解方程组得a = 1, b = -4, c = 5",
      },
    ];

    // 要添加的匹配题
    const matchingExercises = [
      {
        id: `${fullUnitId}-6`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: "将左侧的代数式与右侧的等价形式匹配",
        type: "matching",
        options: {
          left: ["a² - b²", "a² + 2ab + b²", "a² - 2ab + b²", "a³ - b³"],
          right: ["(a+b)²", "(a-b)(a+b)", "(a-b)²", "(a-b)(a²+ab+b²)"],
        },
        correctAnswer: [1, 0, 2, 3],
        difficulty: 2,
        explanation:
          "a² - b² = (a-b)(a+b)，a² + 2ab + b² = (a+b)²，a² - 2ab + b² = (a-b)²，a³ - b³ = (a-b)(a²+ab+b²)",
      },
      {
        id: `${fullUnitId}-7`,
        unitId: fullUnitId,
        subject: subjectCode,
        question: "匹配函数与其图像特征",
        type: "matching",
        options: {
          left: ["y = x", "y = |x|", "y = x²", "y = 1/x"],
          right: ["抛物线", "绝对值函数图像", "双曲线", "直线"],
        },
        correctAnswer: [3, 1, 0, 2],
        difficulty: 2,
        explanation:
          "y = x 是直线，y = |x| 是绝对值函数，y = x² 是抛物线，y = 1/x 是双曲线",
      },
    ];

    // 添加应用题
    const applicationExercises = [
      {
        id: `${fullUnitId}-8`,
        unitId: fullUnitId,
        subject: subjectCode,
        question:
          "在一次数学考试中，班级的平均分是72分。已知及格线是60分，班级内及格人数占总人数的80%。如果班级总人数是50人，请计算班级内不及格同学的平均分是多少？请写出完整的解题过程并拍照上传。",
        type: "application",
        options: {
          allowPhoto: true,
          hint: "设不及格同学的平均分为x，可以列方程求解",
        },
        correctAnswer: {
          failAvg: 30,
          steps: [
            "班级总人数是50人，及格率是80%，所以及格人数是50×80%=40人，不及格人数是50-40=10人",
            "设全班的总分为S，则S=50×72=3600",
            "设不及格同学的平均分为x，则及格同学的总分为40×60=2400",
            "根据总分关系，有：40×60+10×x=3600",
            "2400+10x=3600",
            "10x=1200",
            "x=120÷10=30",
            "所以不及格同学的平均分是30分",
          ],
        },
        difficulty: 3,
        explanation:
          "这是一道典型的平均数问题。通过总人数和及格率计算出及格人数和不及格人数，再利用总分=及格总分+不及格总分的关系列方程求解。根据计算，不及格同学的平均分是30分。",
      },
      {
        id: `${fullUnitId}-9`,
        unitId: fullUnitId,
        subject: subjectCode,
        question:
          "小明有100元钱，他想买3个价格相同的笔记本和2支价格相同的钢笔，已知每个笔记本的价格是每支钢笔价格的2倍。如果刚好用完100元，请计算每个笔记本和每支钢笔的价格。请写出完整的解题过程并拍照上传。",
        type: "application",
        options: {
          allowPhoto: true,
          hint: "设钢笔单价为x元，则可列方程求解",
        },
        correctAnswer: {
          notebook: 20,
          pen: 10,
          steps: [
            "设钢笔的价格为x元，则笔记本的价格为2x元",
            "根据题意，3个笔记本和2支钢笔的总价为100元",
            "可列方程：3(2x) + 2x = 100",
            "化简得：6x + 2x = 100",
            "8x = 100",
            "x = 12.5",
            "所以钢笔价格为12.5元，笔记本价格为25元",
          ],
        },
        difficulty: 3,
        explanation:
          "这是一个简单的方程应用题。设钢笔单价为x元，笔记本单价为2x元，则3个笔记本和2支钢笔的总价为3(2x) + 2x = 100，解得x = 10，因此笔记本单价为20元，钢笔单价为10元。",
      },
      {
        id: `${fullUnitId}-10`,
        unitId: fullUnitId,
        subject: subjectCode,
        question:
          "一个长方形花坛，长是宽的1.5倍，花坛的周长是50米。请计算这个花坛的面积，并画出示意图。完成后拍照上传你的解答。",
        type: "application",
        options: {
          allowPhoto: true,
          hint: "周长 = 2(长+宽)，面积 = 长×宽",
        },
        correctAnswer: {
          length: 15,
          width: 10,
          area: 150,
          steps: [
            "设宽为x米，则长为1.5x米",
            "根据周长公式：2(长+宽) = 50",
            "代入：2(1.5x + x) = 50",
            "2 × 2.5x = 50",
            "5x = 50",
            "x = 10",
            "长 = 1.5 × 10 = 15米",
            "面积 = 15 × 10 = 150平方米",
          ],
        },
        difficulty: 2,
        explanation:
          "利用周长公式和长宽关系，设宽为x，则长为1.5x，周长为2(1.5x + x) = 50，解得x = 10，长为15，面积为150平方米。",
      },
      {
        id: `${fullUnitId}-11`,
        unitId: fullUnitId,
        subject: subjectCode,
        question:
          "某商店促销活动：购买两件商品可享8折优惠，购买三件商品可享7折优惠。小红买了两件单价分别为120元和80元的商品，小明买了三件单价分别为100元、90元和70元的商品。请计算谁付的钱更多，以及多多少钱？请写出计算过程并拍照上传。",
        type: "application",
        options: {
          allowPhoto: true,
          hint: "计算各自的折后总价并比较",
        },
        correctAnswer: {
          xiaohong: 160,
          xiaoming: 182,
          difference: 22,
          steps: [
            "小红购买的商品原价总和：120 + 80 = 200元",
            "小红享受8折优惠，实付金额：200 × 0.8 = 160元",
            "小明购买的商品原价总和：100 + 90 + 70 = 260元",
            "小明享受7折优惠，实付金额：260 × 0.7 = 182元",
            "比较可知，小明付的钱更多，多付：182 - 160 = 22元",
          ],
        },
        difficulty: 2,
        explanation:
          "这题考查了打折计算和比较。小红购买两件商品享8折，实付160元；小明购买三件商品享7折，实付182元；两人相差22元，小明付的更多。",
      },
      {
        id: `${fullUnitId}-12`,
        unitId: fullUnitId,
        subject: subjectCode,
        question:
          "一列火车从A站出发，以每小时60千米的速度行驶。2小时后，另一列火车从同一站沿同一方向出发，以每小时80千米的速度行驶。请问第二列火车需要多少小时才能追上第一列火车？请写出解题过程并拍照上传。",
        type: "application",
        options: {
          allowPhoto: true,
          hint: "设第二列火车行驶了t小时才追上第一列火车，可以列方程求解",
        },
        correctAnswer: {
          time: 6,
          steps: [
            "设第二列火车行驶了t小时追上第一列火车",
            "追上时，第一列火车已行驶(t+2)小时",
            "追上时两列火车行驶的距离相等，即：",
            "60(t+2) = 80t",
            "60t + 120 = 80t",
            "60t - 80t = -120",
            "-20t = -120",
            "t = 6",
            "所以第二列火车需要行驶6小时才能追上第一列火车",
          ],
        },
        difficulty: 3,
        explanation:
          '这是一道追及问题，需要根据"距离相等"列方程。第一列火车速度为60千米/小时，第二列为80千米/小时，两列火车出发时间相差2小时。设第二列行驶t小时后追上第一列，则有60(t+2) = 80t，解得t = 6小时。',
      },
    ];

    // 批量创建所有练习题
    const allExercises = [
      ...choiceExercises,
      ...fillBlankExercises,
      ...matchingExercises,
      // ...applicationExercises,
    ];

    // 检查是否已存在相同ID的练习题
    for (const exercise of allExercises) {
      const existingExercise = await Exercise.findOne({
        where: { id: exercise.id },
      });
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
    console.error("添加练习题出错:", error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  addUnit1_1Exercises()
    .then(() => {
      console.log("脚本执行完毕");
      process.exit();
    })
    .catch((err) => {
      console.error("脚本执行失败:", err);
      process.exit(1);
    });
}

module.exports = addUnit1_1Exercises;
