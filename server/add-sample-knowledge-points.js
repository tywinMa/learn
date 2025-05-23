const { sequelize } = require('./src/config/database');
const Exercise = require('./src/models/Exercise');

async function addSampleKnowledgePoints() {
  try {
    console.log('开始添加示例知识点数据...');
    
    // 查找所有现有的练习题
    const exercises = await Exercise.findAll();
    console.log(`找到 ${exercises.length} 道练习题`);
    
    // 为前几道题添加示例知识点
    const sampleKnowledgePoints = [
      // 数学相关知识点
      {
        title: "一元二次方程",
        content: "<p><strong>一元二次方程</strong>是形如 ax² + bx + c = 0 (a ≠ 0) 的方程。</p><p><strong>解法：</strong></p><ul><li>配方法</li><li>公式法：x = (-b ± √(b²-4ac)) / 2a</li><li>因式分解法</li></ul>",
        type: "text"
      },
      {
        title: "因式分解",
        content: "<p><strong>因式分解</strong>是把一个多项式化为几个整式的积的形式。</p><p><strong>常用方法：</strong></p><ul><li>提取公因子</li><li>平方差公式：a² - b² = (a+b)(a-b)</li><li>完全平方公式：a² ± 2ab + b² = (a ± b)²</li></ul>",
        type: "text"
      },
      {
        title: "代数基础",
        content: "<p><strong>代数</strong>是数学的一个分支，主要研究数量关系和结构。</p><p><strong>基本概念：</strong></p><ul><li>变量与常量</li><li>代数表达式</li><li>方程与不等式</li></ul>",
        type: "text"
      }
    ];
    
    let updateCount = 0;
    
    // 为每道练习题随机分配1-2个知识点
    for (const exercise of exercises) {
      // 随机选择1-2个知识点
      const numPoints = Math.floor(Math.random() * 2) + 1;
      const selectedPoints = [];
      
      for (let i = 0; i < numPoints; i++) {
        const randomIndex = Math.floor(Math.random() * sampleKnowledgePoints.length);
        const point = sampleKnowledgePoints[randomIndex];
        
        // 避免重复添加同一个知识点
        if (!selectedPoints.find(p => p.title === point.title)) {
          selectedPoints.push(point);
        }
      }
      
      if (selectedPoints.length > 0) {
        await exercise.update({
          knowledgePoints: selectedPoints
        });
        updateCount++;
        console.log(`已为练习题 ${exercise.id} 添加 ${selectedPoints.length} 个知识点: ${selectedPoints.map(p => p.title).join(', ')}`);
      }
    }
    
    console.log(`\n成功为 ${updateCount} 道练习题添加了知识点数据！`);
    process.exit(0);
  } catch (error) {
    console.error('添加知识点数据时出错:', error);
    process.exit(1);
  }
}

addSampleKnowledgePoints(); 