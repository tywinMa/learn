const { Unit, Subject } = require('../models');

/**
 * 初始化单元内容
 */
const initUnitContent = async () => {
  try {
    console.log('开始初始化单元内容...');

    // 获取数学学科
    const mathSubject = await Subject.findOne({ where: { code: 'math' } });
    if (!mathSubject) {
      throw new Error('找不到数学学科，请先初始化学科数据');
    }
    const mathSubjectCode = mathSubject.code;

    // 查找一元二次方程单元
    const unit = await Unit.findOne({ where: { id: `${mathSubjectCode}-1-1` } });
    if (!unit) {
      console.log(`未找到 ${mathSubjectCode}-1-1 单元，跳过内容初始化`);
      return;
    }

    // 检查单元是否已有内容
    if (unit.content) {
      console.log(`单元 ${mathSubjectCode}-1-1 已有内容，跳过初始化`);
      return;
    }

    // 准备内容
    const content = `<h1>一元二次方程的基本概念</h1>
<p>一元二次方程是指含有一个未知数，并且未知数的最高次数是2的方程。其一般形式为：</p>
<p class="formula">ax² + bx + c = 0 (a ≠ 0)</p>
<p>其中a、b、c是已知数，x是未知数，a ≠ 0。</p>
<p>例如：</p>
<ul>
  <li>x² - 5x + 6 = 0</li>
  <li>2x² + 3x - 1 = 0</li>
  <li>3x² - 7 = 0</li>
</ul>

<h1>一元二次方程的解法 - 因式分解法</h1>
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
<p>答案：x = 2或x = 3</p>

<h1>一元二次方程的解法 - 公式法</h1>
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
<p>答案：x = 2或x = 0.5</p>`;

    // 准备媒体内容
    const media = [
      {
        type: 'video',
        title: '一元二次方程简介视频',
        url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        metadata: { duration: '9:56', resolution: '720p' }
      },
      {
        type: 'image',
        title: '因式分解法图解',
        url: 'https://examples.com/factorization-method.jpg',
        metadata: { width: 800, height: 600, format: 'jpg' }
      },
      {
        type: 'video',
        title: '公式法视频讲解',
        url: 'https://d23dyxeqlo5psv.cloudfront.net/equation_solving.mp4',
        metadata: { duration: '7:23', resolution: '1080p' }
      }
    ];

    // 更新单元内容
    await unit.update({
      content,
      media
    });

    console.log(`成功初始化单元 ${mathSubjectCode}-1-1 的内容`);
  } catch (error) {
    console.error('初始化单元内容出错:', error);
    throw error;
  }
};

module.exports = initUnitContent; 