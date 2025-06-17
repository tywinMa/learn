const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// 配置图片上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持上传图片文件'), false);
    }
  }
});

// 模拟AI解题服务 - 实际项目中应该集成真实的AI服务
const simulateAIResponse = async (imageBuffer) => {
  // 这里应该调用真实的AI服务，比如OpenAI的GPT-4V或者其他视觉AI服务
  // 暂时返回模拟的解题步骤
  return {
    problem: "检测到数学题目：求解一元二次方程 x² - 5x + 6 = 0",
    solution: `
**解题步骤：**

1. **识别题目类型**
   这是一个一元二次方程，标准形式为 ax² + bx + c = 0
   其中 a = 1, b = -5, c = 6

2. **选择解题方法**
   可以使用因式分解法或求根公式

3. **因式分解法求解**
   x² - 5x + 6 = 0
   寻找两个数，相加等于-5，相乘等于6
   这两个数是-2和-3
   
   因式分解：(x - 2)(x - 3) = 0

4. **求解**
   x - 2 = 0  或  x - 3 = 0
   x = 2     或  x = 3

5. **验证答案**
   当x = 2时：2² - 5(2) + 6 = 4 - 10 + 6 = 0 ✓
   当x = 3时：3² - 5(3) + 6 = 9 - 15 + 6 = 0 ✓

**答案：x = 2 或 x = 3**
    `,
    confidence: 0.95
  };
};

// 流式返回AI解答
const solveProblem = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    // 处理图片
    const imageBuffer = req.file.buffer;
    
    // 可以使用sharp对图片进行预处理
    const processedImage = await sharp(imageBuffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 获取AI解答
    const aiResponse = await simulateAIResponse(processedImage);
    
    // 流式返回解答内容
    const content = aiResponse.solution;
    const chunkSize = 20; // 每次发送的字符数
    
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      res.write(chunk);
      
      // 添加延迟模拟真实的AI思考过程
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.end();

  } catch (error) {
    console.error('AI解题错误:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '解题服务暂时不可用' });
    }
  }
};

// 获取解题历史
const getSolutionHistory = async (req, res) => {
  try {
    // 这里应该从数据库获取用户的解题历史
    // 暂时返回模拟数据
    const history = [
      {
        id: 1,
        date: new Date().toISOString(),
        problem: "一元二次方程求解",
        image_url: null,
        solution_preview: "x² - 5x + 6 = 0 的解为 x = 2 或 x = 3"
      }
    ];

    res.json({ history });
  } catch (error) {
    console.error('获取历史记录错误:', error);
    res.status(500).json({ error: '获取历史记录失败' });
  }
};

module.exports = {
  upload,
  solveProblem,
  getSolutionHistory
}; 