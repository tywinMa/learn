const { LearningContent, Subject, Unit } = require('../models');

/**
 * 为几何单元添加学习内容
 */
const addGeometryLearningContent = async () => {
  try {
    console.log('开始为几何单元添加学习内容...');

    // 几何单元ID：math-2-1 (三角形单元)
    const unitId = 'math-2-1';
    const subjectCode = 'math';

    // 检查单元是否存在
    const unit = await Unit.findOne({ where: { id: unitId } });
    if (!unit) {
      throw new Error(`单元 ${unitId} 不存在，请先初始化学科数据`);
    }

    // 检查单元是否已有学习内容
    const existingCount = await LearningContent.count({ where: { unitId } });
    console.log(`单元 ${unitId} 已有 ${existingCount} 条学习内容`);

    // 要添加的学习内容
    const learningContents = [
      {
        unitId: unitId,
        subject: subjectCode,
        title: '三角形的基本概念',
        content: `<h1>三角形的基本概念</h1>
<p>三角形是由三条线段首尾相连构成的闭合平面图形。</p>
<p>三角形的基本要素包括：</p>
<ul>
  <li>三条边</li>
  <li>三个内角</li>
  <li>三个顶点</li>
</ul>
<p>三角形的分类：</p>
<ol>
  <li>按照边的关系分类：等边三角形、等腰三角形、不等边三角形</li>
  <li>按照角的关系分类：锐角三角形、直角三角形、钝角三角形</li>
</ol>`,
        order: 1,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: unitId,
        subject: subjectCode,
        title: '三角形的内角和定理',
        content: `<h1>三角形的内角和定理</h1>
<p>三角形的内角和等于180度（或π弧度）。</p>
<p>这是平面几何中最基本的定理之一，可以通过平行线性质证明。</p>
<p>内角和定理的应用：</p>
<ul>
  <li>已知两个内角，可以求第三个内角</li>
  <li>在直角三角形中，两个锐角互为余角（和为90度）</li>
  <li>等边三角形的每个内角均为60度</li>
</ul>
<p>例题：三角形的两个内角分别是30°和45°，求第三个内角的度数。</p>
<p>解：第三个内角 = 180° - 30° - 45° = 105°</p>`,
        order: 2,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: unitId,
        subject: subjectCode,
        title: '三角形视频讲解',
        content: `<h1>三角形视频讲解</h1>
<p>请观看视频了解三角形的基本性质和分类。</p>`,
        order: 3,
        type: 'video',
        mediaUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        metadata: { duration: '8:30', resolution: '720p' }
      },
      {
        unitId: unitId,
        subject: subjectCode,
        title: '直角三角形与勾股定理',
        content: `<h1>直角三角形与勾股定理</h1>
<p>直角三角形是一个内角等于90度的三角形。</p>
<p>勾股定理：在直角三角形中，两直角边的平方和等于斜边的平方。</p>
<p class="formula">a² + b² = c²</p>
<p>其中a和b是直角边的长度，c是斜边的长度。</p>
<p>例如，边长为3、4、5的三角形是直角三角形，因为3² + 4² = 5²。</p>
<p>勾股定理的应用：</p>
<ul>
  <li>已知两直角边，可以求斜边</li>
  <li>已知一直角边和斜边，可以求另一直角边</li>
  <li>判断三角形是否是直角三角形</li>
</ul>`,
        order: 4,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: unitId,
        subject: subjectCode,
        title: '勾股定理的证明',
        content: `<h1>勾股定理的证明</h1>
<p>勾股定理有很多不同的证明方法，以下是其中一种基于面积的证明：</p>
<p>1. 作一个边长为a+b的正方形</p>
<p>2. 在正方形内放入4个全等的直角三角形，每个直角三角形的直角边长度为a和b</p>
<p>3. 这样在正方形中间留下一个边长为c的正方形</p>
<p>4. 正方形的总面积为(a+b)²</p>
<p>5. 四个三角形的总面积为4 × (½ab) = 2ab</p>
<p>6. 中间正方形的面积为c²</p>
<p>7. 所以有：(a+b)² = 2ab + c²</p>
<p>8. 展开得：a² + 2ab + b² = 2ab + c²</p>
<p>9. 化简得：a² + b² = c²</p>`,
        order: 5,
        type: 'text',
        mediaUrl: null
      }
    ];

    // 批量创建学习内容
    for (const content of learningContents) {
      const [newContent, created] = await LearningContent.findOrCreate({
        where: { 
          unitId: content.unitId,
          title: content.title
        },
        defaults: content
      });

      if (created) {
        console.log(`已添加学习内容: ${newContent.title}`);
      } else {
        console.log(`学习内容 ${newContent.title} 已存在，跳过`);
      }
    }

    console.log('几何单元学习内容添加完成！');
    return true;
  } catch (error) {
    console.error('添加几何单元学习内容出错:', error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  addGeometryLearningContent()
    .then(() => {
      console.log('几何单元学习内容添加脚本执行完毕');
      process.exit(0);
    })
    .catch(err => {
      console.error('几何单元学习内容添加脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = addGeometryLearningContent; 