const TaskService = require('./taskService');
const { Exercise, Grade } = require('../models');
const axios = require('axios');

/**
 * AI任务服务类
 */
class AITaskService {


  /**
   * 创建AI生成单个习题任务
   */
  static async createAIGenerateSingleExerciseTask(params, createdBy = null) {
    try {
      const { subject, gradeId, type, courseId, relevance, difficulty } = params;

      const typeDescription = type === 'choice' ? '选择题' : 
                          type === 'fill_blank' ? '填空题' : 
                          type === 'matching' ? '匹配题' : '题目';

      const task = await TaskService.createTask({
        type: 'ai_generate_single_exercise',
        title: `AI生成单个习题`,
        description: `正在生成${typeDescription}...`,
        params,
        createdBy
      });

      // 异步执行任务
      setImmediate(() => {
        AITaskService.executeAIGenerateSingleExercise(task.id, params);
      });

      return task;
    } catch (error) {
      console.error('创建AI生成单个习题任务失败:', error);
      throw error;
    }
  }



  /**
   * 执行AI生成单个习题任务
   */
  static async executeAIGenerateSingleExercise(taskId, params) {
    try {
      // 更新任务状态为运行中
      await TaskService.updateTaskStatus(taskId, 'running');
      
      const { subject, gradeId, type, courseId, relevance, difficulty } = params;

      // 调用AI生成接口，生成单个习题
      const aiExercise = await AITaskService.callAIGenerateAPI(subject, gradeId, type, courseId, relevance, difficulty, 1);
      
      if (!aiExercise || (Array.isArray(aiExercise) && aiExercise.length === 0)) {
        await TaskService.setTaskError(taskId, 'AI生成习题失败，返回数据为空');
        return;
      }

      // 如果返回的是数组，取第一个元素
      const exerciseData = Array.isArray(aiExercise) ? aiExercise[0] : aiExercise;

      // 格式化并创建习题
      const formattedExerciseData = AITaskService.formatExerciseData(exerciseData, subject, type, 1);
      const createdExercise = await Exercise.create(formattedExerciseData);

      if (createdExercise && createdExercise.id) {
        // 任务完成，返回习题数据
        await TaskService.setTaskResult(taskId, {
          exerciseId: createdExercise.id,
          exerciseData: createdExercise,
          message: 'AI生成单个习题成功！'
        });
      } else {
        await TaskService.setTaskError(taskId, '习题创建失败');
      }

    } catch (error) {
      console.error('执行AI生成单个习题任务失败:', error);
      await TaskService.setTaskError(taskId, error);
    }
  }

