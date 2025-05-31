const fs = require("fs");
const path = require("path");

const imagePath = path.join(__dirname, "1.png");
// 读取图片并转换为base64格式的方法
function imageToBase64(imagePath) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(imagePath)) {
      throw new Error(`图片文件不存在: ${imagePath}`);
    }
    // 读取图片文件
    const imageBuffer = fs.readFileSync(imagePath);
    // 转换为base64格式
    const base64String = imageBuffer.toString("base64");
    // 获取文件扩展名来确定MIME类型
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType = "image/jpeg"; // 默认类型

    switch (ext) {
      case ".png":
        mimeType = "image/png";
        break;
      case ".jpg":
      case ".jpeg":
        mimeType = "image/jpeg";
        break;
      case ".gif":
        mimeType = "image/gif";
        break;
      case ".webp":
        mimeType = "image/webp";
        break;
      case ".bmp":
        mimeType = "image/bmp";
        break;
    }

    // 返回完整的data URL格式
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error("转换图片为base64时出错:", error.message);
    throw error;
  }
}

// 使用示例
// const base64Image = imageToBase64(imagePath);
// console.log('Base64图片数据:', base64Image);

// const imageBuffer = fs.readFileSync(imagePath);

const text = `###
你的任务是分析图片，提取图片中的数据，判断题目类型，并将结果以指定的JSON格式返回

请按照以下步骤完成任务：
1. 仔细观察图片，识别图片中包含的数据信息。
2. 根据识别出的数据和图片整体内容，判断当前学科, 所属课程，题目类型。
3. 现有的学科列表: [], 如果图中的学科与课程不在已有的学科、课程列表中，则返回空数据。如果其中某道题目的类型不在已有的题型列表中，则跳过该题目即可。
3. 根据以下题目示例，判断题目类型，并采取示例模板，按照指定JSON格式填充好数据返回。
- 其中“title”为题目名称，“type”为题目类型，“difficulty”为难度（1-3），“question”为题目内容(HTML格式)，“explanation”为题目解析，"subject"为学科
- “options”在选择题下为选项（包含“text”选项内容(HTML格式)和“isCorrect”是否正确），在匹配题下为选项（包含“left”左侧选项内容(HTML格式)和“right”右侧选项内容(HTML格式)）
- “correctAnswer”在选择题下为正确答案的索引，在填空题下为正确答案的数组，在匹配题下为正确答案的索引对象{"0":"1"}代表左侧0号选项对应右侧1号选项,
4. HTML中的任何图形化的内容都以SVG标签输出，禁止使用img标签，图形化的内容必须仔细确认与原图保持一致

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
匹配题示例：
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

最终返回JSON数组示例:
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

以下是需要分析的图片
###`;

async function callDoubaoImageAPI() {
  console.time("API");
  try {
    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer e4e91d48-62cc-4bb2-a3f8-2b31d6de329c",
        },
        body: JSON.stringify({
          // model: "doubao-1-5-vision-pro-32k-250115",
          model: "doubao-1-5-thinking-vision-pro-250428",
          messages: [
            {
              role: "system",
              content: [
                {
                  text: text,
                  type: "text",
                },
                {
                  image_url: {
                    url: imageToBase64(imagePath),
                  },
                  type: "image_url",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data.choices[0].message.content.toString());
    console.timeEnd("API");
    // console.log(JSON.parse(data.choices[0].message.content.toString()));
    // console.log(JSON.parse(data.choices[0].message.content, null, 2));
    return data;
  } catch (error) {
    console.error("请求失败:", error);
    throw error;
  }
}

// 调用函数
callDoubaoImageAPI();
