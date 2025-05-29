export const getChoiceExerciseOne = async (subjectName: string, unit: string, like?: string, difficulty?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  假如你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（选择题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合“${subjectName}”学科。
  2. 生成的题目必须围绕“${unit}”单元。
  ${like ? `3. 题目要与“${like}”任意一点或几点有相关性。` : ""}
  4. 题目类型需为“选择题”。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  5. 按照指定的JSON格式生成题目，其中“title”为题目名称，“type”为题目类型，“difficulty”为难度（1 - 3），“question”为题目内容，“options”为选项（包含“text”选项纯文本内容和“isCorrect”是否正确），“correctAnswer”为正确答案的索引，“explanation”为题目解析。并去掉换行符和空格

  示例：
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
  输出：符合示例规则要求的选择题json格式内容

  要求：
  1 以指定的JSON格式输出题目
  2 输出的题目需符合学科、单元、题目相关性和题目类型的要求
  ###`;
  const data = await fetchAIContent(prompt);
  return data;
};

export const getChoiceExerciseList = async (subjectName: string, unit: string, like?: string, difficulty?: number) => {
  if (!subjectName || !unit) {
    throw new Error("subjectName and unit are required");
  }
  const prompt = `
  ###
  假如你是一位专业的${subjectName}出题老师，你将根据给定的学科（${subjectName}）、单元（${unit}）${
    like ? `、题目相关性（${like}）` : ""
  }、题目类型（选择题）和难度等级（${
    difficulty ? `，${difficulty}` : "2"
  }），来生成json格式的题目。根据以下规则一步步执行：
  1. 生成的题目必须符合“${subjectName}”学科。
  2. 生成的题目必须围绕“${unit}”单元。
  ${like ? `3. 题目要与“${like}”任意一点或几点有相关性。` : ""}
  4. 题目类型需为“选择题”。
  5. 难度等级为1-3，难度越高，题目越难，本次难度为${difficulty ? `，${difficulty}` : "2"}
  5. 按照指定的JSON格式生成题目，其中“title”为题目名称，“type”为题目类型，“difficulty”为难度（1 - 3），“question”为题目内容，“options”为选项（包含“text”选项纯文本内容和“isCorrect”是否正确），“correctAnswer”为正确答案的索引，“explanation”为题目解析。并去掉换行符和空格

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
    return JSON.parse(data.choices[0].message.content.toString());
  } catch (error) {
    console.error("AI 请求失败:", error);
    throw error;
  }
}
