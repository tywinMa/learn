import type { Exercise } from './exerciseService';

// 当前日期
const currentDate = new Date().toISOString();

// 模拟习题数据
export const mockExercises: Exercise[] = [
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
    "difficulty": "1",
    "createdAt": currentDate,
    "updatedAt": currentDate,
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
    "difficulty": "2",
    "createdAt": currentDate,
    "updatedAt": currentDate,
    "completed": false
  },
  {
    "id": "math-1-1-4",
    "subject": "math",
    "unitId": "math-1-1",
    "question": "解不等式 2x - 5 > 3，解得 x > ____。",
    "options": null,
    "correctAnswer": ["4"],
    "explanation": "2x - 5 > 3，移项得 2x > 8，两边除以2得 x > 4",
    "type": "fill_blank",
    "difficulty": "2",
    "createdAt": currentDate,
    "updatedAt": currentDate,
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
    "correctAnswer": {
      "mappings": {
        "0": 1, // a² - b² 匹配 (a-b)(a+b)
        "1": 0, // a² + 2ab + b² 匹配 (a+b)²
        "2": 2, // a² - 2ab + b² 匹配 (a-b)²
        "3": 3  // a³ - b³ 匹配 (a-b)(a²+ab+b²)
      }
    },
    "explanation": "a² - b² = (a-b)(a+b)，a² + 2ab + b² = (a+b)²，a² - 2ab + b² = (a-b)²，a³ - b³ = (a-b)(a²+ab+b²)",
    "type": "matching",
    "difficulty": "2",
    "createdAt": currentDate,
    "updatedAt": currentDate,
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
    "difficulty": "3",
    "createdAt": currentDate,
    "updatedAt": currentDate,
    "completed": false
  },
  {
    "id": "physics-2-1-1",
    "subject": "physics",
    "unitId": "physics-2-1",
    "question": "关于牛顿第一定律，下列说法正确的是：",
    "options": [
      "一个物体在没有外力作用下保持静止状态",
      "一个物体在没有外力作用下保持匀速直线运动或静止状态",
      "一个物体在外力作用下会产生加速度",
      "一个物体受到的合外力与其加速度成正比"
    ],
    "correctAnswer": 1,
    "explanation": "牛顿第一定律（惯性定律）表述为：任何物体都要保持匀速直线运动或静止状态，直到外力迫使它改变运动状态为止。",
    "type": "choice",
    "difficulty": "1",
    "createdAt": currentDate,
    "updatedAt": currentDate,
    "completed": false
  },
  {
    "id": "chinese-3-1-1",
    "subject": "chinese",
    "unitId": "chinese-3-1",
    "question": "下列词语中，加点字的读音完全正确的一项是：",
    "options": [
      "诘责(jié)  暗淡(àn)  烂漫(làn)",
      "惬意(qiè)  绽放(zhàn)  斟酌(zhēn)",
      "憔悴(qiáo)  熙攘(xī)  枯涸(hé)",
      "哗然(huá)  讥诮(qiào)  炽热(chì)"
    ],
    "correctAnswer": 3,
    "explanation": "诘责(jié)正确；暗淡(àn)正确；烂漫(làn)错误，应为(màn)。\n惬意(qiè)正确；绽放(zhàn)正确；斟酌(zhēn)错误，应为(zhēn)。\n憔悴(qiáo)错误，应为(qiáo)；熙攘(xī)正确；枯涸(hé)正确。\n哗然(huá)正确；讥诮(qiào)正确；炽热(chì)正确。\n所以选D。",
    "type": "choice",
    "difficulty": "2",
    "createdAt": currentDate,
    "updatedAt": currentDate,
    "completed": false
  },
  {
    "id": "english-4-1-1",
    "subject": "english",
    "unitId": "english-4-1",
    "question": "请将下列英语单词与其中文含义匹配：",
    "options": {
      "left": [
        "Abundant",
        "Crucial",
        "Preliminary",
        "Skeptical"
      ],
      "right": [
        "至关重要的",
        "初步的",
        "怀疑的",
        "丰富的"
      ]
    },
    "correctAnswer": {
      "mappings": {
        "0": 3, // Abundant 匹配 丰富的
        "1": 0, // Crucial 匹配 至关重要的
        "2": 1, // Preliminary 匹配 初步的
        "3": 2  // Skeptical 匹配 怀疑的
      }
    },
    "explanation": "Abundant - 丰富的, Crucial - 至关重要的, Preliminary - 初步的, Skeptical - 怀疑的",
    "type": "matching",
    "difficulty": "2",
    "createdAt": currentDate,
    "updatedAt": currentDate,
    "completed": false
  },
  {
    "id": "biology-5-1-1",
    "subject": "biology",
    "unitId": "biology-5-1",
    "question": "DNA复制过程中，DNA链是以______为单位进行合成的。",
    "options": null,
    "correctAnswer": ["脱氧核苷酸", "nucleotide"],
    "explanation": "DNA复制过程中，以脱氧核苷酸为单位，在脱氧核糖核酸聚合酶的作用下进行合成。",
    "type": "fill_blank",
    "difficulty": "2",
    "createdAt": currentDate,
    "updatedAt": currentDate,
    "completed": false
  },
  {
    "id": "chemistry-6-1-1",
    "subject": "chemistry",
    "unitId": "chemistry-6-1",
    "question": "计算25摄氏度下，0.1mol/L NaOH溶液的pH值。请写出计算过程并解释结果。",
    "options": {
      "allowPhoto": true,
      "hint": "强碱溶液的pH值与其浓度有关"
    },
    "correctAnswer": null,
    "explanation": "NaOH是强碱，在水溶液中完全电离。0.1mol/L NaOH溶液中，[OH-] = 0.1mol/L，pOH = -lg[OH-] = -lg(0.1) = 1，pH = 14 - pOH = 14 - 1 = 13。",
    "type": "application",
    "difficulty": "3",
    "createdAt": currentDate,
    "updatedAt": currentDate,
    "completed": false
  }
]; 