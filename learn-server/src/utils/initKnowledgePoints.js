const { sequelize } = require('../config/database');
const { KnowledgePoint, Exercise } = require('../models');

async function initKnowledgePoints() {
  try {
    console.log('开始初始化知识点数据...');
    
    // 清空现有知识点数据
    await KnowledgePoint.destroy({ where: {} });
    console.log('已清空现有知识点数据');
    
    // 重置所有练习题的知识点关联
    await Exercise.update(
      { knowledgePointIds: [] },
      { where: {} }
    );
    console.log('已重置练习题的知识点关联');
    
    // 创建数学学科的知识点
    const mathKnowledgePoints = [
      {
        title: "一元二次方程",
        content: "<p><strong>一元二次方程</strong>是形如 ax² + bx + c = 0 (a ≠ 0) 的方程。</p><p><strong>解法：</strong></p><ul><li>配方法</li><li>公式法：x = (-b ± √(b²-4ac)) / 2a</li><li>因式分解法</li></ul>",
        type: "text",
        subject: "math",
        difficulty: 2
      },
      {
        title: "因式分解",
        content: "<p><strong>因式分解</strong>是把一个多项式化为几个整式的积的形式。</p><p><strong>常用方法：</strong></p><ul><li>提取公因子</li><li>平方差公式：a² - b² = (a+b)(a-b)</li><li>完全平方公式：a² ± 2ab + b² = (a ± b)²</li></ul>",
        type: "text",
        subject: "math",
        difficulty: 2
      },
      {
        title: "代数基础",
        content: "<p><strong>代数</strong>是数学的一个分支，主要研究数量关系和结构。</p><p><strong>基本概念：</strong></p><ul><li>变量与常量</li><li>代数表达式</li><li>方程与不等式</li></ul>",
        type: "text",
        subject: "math",
        difficulty: 1
      },
      {
        title: "三角形基础",
        content: "<p><strong>三角形</strong>是由三条线段围成的封闭图形。</p><p><strong>基本性质：</strong></p><ul><li>内角和为180°</li><li>外角等于不相邻两内角之和</li><li>三边关系：任意两边之和大于第三边</li></ul>",
        type: "text",
        subject: "math",
        difficulty: 1
      },
      {
        title: "平面几何证明",
        content: "<p><strong>几何证明</strong>是用逻辑推理证明几何命题的过程。</p><p><strong>常用方法：</strong></p><ul><li>直接证明法</li><li>反证法</li><li>分类讨论法</li><li>构造辅助线</li></ul>",
        type: "text",
        subject: "math",
        difficulty: 3
      },
      {
        title: "函数与图像",
        content: "<p><strong>函数</strong>是描述两个变量之间对应关系的数学概念。</p><p><strong>基本类型：</strong></p><ul><li>一次函数：y = kx + b</li><li>二次函数：y = ax² + bx + c</li><li>反比例函数：y = k/x</li></ul>",
        type: "text",
        subject: "math",
        difficulty: 2
      }
    ];
    
    // 创建物理学科的知识点
    const physicsKnowledgePoints = [
      {
        title: "牛顿运动定律",
        content: "<p><strong>牛顿第一定律</strong>：惯性定律</p><p><strong>牛顿第二定律</strong>：F = ma</p><p><strong>牛顿第三定律</strong>：作用力与反作用力</p>",
        type: "text",
        subject: "physics",
        difficulty: 2
      },
      {
        title: "力的合成与分解",
        content: "<p><strong>力的合成</strong>：多个力的合力计算</p><p><strong>力的分解</strong>：将一个力分解为两个或多个分力</p><p><strong>平行四边形法则</strong>：力的合成遵循平行四边形法则</p>",
        type: "text",
        subject: "physics",
        difficulty: 2
      }
    ];
    
    // 批量创建知识点
    const allKnowledgePoints = [...mathKnowledgePoints, ...physicsKnowledgePoints];
    const createdKnowledgePoints = await KnowledgePoint.bulkCreate(allKnowledgePoints);
    console.log(`已创建 ${createdKnowledgePoints.length} 个知识点`);
    
    // 获取所有练习题
    const exercises = await Exercise.findAll();
    console.log(`找到 ${exercises.length} 道练习题`);
    
    if (exercises.length === 0) {
      console.log('未找到练习题，跳过关联创建');
      return;
    }
    
    // 为练习题关联知识点
    let associationCount = 0;
    
    for (const exercise of exercises) {
      // 根据学科筛选知识点
      const subjectKnowledgePoints = createdKnowledgePoints.filter(
        kp => kp.subject === exercise.subject
      );
      
      if (subjectKnowledgePoints.length === 0) {
        continue;
      }
      
      // 随机选择1-2个知识点
      const numPoints = Math.floor(Math.random() * 2) + 1;
      const shuffled = subjectKnowledgePoints.sort(() => 0.5 - Math.random());
      const selectedPoints = shuffled.slice(0, numPoints);
      
      // 提取知识点ID数组
      const knowledgePointIds = selectedPoints.map(kp => kp.id);
      
      // 更新练习题的知识点ID数组
      await exercise.update({ knowledgePointIds });
      associationCount += knowledgePointIds.length;
    }
    
    console.log('\n知识点初始化完成！');
    console.log('==============================================');
    console.log(`✓ 创建知识点：${createdKnowledgePoints.length} 个`);
    console.log(`✓ 创建关联：${associationCount} 个`);
    console.log('==============================================');
  } catch (error) {
    console.error('初始化知识点数据时出错:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initKnowledgePoints()
    .then(() => {
      console.log('知识点初始化脚本执行完毕');
      process.exit(0);
    })
    .catch((err) => {
      console.error('知识点初始化脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = initKnowledgePoints; 