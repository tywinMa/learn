const { Unit, Subject } = require('../models');

/**
 * 初始化几何单元内容
 */
const initGeometryUnitContent = async () => {
  try {
    console.log('开始初始化几何单元内容...');

    // 获取数学学科
    const mathSubject = await Subject.findOne({ where: { code: 'math' } });
    if (!mathSubject) {
      throw new Error('找不到数学学科，请先初始化学科数据');
    }
    const mathSubjectCode = mathSubject.code;

    // 查找几何单元
    const unitId = `${mathSubjectCode}-2-1`;
    const unit = await Unit.findOne({ where: { id: unitId } });
    if (!unit) {
      console.log(`未找到 ${unitId} 单元，跳过内容初始化`);
      return;
    }

    // 检查单元是否已有内容
    if (unit.content) {
      console.log(`单元 ${unitId} 已有内容，跳过初始化`);
      return;
    }

    // 准备内容
    const content = `<h1>几何基础知识</h1>
<p>几何学是研究空间形状、大小和位置关系的数学学科。本单元将介绍基本的几何概念和定理。</p>

<h2>基本概念</h2>
<p>点、线、面是几何学的三个基本元素：</p>
<ul>
  <li><strong>点</strong>：没有大小，只有位置</li>
  <li><strong>直线</strong>：由无数个点组成，没有宽度，无限延伸</li>
  <li><strong>平面</strong>：由无数条直线组成，无限延伸的二维表面</li>
</ul>

<h2>角度与三角形</h2>
<p>角是由两条射线（半直线）从同一个点出发形成的图形。</p>
<p>三角形是由三条线段首尾相接围成的平面图形。</p>
<p>三角形的内角和等于180度，这是几何中的重要定理。</p>

<h2>四边形</h2>
<p>四边形是由四条线段首尾相接围成的平面图形。常见的四边形包括：</p>
<ul>
  <li><strong>正方形</strong>：四条边相等且四个角都是直角</li>
  <li><strong>矩形</strong>：对边平行且相等，四个角都是直角</li>
  <li><strong>平行四边形</strong>：对边平行且相等</li>
  <li><strong>梯形</strong>：只有一组对边平行</li>
</ul>`;

    // 准备媒体内容
    const media = [
      {
        type: 'image',
        title: '基本几何元素示意图',
        url: 'https://examples.com/geometry-basics.jpg',
        metadata: { width: 800, height: 600, format: 'jpg' }
      },
      {
        type: 'video',
        title: '三角形内角和定理讲解',
        url: 'https://d23dyxeqlo5psv.cloudfront.net/triangle_angles.mp4',
        metadata: { duration: '5:45', resolution: '720p' }
      },
      {
        type: 'image',
        title: '四边形分类图',
        url: 'https://examples.com/quadrilaterals.jpg',
        metadata: { width: 1024, height: 768, format: 'jpg' }
      }
    ];

    // 更新单元内容
    await unit.update({
      content,
      media
    });

    console.log(`成功初始化单元 ${unitId} 的内容`);
  } catch (error) {
    console.error('初始化几何单元内容出错:', error);
    throw error;
  }
};

module.exports = initGeometryUnitContent; 