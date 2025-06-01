const TaskService = require('./taskService');
const { ExerciseGroup, Exercise } = require('../models');
const axios = require('axios');

/**
 * AI任务服务类
 */
class AITaskService {
  /**
   * 创建AI生成习题组任务
   */
  static async createAIGenerateExerciseGroupTask(params, createdBy = null) {
    try {
      const { groupName, subject, type, courseId, relevance, difficulty, questionCount } = params;

      const task = await TaskService.createTask({
        type: 'ai_generate_exercise_group',
        title: `AI生成习题组: ${groupName}`,
        description: `正在生成${questionCount}道${type === 'choice' ? '选择题' : type === 'fill_blank' ? '填空题' : '匹配题'}...`,
        params,
        createdBy
      });

      // 异步执行任务
      setImmediate(() => {
        AITaskService.executeAIGenerateExerciseGroup(task.id, params);
      });

      return task;
    } catch (error) {
      console.error('创建AI生成习题组任务失败:', error);
      throw error;
    }
  }

  /**
   * 执行AI生成习题组任务
   */
  static async executeAIGenerateExerciseGroup(taskId, params) {
    try {
      // 更新任务状态为运行中
      await TaskService.updateTaskStatus(taskId, 'running');
      
      const { groupName, subject, type, courseId, relevance, difficulty, questionCount } = params;

      // 步骤1: 调用AI生成接口
      const aiExercises = await AITaskService.callAIGenerateAPI(subject, type, courseId, relevance, difficulty, questionCount);
      
      if (!Array.isArray(aiExercises) || aiExercises.length === 0) {
        await TaskService.setTaskError(taskId, 'AI生成习题失败，返回数据为空');
        return;
      }

      // 步骤2: 创建习题组
      const exerciseGroupData = {
        id: `${subject}-group-${Date.now()}`,
        name: groupName,
        description: `AI自动生成的习题组（共${aiExercises.length}道题）`,
        subject: subject,
        exerciseIds: [],
        isActive: true,
      };

      const groupCreated = await ExerciseGroup.create(exerciseGroupData);
      if (!groupCreated) {
        await TaskService.setTaskError(taskId, '创建习题组失败');
        return;
      }

      const groupId = exerciseGroupData.id;

      // 步骤3: 批量创建习题
      const createdExerciseIds = [];
      const totalExercises = aiExercises.length;
      
      for (let i = 0; i < totalExercises; i++) {
        const aiExercise = aiExercises[i];
        try {
          const exerciseData = AITaskService.formatExerciseData(aiExercise, subject, type, i + 1);
          const createdExercise = await Exercise.create(exerciseData);

          if (createdExercise && createdExercise.id) {
            createdExerciseIds.push(String(createdExercise.id));
          }
        } catch (error) {
          console.error(`创建第${i + 1}个习题失败:`, error);
        }
      }

      // 步骤4: 更新习题组，添加习题ID
      if (createdExerciseIds.length > 0) {
        await ExerciseGroup.update(
          { exerciseIds: createdExerciseIds },
          { where: { id: groupId } }
        );

        // 任务完成
        await TaskService.setTaskResult(taskId, {
          groupId,
          exerciseCount: createdExerciseIds.length,
          exerciseIds: createdExerciseIds,
          message: `AI生成习题组成功！共创建了${createdExerciseIds.length}道习题`
        });
      } else {
        await TaskService.setTaskError(taskId, '习题组创建成功，但习题生成失败');
      }

    } catch (error) {
      console.error('执行AI生成习题组任务失败:', error);
      await TaskService.setTaskError(taskId, error);
    }
  }

