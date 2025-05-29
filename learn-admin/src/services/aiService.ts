export const getChoiceExerciseOne = async (subjectName: string, unit: string, like?: string, difficulty?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（选择题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${like ? `3. 题目要与"${like}"任意一点或几点有相关性。` : ""}题目要形象生动有趣味性, 不要过于抽象和简陋
  4. 题目类型需为"选择题"。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  5. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"为选项（包含"text"选项纯文本内容和"isCorrect"是否正确），"correctAnswer"为正确答案的索引，"explanation"为题目解析。并去掉换行符和空格

  选择题示例：
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
  }
  输出：符合示例规则要求的题目json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、单元、题目相关性和题目类型的要求
  ###`;
  const data = await fetchAIContent(prompt);
  return data;
};

export const getChoiceExerciseList = async (subjectName: string, unit: string, like?: string, difficulty?: number, questionCount?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（选择题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${like ? `3. 题目要与"${like}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
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
  const data = await fetchAIContent(prompt);
  return data;
};


export const getFillBlankExerciseOne = async (subjectName: string, unit: string, like?: string, difficulty?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（填空题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${like ? `3. 题目要与"${like}"任意一点或几点有相关性。` : ""}题目要形象生动有趣味性, 不要过于抽象和简陋
  4. 题目类型需为"填空题"。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  5. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"为选项（包含"text"选项纯文本内容和"isCorrect"是否正确），"correctAnswer"为正确答案的索引，"explanation"为题目解析。并去掉换行符和空格

  填空题示例:
  {
    "title": "加法运算",
    "type": "fill_blank",
    "difficulty": 3,
    "question": "计算：2 + 3 = ____",
    "options": null,
    "correctAnswer": ["5"],
    "explanation": "2加3等于5"
  }
  输出：符合示例规则要求的题目json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、单元、题目相关性和题目类型的要求
  ###`;
  const data = await fetchAIContent(prompt);
  return data;
};

export const getFillBlankExerciseList = async (subjectName: string, unit: string, like?: string, difficulty?: number, questionCount?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（填空题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${like ? `3. 题目要与"${like}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
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
  const data = await fetchAIContent(prompt);
  return data;
};

export const getMatchingExerciseOne = async (subjectName: string, unit: string, like?: string, difficulty?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（匹配题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${like ? `3. 题目要与"${like}"任意一点或几点有相关性。` : ""}题目要形象生动有趣味性, 不要过于抽象和简陋
  4. 题目类型需为"匹配题"。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  6. 按照指定的JSON格式生成题目，其中"title"为题目名称，"type"为题目类型，"difficulty"为难度（1 - 3），"question"为题目内容，"options"包含"left"左侧选项列表和"right"右侧选项列表，"correctAnswer"为正确匹配关系（使用对象格式，左侧索引作为键，右侧索引作为值），"explanation"为题目解析。并去掉换行符和空格

  匹配题示例:
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
  }
  输出：符合示例规则要求的题目json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、单元、题目相关性和题目类型的要求
  3 left和right选项的数量应该相等，通常为4-6个选项
  4 correctAnswer使用对象格式，键为左侧选项索引（字符串），值为对应的右侧选项索引（字符串）
  ###`;
  const data = await fetchAIContent(prompt);
  return data;
};

export const getMatchingExerciseList = async (subjectName: string, unit: string, like?: string, difficulty?: number, questionCount?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（匹配题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合"${subjectName}"学科。
  2. 生成的题目必须围绕"${unit}"单元。
  ${like ? `3. 题目要与"${like}"这其中任意一点或几点有相关性。` : ""}题目要形象生动有趣味性，不要过于抽象和简陋
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
  const data = await fetchAIContent(prompt);
  return data;
};

export async function fetchAIContent(text: string) {
  if (!text) {
    throw new Error("ai text is required");
  }
  try {
    const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer e4e91d48-62cc-4bb2-a3f8-2b31d6de329c",
      },
      body: JSON.stringify({
        model: "doubao-1-5-pro-32k-250115",
        messages: [{ role: "system", content: text }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('ai result',data.choices[0].message.content.toString());
    return JSON.parse(data.choices[0].message.content.toString());
  } catch (error) {
    console.error("AI 请求失败:", error);
    throw error;
  }
}
