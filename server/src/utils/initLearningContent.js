const { LearningContent, Subject } = require('../models');

/**
 * 初始化学习内容
 */
const initLearningContent = async () => {
  try {
    console.log('开始初始化学习内容...');

    // 检查是否已有数据
    const existingContent = await LearningContent.count();
    if (existingContent > 0) {
      console.log(`已存在 ${existingContent} 条学习内容记录，跳过初始化`);
      return;
    }

    // 获取数学学科ID
    const mathSubject = await Subject.findOne({ where: { code: 'math' } });
    if (!mathSubject) {
      throw new Error('找不到数学学科，请先初始化学科数据');
    }
    const mathSubjectId = mathSubject.id;

    // 获取英语学科ID
    const englishSubject = await Subject.findOne({ where: { code: 'english' } });
    const englishSubjectId = englishSubject ? englishSubject.id : null;

    // 获取物理学科ID
    const physicsSubject = await Subject.findOne({ where: { code: 'physics' } });
    const physicsSubjectId = physicsSubject ? physicsSubject.id : null;

    // 初始化数据
    const learningContents = [
      // 数学一元二次方程单元
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '一元二次方程的基本概念',
        content: `<h1>一元二次方程的基本概念</h1>
<p>一元二次方程是指含有一个未知数，并且未知数的最高次数是2的方程。其一般形式为：</p>
<p class="formula">ax² + bx + c = 0 (a ≠ 0)</p>
<p>其中a、b、c是已知数，x是未知数，a ≠ 0。</p>
<p>例如：</p>
<ul>
  <li>x² - 5x + 6 = 0</li>
  <li>2x² + 3x - 1 = 0</li>
  <li>3x² - 7 = 0</li>
</ul>`,
        order: 1,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '一元二次方程简介视频',
        content: `<h1>一元二次方程视频讲解</h1>
<p>请观看视频了解一元二次方程的基本概念和解法。</p>`,
        order: 2,
        type: 'video',
        mediaUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        metadata: { duration: '9:56', resolution: '720p' }
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '一元二次方程的解法 - 因式分解法',
        content: `<h1>因式分解法</h1>
<p>因式分解法是解一元二次方程的最基本方法，适用于容易分解因式的方程。</p>
<p>步骤：</p>
<ol>
  <li>将方程左边因式分解为两个一次因式的乘积</li>
  <li>令每个因式等于0，解出x的值</li>
</ol>
<p>例如，解方程：x² - 5x + 6 = 0</p>
<p>解：</p>
<p>x² - 5x + 6 = 0</p>
<p>(x - 2)(x - 3) = 0</p>
<p>所以x = 2或x = 3</p>
<p>答案：x = 2或x = 3</p>`,
        order: 3,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '因式分解法图解',
        content: `<h1>因式分解法图解</h1>
<p>以下图片展示了因式分解法的关键步骤。</p>`,
        order: 4,
        type: 'image',
        mediaUrl: 'https://math-examples.com/factorization-method.jpg',
        metadata: { width: 800, height: 600, format: 'jpg' }
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '一元二次方程的解法 - 公式法',
        content: `<h1>公式法</h1>
<p>公式法是解一元二次方程的通用方法，适用于所有一元二次方程。</p>
<p>一元二次方程ax² + bx + c = 0 (a ≠ 0)的解为：</p>
<p class="formula">x = (-b ± √(b² - 4ac)) / (2a)</p>
<p>其中，b² - 4ac称为判别式，记作Δ（Delta）。</p>
<ul>
  <li>当Δ > 0时，方程有两个不相等的实数解</li>
  <li>当Δ = 0时，方程有两个相等的实数解</li>
  <li>当Δ < 0时，方程没有实数解</li>
</ul>
<p>例如，解方程：2x² - 5x + 2 = 0</p>
<p>解：a = 2, b = -5, c = 2</p>
<p>Δ = b² - 4ac = (-5)² - 4×2×2 = 25 - 16 = 9</p>
<p>x = (-b ± √Δ) / (2a) = (5 ± 3) / 4</p>
<p>x₁ = (5 + 3) / 4 = 2</p>
<p>x₂ = (5 - 3) / 4 = 0.5</p>
<p>答案：x = 2或x = 0.5</p>`,
        order: 5,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '公式法视频讲解',
        content: `<h1>公式法视频讲解</h1>
<p>观看以下视频，了解如何使用公式法解一元二次方程。</p>`,
        order: 6,
        type: 'video',
        mediaUrl: 'https://d23dyxeqlo5psv.cloudfront.net/equation_solving.mp4',
        metadata: { duration: '7:23', resolution: '1080p' }
      },
      // 1-1 子单元（应用题专题）
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '一元二次方程的应用',
        content: `<h1>一元二次方程的应用</h1>
<p>一元二次方程在实际生活中有广泛的应用，例如：</p>
<ul>
  <li>求面积和体积</li>
  <li>数字问题</li>
  <li>行程问题</li>
  <li>经济问题</li>
</ul>
<p>解应用题的一般步骤：</p>
<ol>
  <li>设未知数</li>
  <li>根据题意列方程</li>
  <li>解方程</li>
  <li>检验答案并回答问题</li>
</ol>`,
        order: 1,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '应用题解析视频',
        content: `<h1>一元二次方程应用题解析</h1>
<p>通过视频讲解理解应用题的解题思路和方法。</p>`,
        order: 2,
        type: 'video',
        mediaUrl: 'https://d23dyxeqlo5psv.cloudfront.net/application_problems.mp4',
        metadata: { duration: '10:15', resolution: '720p' }
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '一元二次方程的应用 - 面积问题',
        content: `<h1>一元二次方程的应用 - 面积问题</h1>
<p>例题：一个长方形的周长是24米，面积是35平方米，求这个长方形的长和宽。</p>
<p>解：</p>
<p>设长方形的长为x米，宽为y米。</p>
<p>根据题意，有：</p>
<p>2(x + y) = 24 （周长）</p>
<p>x + y = 12 （周长的一半）</p>
<p>xy = 35 （面积）</p>
<p>由x + y = 12，得y = 12 - x</p>
<p>将y = 12 - x代入xy = 35，得：</p>
<p>x(12 - x) = 35</p>
<p>12x - x² = 35</p>
<p>x² - 12x + 35 = 0</p>
<p>使用公式法：a = 1, b = -12, c = 35</p>
<p>Δ = b² - 4ac = (-12)² - 4×1×35 = 144 - 140 = 4</p>
<p>x = (-b ± √Δ) / (2a) = (12 ± 2) / 2</p>
<p>x₁ = 7，对应的y = 12 - 7 = 5</p>
<p>x₂ = 5，对应的y = 12 - 5 = 7</p>
<p>所以长方形的长和宽是7米和5米，或者5米和7米。</p>`,
        order: 3,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '面积问题图解',
        content: `<h1>面积问题图解</h1>
<p>这张图片展示了长方形面积与周长问题的图形表示。</p>`,
        order: 4,
        type: 'image',
        mediaUrl: 'https://math-examples.com/rectangle-area-problem.jpg',
        metadata: { width: 1024, height: 768, format: 'jpg' }
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '一元二次方程的应用 - 行程问题',
        content: `<h1>一元二次方程的应用 - 行程问题</h1>
<p>例题：某人骑自行车从家到学校，速度为15千米/小时，用时40分钟。回家时，因为逆风，速度降低了3千米/小时，回家的用时比去学校多用了10分钟。求家到学校的距离。</p>
<p>解：</p>
<p>设家到学校的距离为s千米。</p>
<p>去学校的速度v₁ = 15千米/小时，用时t₁ = 40分钟 = 2/3小时</p>
<p>回家的速度v₂ = 15 - 3 = 12千米/小时，用时t₂ = 40 + 10 = 50分钟 = 5/6小时</p>
<p>根据距离 = 速度 × 时间，有：</p>
<p>s = v₁t₁ = 15 × (2/3) = 10千米</p>
<p>也可以验证：s = v₂t₂ = 12 × (5/6) = 10千米</p>
<p>答案：家到学校的距离是10千米。</p>`,
        order: 5,
        type: 'text',
        mediaUrl: null
      },
      {
        unitId: 'math-1-1',
        subjectId: mathSubjectId,
        title: '行程问题动画演示',
        content: `<h1>行程问题动画演示</h1>
<p>通过动画演示理解行程问题的解法。</p>`,
        order: 6,
        type: 'video',
        mediaUrl: 'https://d23dyxeqlo5psv.cloudfront.net/motion_problems.mp4',
        metadata: { duration: '6:42', resolution: '1080p' }
      }
    ];

    // 批量创建学习内容
    await LearningContent.bulkCreate(learningContents);

    console.log(`成功初始化 ${learningContents.length} 条学习内容记录`);
  } catch (error) {
    console.error('初始化学习内容出错:', error);
    throw error;
  }
};

module.exports = initLearningContent; 