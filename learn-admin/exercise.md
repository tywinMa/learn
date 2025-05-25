# 习题

## 列表页面

    1. 顶部可以通过习题标题和学科进行筛选，支持分页
    2. 下方习题以卡片形式出现，包含习题号，标题名称，描述，编辑和删除，卡片会一个学科标识

## 编辑新增页面

    新增页面会有标题、描述的输入、下面会有一个模块提示增加习题，点击增加后出现一个区域包含题目类型（type： [choice, application,fill_blank, matching]），难度等级（difficulty），题目信息(question)、options根据选择题目类型不同生成对应编辑方式，正确答案和答案解析。可以参照下方提供的格式来生成

``` js

const exerciseData = [
    {
        "id": "math-1-1-1",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "以下哪个是解一元一次方程 3x + 6 = 0 的正确步骤？",
        "options": [
            "3x = -6，x = -2",
            "3x = 6，x = 2",
            "3x = -6，x = 2",
            "3x = 6，x = -2"
        ],
        "correctAnswer": 0,
        "explanation": "解一元一次方程的步骤：移项得 3x = -6，然后两边同除以3得 x = -2",
        "type": "choice",
        "difficulty": 1,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.104Z",
        "updatedAt": "2025-05-13T12:42:02.104Z",
        "completed": false
    },
    {
        "id": "math-1-1-10",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "一个长方形花坛，长是宽的1.5倍，花坛的周长是50米。请计算这个花坛的面积，并画出示意图。完成后拍照上传你的解答。",
        "options": {
            "allowPhoto": true,
            "hint": "周长 = 2(长+宽)，面积 = 长×宽"
        },
        "correctAnswer": null,
        "explanation": "利用周长公式和长宽关系，设宽为x，则长为1.5x，周长为2(1.5x + x) = 50，解得x = 10，长为15，面积为150平方米。",
        "type": "application",
        "difficulty": 2,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.116Z",
        "updatedAt": "2025-05-13T12:42:02.116Z",
        "completed": false
    },
    {
        "id": "math-1-1-11",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "某商店促销活动：购买两件商品可享8折优惠，购买三件商品可享7折优惠。小红买了两件单价分别为120元和80元的商品，小明买了三件单价分别为100元、90元和70元的商品。请计算谁付的钱更多，以及多多少钱？请写出计算过程并拍照上传。",
        "options": {
            "allowPhoto": true,
            "hint": "计算各自的折后总价并比较"
        },
        "correctAnswer": null,
        "explanation": "这题考查了打折计算和比较。小红购买两件商品享8折，实付160元；小明购买三件商品享7折，实付182元；两人相差22元，小明付的更多。",
        "type": "application",
        "difficulty": 2,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.117Z",
        "updatedAt": "2025-05-13T12:42:02.117Z",
        "completed": false
    },
    {
        "id": "math-1-1-12",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "一列火车从A站出发，以每小时60千米的速度行驶。2小时后，另一列火车从同一站沿同一方向出发，以每小时80千米的速度行驶。请问第二列火车需要多少小时才能追上第一列火车？请写出解题过程并拍照上传。",
        "options": {
            "allowPhoto": true,
            "hint": "设第二列火车行驶了t小时才追上第一列火车，可以列方程求解"
        },
        "correctAnswer": null,
        "explanation": "这是一道追及问题，需要根据\"距离相等\"列方程。第一列火车速度为60千米/小时，第二列为80千米/小时，两列火车出发时间相差2小时。设第二列行驶t小时后追上第一列，则有60(t+2) = 80t，解得t = 6小时。",
        "type": "application",
        "difficulty": 3,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.119Z",
        "updatedAt": "2025-05-13T12:42:02.119Z",
        "completed": false
    },
    {
        "id": "math-1-1-2",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "实数的基本运算中，以下哪个表达式计算结果为负数？",
        "options": [
            "|-5| + |5|",
            "|-7| - |3|",
            "|-4| - |6|",
            "|-8| × |-2|"
        ],
        "correctAnswer": 2,
        "explanation": "|-4| - |6| = 4 - 6 = -2，结果为负数",
        "type": "choice",
        "difficulty": 2,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.107Z",
        "updatedAt": "2025-05-13T12:42:02.107Z",
        "completed": false
    },
    {
        "id": "math-1-1-3",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "若一次函数f(x) = 2x - 3，则f(2)的值是？",
        "options": [
            "1",
            "2",
            "3",
            "4"
        ],
        "correctAnswer": 0,
        "explanation": "f(2) = 2×2 - 3 = 4 - 3 = 1",
        "type": "choice",
        "difficulty": 1,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.108Z",
        "updatedAt": "2025-05-13T12:42:02.108Z",
        "completed": false
    },
    {
        "id": "math-1-1-4",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "解不等式 2x - 5 > 3，解得 x > ____。",
        "options": null,
        "correctAnswer": [
            "4"
        ],
        "explanation": "2x - 5 > 3，移项得 2x > 8，两边除以2得 x > 4",
        "type": "fill_blank",
        "difficulty": 2,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.109Z",
        "updatedAt": "2025-05-13T12:42:02.109Z",
        "completed": false
    },
    {
        "id": "math-1-1-5",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "已知函数f(x) = ax² + bx + c的图像通过点(1, 2)、(2, 1)和(-1, 4)，则a = ____, b = ____, c = ____。",
        "options": null,
        "correctAnswer": [
            "1",
            "-4",
            "5"
        ],
        "explanation": "将三个点代入函数方程式，得到三个方程：a + b + c = 2，4a + 2b + c = 1，a - b + c = 4。解方程组得a = 1, b = -4, c = 5",
        "type": "fill_blank",
        "difficulty": 3,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.110Z",
        "updatedAt": "2025-05-13T12:42:02.110Z",
        "completed": false
    },
    {
        "id": "math-1-1-6",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "将左侧的代数式与右侧的等价形式匹配",
        "options": {
            "left": [
                "a² - b²",
                "a² + 2ab + b²",
                "a² - 2ab + b²",
                "a³ - b³"
            ],
            "right": [
                "(a+b)²",
                "(a-b)(a+b)",
                "(a-b)²",
                "(a-b)(a²+ab+b²)"
            ]
        },
        "correctAnswer": null,
        "explanation": "a² - b² = (a-b)(a+b)，a² + 2ab + b² = (a+b)²，a² - 2ab + b² = (a-b)²，a³ - b³ = (a-b)(a²+ab+b²)",
        "type": "matching",
        "difficulty": 2,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.111Z",
        "updatedAt": "2025-05-13T12:42:02.111Z",
        "completed": false
    },
    {
        "id": "math-1-1-7",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "匹配函数与其图像特征",
        "options": {
            "left": [
                "y = x",
                "y = |x|",
                "y = x²",
                "y = 1/x"
            ],
            "right": [
                "抛物线",
                "绝对值函数图像",
                "双曲线",
                "直线"
            ]
        },
        "correctAnswer": null,
        "explanation": "y = x 是直线，y = |x| 是绝对值函数，y = x² 是抛物线，y = 1/x 是双曲线",
        "type": "matching",
        "difficulty": 2,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.112Z",
        "updatedAt": "2025-05-13T12:42:02.112Z",
        "completed": false
    },
    {
        "id": "math-1-1-8",
        "subject": "math",
        "unitId": "math-1-1",
        "question": "在一次数学考试中，班级的平均分是72分。已知及格线是60分，班级内及格人数占总人数的80%。如果班级总人数是50人，请计算班级内不及格同学的平均分是多少？请写出完整的解题过程并拍照上传。",
        "options": {
            "allowPhoto": true,
            "hint": "设不及格同学的平均分为x，可以列方程求解"
        },
        "correctAnswer": null,
        "explanation": "这是一道典型的平均数问题。通过总人数和及格率计算出及格人数和不及格人数，再利用总分=及格总分+不及格总分的关系列方程求解。根据计算，不及格同学的平均分是30分。",
        "type": "application",
        "difficulty": 3,
        "media": null,
        "hints": null,
        "createdAt": "2025-05-13T12:42:02.114Z",
        "updatedAt": "2025-05-13T12:42:02.114Z",
        "completed": false
    },
    
]

```