  /**
   * 调用AI生成接口（与前端保持一致）
   */
  static async callAIGenerateAPI(subject, type, courseId, relevance, difficulty, questionCount) {
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
      const unit = '通用单元'; // 可以根据courseId查询实际课程/单元信息

      let prompt;
      if (type === 'choice') {
        prompt = AITaskService.getChoicePrompt(subjectName, unit, relevance, difficulty, questionCount);
      } else if (type === 'fill_blank') {
        prompt = AITaskService.getFillBlankPrompt(subjectName, unit, relevance, difficulty, questionCount);
      } else if (type === 'matching') {
        prompt = AITaskService.getMatchingPrompt(subjectName, unit, relevance, difficulty, questionCount);
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

    if (type === 'choice') {
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
    } else if (type === 'fill_blank') {
      exerciseData.options = null;
      exerciseData.correctAnswer = Array.isArray(aiExercise.correctAnswer) 
        ? aiExercise.correctAnswer 
        : [aiExercise.correctAnswer || ''];
    } else if (type === 'matching') {
      exerciseData.options = aiExercise.options || [];
      exerciseData.correctAnswer = aiExercise.correctAnswer || [];
    }

    return exerciseData;
  }

  /**
   * 获取选择题提示词（与前端保持一致）
   */
  static getChoicePrompt(subjectName, unit, relevance, difficulty, questionCount) {
    return `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    relevance ? `、题目相关性（${relevance}）` : ""
  }、题目类型（选择题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${relevance ? `3. 题目要与"${relevance}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
  4. 题目类型需为"选择题"。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  5. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"为选项（包含"text"选项纯文本内容和"isCorrect"是否正确），"correctAnswer"为正确答案的索引，"explanation"为题目解析。并去掉换行符和空格
  6. 生成的题目需要符合数组格式，数组中每个元素为题目对象，数组中题目元素个数为${questionCount ? `，${questionCount}` : "3"}个，且每个元素的题目不能重复

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
  2 输出的题目需符合学科、单元、题目相关性和题目类型的要求
  ###`;
  }

  /**
   * 获取填空题提示词（与前端保持一致）
   */
  static getFillBlankPrompt(subjectName, unit, relevance, difficulty, questionCount) {
    return `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    relevance ? `、题目相关性（${relevance}）` : ""
  }、题目类型（填空题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${relevance ? `3. 题目要与"${relevance}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
  4. 题目类型需为"填空题"。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  5. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"为选项（包含"text"选项纯文本内容和"isCorrect"是否正确），"correctAnswer"为正确答案的索引，"explanation"为题目解析。并去掉换行符和空格
  6. 生成的题目需要符合数组格式，数组中每个元素为题目对象，数组中题目元素个数为${questionCount ? `，${questionCount}` : "3"}个，且每个元素的题目不能重复

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
  2 输出的题目需符合学科、单元、题目相关性和题目类型的要求
  ###`;
  }

  /**
   * 获取匹配题提示词（与前端保持一致）
   */
  static getMatchingPrompt(subjectName, unit, relevance, difficulty, questionCount) {
    return `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    relevance ? `、题目相关性（${relevance}）` : ""
  }、题目类型（匹配题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${relevance ? `3. 题目要与"${relevance}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
  4. 题目类型需为"匹配题"。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  6. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"包含"left"左侧选项列表和"right"右侧选项列表，"correctAnswer"为正确匹配关系（使用对象格式，左侧索引作为键，右侧索引作为值），"explanation"为题目解析。并去掉换行符和空格
  7. 生成的题目需要符合数组格式，数组中每个元素为题目对象，数组中题目元素个数为${questionCount ? `，${questionCount}` : "3"}个，且每个元素的题目不能重复

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
  2 输出的题目需符合学科、单元、题目相关性和题目类型的要求
  3 left和right选项的数量应该相等，通常为4-6个选项
  4 correctAnswer使用对象格式，键为左侧选项索引（字符串），值为对应的右侧选项索引（字符串）
  ###`;
  }

  /**
   * 模拟AI生成的习题数据（保留作为备用）
   */
  static getMockExerciseData(type, questionCount) {
    const exercises = [];
    
    for (let i = 0; i < questionCount; i++) {
      if (type === 'choice') {
        exercises.push({
          title: `选择题${i + 1}`,
          type: 'choice',
          difficulty: 2,
          question: `这是第${i + 1}道选择题的题目内容`,
          options: [
            { text: '选项A', isCorrect: false },
            { text: '选项B', isCorrect: true },
            { text: '选项C', isCorrect: false },
            { text: '选项D', isCorrect: false }
          ],
          correctAnswer: 1,
          explanation: `这是第${i + 1}道题的解析`
        });
      } else if (type === 'fill_blank') {
        exercises.push({
          title: `填空题${i + 1}`,
          type: 'fill_blank',
          difficulty: 2,
          question: `这是第${i + 1}道填空题：_____`,
          correctAnswer: [`答案${i + 1}`],
          explanation: `这是第${i + 1}道题的解析`
        });
      } else if (type === 'matching') {
        exercises.push({
          title: `匹配题${i + 1}`,
          type: 'matching',
          difficulty: 2,
          question: `请将下列项目进行匹配：`,
          options: {
            left: ['左侧1', '左侧2', '左侧3', '左侧4'],
            right: ['右侧4', '右侧3', '右侧2', '右侧1']
          },
          correctAnswer: {
            '0': '3',
            '1': '2', 
            '2': '1',
            '3': '0'
          },
          explanation: `这是第${i + 1}道题的解析`
        });
      }
    }
    
    return exercises;
  }
}

module.exports = AITaskService; 