  /**
   * 调用AI生成接口（与前端保持一致）
   */
  static async callAIGenerateAPI(subject, gradeId, type, courseId, relevance, difficulty, questionCount) {
    try {
      // 获取学科名称
      const subjectNames = {
        'math': '数学',
        'chinese': '语文',
        'english': '英语',
        'physics': '物理',
        'chemistry': '化学',
        'biology': '生物',
        'history': '历史',
        'geography': '地理',
        'politics': '政治'
      };
      
      const subjectName = subjectNames[subject] || subject;
      
      // 获取年级信息
      let gradeName = '通用年级';
      if (gradeId) {
        const grade = await Grade.findByPk(gradeId);
        if (grade) {
          gradeName = grade.name;
        }
      }
      
      const unit = '通用单元'; // 可以根据courseId查询实际课程/单元信息

      let prompt;
      if (type === 'choice') {
        prompt = AITaskService.getChoicePrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount);
      } else if (type === 'fill_blank') {
        prompt = AITaskService.getFillBlankPrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount);
      } else if (type === 'matching') {
        prompt = AITaskService.getMatchingPrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount);
      } else if (type === 'mixed') {
        prompt = AITaskService.getMixedPrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount);
      } else {
        throw new Error(`不支持的题目类型: ${type}`);
      }

      // 调用真实的AI接口（与前端aiService.ts中的fetchAIContent保持一致）
      const aiData = await AITaskService.fetchAIContent(prompt);
      
      return aiData;
    } catch (error) {
      console.error('调用AI API失败:', error);
      throw error;
    }
  }

  /**
   * 调用AI接口（使用axios与前端保持一致）
   */
  static async fetchAIContent(text) {
    if (!text) {
      throw new Error("ai text is required");
    }
    
    try {
      const response = await axios.post("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
        model: "doubao-1-5-thinking-pro-250415",
        // model: "doubao-1-5-pro-32k-250115",
        messages: [{ role: "system", content: text }],
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer e4e91d48-62cc-4bb2-a3f8-2b31d6de329c",
        },
      });

      console.log('AI result:', response.data.choices[0].message.content.toString());
      return JSON.parse(response.data.choices[0].message.content.toString());
    } catch (error) {
      console.error("AI 请求失败:", error);
      throw error;
    }
  }

  /**
   * 格式化习题数据
   */
  static formatExerciseData(aiExercise, subject, type, index) {
    // 生成唯一的习题ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const exerciseId = `${subject}-${timestamp}-${random}`;

    let exerciseData = {
      id: exerciseId, // 添加必需的id字段
      subject: subject,
      title: aiExercise.title || `习题${index}`,
      question: aiExercise.question || "",
      type: aiExercise.type || type,
      difficulty: aiExercise.difficulty || 2,
      explanation: aiExercise.explanation || "",
      isAI: true,
    };

    if (type === 'choice' || aiExercise.type === 'choice') {
      let processedOptions = aiExercise.options;
      let correctAnswer = aiExercise.correctAnswer;

      if (Array.isArray(aiExercise.options)) {
        processedOptions = aiExercise.options.map((option) => 
          option.text || option.content || String(option)
        );

        if (typeof correctAnswer !== "number") {
          correctAnswer = aiExercise.options.findIndex((opt) => opt.isCorrect === true);
          if (correctAnswer === -1) correctAnswer = 0;
        }
      }

      exerciseData.options = processedOptions;
      exerciseData.correctAnswer = correctAnswer;
    } else if (type === 'fill_blank' || aiExercise.type === 'fill_blank') {
      exerciseData.options = null;
      exerciseData.correctAnswer = Array.isArray(aiExercise.correctAnswer) 
        ? aiExercise.correctAnswer 
        : [aiExercise.correctAnswer || ''];
    } else if (type === 'matching' || aiExercise.type === 'matching') {
      exerciseData.options = aiExercise.options || [];
      exerciseData.correctAnswer = aiExercise.correctAnswer || [];
    } else if (type === 'mixed') {
      // 混合题型，根据AI返回的实际类型来处理
      if (aiExercise.type === 'choice') {
        let processedOptions = aiExercise.options;
        let correctAnswer = aiExercise.correctAnswer;

        if (Array.isArray(aiExercise.options)) {
          processedOptions = aiExercise.options.map((option) => 
            option.text || option.content || String(option)
          );

          if (typeof correctAnswer !== "number") {
            correctAnswer = aiExercise.options.findIndex((opt) => opt.isCorrect === true);
            if (correctAnswer === -1) correctAnswer = 0;
          }
        }

        exerciseData.options = processedOptions;
        exerciseData.correctAnswer = correctAnswer;
      } else if (aiExercise.type === 'fill_blank') {
        exerciseData.options = null;
        exerciseData.correctAnswer = Array.isArray(aiExercise.correctAnswer) 
          ? aiExercise.correctAnswer 
          : [aiExercise.correctAnswer || ''];
      } else if (aiExercise.type === 'matching') {
        exerciseData.options = aiExercise.options || [];
        exerciseData.correctAnswer = aiExercise.correctAnswer || [];
      }
    }

    return exerciseData;
  }

  /**
   * 获取选择题提示词（与前端保持一致）
   */
  static getChoicePrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount) {
    return `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、年级（${gradeName}）、单元（${unit}）${
    relevance ? `、题目相关性（${relevance}）` : ""
  }、题目类型（选择题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须适合"${gradeName}"年级学生的知识水平和认知能力。
  3. 生成的题目必须围绕"${unit}"单元。
  ${relevance ? `4. 题目要与"${relevance}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
  5. 题目类型需为"选择题"。
  6. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  7. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"为选项（包含"text"选项纯文本内容和"isCorrect"是否正确），"correctAnswer"为正确答案的索引，"explanation"为题目解析。并去掉换行符和空格
  8. 生成的题目需要符合数组格式，数组中每个元素为题目对象，数组中题目元素个数为${questionCount ? `，${questionCount}` : "3"}个，且每个元素的题目不能重复

  示例：
  [
    {
      "title": "加法运算",
      "type": "choice",
      "difficulty": 1,
      "question": "计算：2 + 3 =?",
      "options": [
        {"text": "4", "isCorrect": false},
        {"text": "5", "isCorrect": true},
        {"text": "6", "isCorrect": false},
        {"text": "7", "isCorrect": false}
      ],
      "correctAnswer": 1,
      "explanation": "2加3等于5"
    },
    ...
    ...
  ]
  输出：符合示例规则要求的选择题json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、年级、单元、题目相关性和题目类型的要求
  ###`;
  }

  /**
   * 获取填空题提示词（与前端保持一致）
   */
  static getFillBlankPrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount) {
    return `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、年级（${gradeName}）、单元（${unit}）${
    relevance ? `、题目相关性（${relevance}）` : ""
  }、题目类型（填空题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须适合"${gradeName}"年级学生的知识水平和认知能力。
  3. 生成的题目必须围绕"${unit}"单元。
  ${relevance ? `4. 题目要与"${relevance}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
  5. 题目类型需为"填空题"。
  6. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  7. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"为选项（填空题为null），"correctAnswer"为正确答案的索引，"explanation"为题目解析。并去掉换行符和空格
  8. 生成的题目需要符合数组格式，数组中每个元素为题目对象，数组中题目元素个数为${questionCount ? `，${questionCount}` : "3"}个，且每个元素的题目不能重复

  填空题示例:
  [
    {
      "title": "加法运算",
      "type": "fill_blank",
      "difficulty": 3,
      "question": "计算：2 + 3 = ____",
      "options": null,
      "correctAnswer": ["5"],
      "explanation": "2加3等于5"
    },
    ...
    ...
  ]
  输出：符合示例规则要求的json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、年级、单元、题目相关性和题目类型的要求
  ###`;
  }

  /**
   * 获取匹配题提示词（与前端保持一致）
   */
  static getMatchingPrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount) {
    return `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、年级（${gradeName}）、单元（${unit}）${
    relevance ? `、题目相关性（${relevance}）` : ""
  }、题目类型（匹配题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须适合"${gradeName}"年级学生的知识水平和认知能力。
  3. 生成的题目必须围绕"${unit}"单元。
  ${relevance ? `4. 题目要与"${relevance}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
  5. 题目类型需为"匹配题"。
  6. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  7. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"包含"left"左侧选项列表和"right"右侧选项列表，"correctAnswer"为正确匹配关系（使用对象格式，左侧索引作为键，右侧索引作为值），"explanation"为题目解析。并去掉换行符和空格
  8. 生成的题目需要符合数组格式，数组中每个元素为题目对象，数组中题目元素个数为${questionCount ? `，${questionCount}` : "3"}个，且每个元素的题目不能重复

  匹配题示例:
  [
    {
      "title": "数字与中文匹配",
      "type": "matching",
      "difficulty": 1,
      "question": "请将下列数字与对应的中文数字进行匹配：",
      "options": {
        "left": ["1", "2", "3", "4"],
        "right": ["四", "二", "一", "三"]
      },
      "correctAnswer": {
        "0": "2",
        "1": "1",
        "2": "3",
        "3": "0"
      },
      "explanation": "1对应一，2对应二，3对应三，4对应四"
    },
    ...
    ...
  ]
  输出：符合示例规则要求的匹配题json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、年级、单元、题目相关性和题目类型的要求
  3 left和right选项的数量应该相等，通常为4-6个选项
  4 correctAnswer使用对象格式，键为左侧选项索引（字符串），值为对应的右侧选项索引（字符串）
  ###`;
  }

  /**
   * 获取混合题提示词
   */
  static getMixedPrompt(subjectName, gradeName, unit, relevance, difficulty, questionCount) {
    return `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、年级（${gradeName}）、单元（${unit}）${
    relevance ? `、题目相关性（${relevance}）` : ""
  }、题目类型（混合题型）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须适合"${gradeName}"年级学生的知识水平和认知能力。
  3. 生成的题目必须围绕"${unit}"单元。
  4. ${relevance ? `题目要与"${relevance}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
  5. 题目类型为"混合题型"，可以任意出选择题、填空题、匹配题，让题目类型多样化。
  6. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  7. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为具体题目类型（choice/fill_blank/matching），"difficulty"为难度（1 - 3），"question"为题目内容，"options"为选项，"correctAnswer"为正确答案，"explanation"为题目解析。并去掉换行符和空格
  8. 生成的题目需要符合数组格式，数组中每个元素为题目对象，数组中题目元素个数为${questionCount ? `，${questionCount}` : "5"}个，且每个元素的题目不能重复

  混合题型示例:
  [
    {
      "title": "加法运算",
      "type": "choice",
      "difficulty": 1,
      "question": "计算：2 + 3 =?",
      "options": [
        {"text": "4", "isCorrect": false},
        {"text": "5", "isCorrect": true},
        {"text": "6", "isCorrect": false},
        {"text": "7", "isCorrect": false}
      ],
      "correctAnswer": 1,
      "explanation": "2加3等于5"
    },
    {
      "title": "减法运算",
      "type": "fill_blank",
      "difficulty": 2,
      "question": "计算：10 - 3 = ____",
      "options": null,
      "correctAnswer": ["7"],
      "explanation": "10减3等于7"
    },
    ...
    ...
  ]
  输出：符合示例规则要求的混合题型json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、年级、单元、题目相关性和题目类型的要求
  3 题目类型要多样化，包含选择题、填空题、匹配题
  ###`;
  }
}

module.exports = AITaskService; 