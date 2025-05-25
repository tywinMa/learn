import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from './Themed';
import MathText from './MathText';
import EnhancedThemedText from './EnhancedThemedText';

/**
 * 数学公式示例组件，展示各种LaTeX公式的渲染效果
 */
export const MathExamples = () => {
  // 示例数学公式
  const examples = [
    {
      title: '基础代数公式',
      formulas: [
        { description: '二次方程求根公式', formula: '对于方程 $ax^2 + bx + c = 0$，其解为 $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$' },
        { description: '平方差公式', formula: '$(a+b)(a-b) = a^2 - b^2$' },
        { description: '完全平方公式', formula: '$(a \\pm b)^2 = a^2 \\pm 2ab + b^2$' },
      ]
    },
    {
      title: '三角函数',
      formulas: [
        { description: '三角恒等式', formula: '$\\sin^2 \\theta + \\cos^2 \\theta = 1$' },
        { description: '正弦和余弦的加法公式', formula: '$\\sin(\\alpha \\pm \\beta) = \\sin \\alpha \\cos \\beta \\pm \\cos \\alpha \\sin \\beta$' },
        { description: '余弦定理', formula: '$c^2 = a^2 + b^2 - 2ab\\cos(C)$' },
      ]
    },
    {
      title: '微积分',
      formulas: [
        { description: '导数定义', formula: '$f\'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$' },
        { description: '定积分', formula: '$\\int_{a}^{b} f(x) dx = F(b) - F(a)$' },
        { description: '泰勒级数', formula: '$f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n$' },
      ]
    },
    {
      title: '统计学',
      formulas: [
        { description: '正态分布概率密度函数', formula: '$f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}(\\frac{x-\\mu}{\\sigma})^2}$' },
        { description: '样本方差', formula: '$s^2 = \\frac{1}{n-1} \\sum_{i=1}^{n} (x_i - \\bar{x})^2$' },
        { description: '二项分布概率质量函数', formula: '$P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$' },
      ]
    },
    {
      title: '线性代数',
      formulas: [
        { description: '行列式', formula: '$\\det(A) = \\sum_{\\sigma \\in S_n} \\text{sgn}(\\sigma) \\prod_{i=1}^{n} a_{i,\\sigma(i)}$' },
        { description: '矩阵乘法', formula: '$(AB)_{ij} = \\sum_{k=1}^{n} a_{ik} b_{kj}$' },
        { description: '特征值方程', formula: '$\\det(A - \\lambda I) = 0$' },
      ]
    },
    {
      title: '几何学',
      formulas: [
        { description: '圆的面积', formula: '$A = \\pi r^2$' },
        { description: '球的体积', formula: '$V = \\frac{4}{3} \\pi r^3$' },
        { description: '三角形面积（海伦公式）', formula: '$A = \\sqrt{s(s-a)(s-b)(s-c)}$，其中 $s = \\frac{a+b+c}{2}$' },
      ]
    },
    {
      title: '复杂公式示例',
      formulas: [
        { 
          description: '麦克斯韦方程组', 
          formula: '$$\\\\nabla \\\\cdot \\\\vec{E} = \\\\frac{\\\\rho}{\\\\varepsilon_0}, \\\\nabla \\\\cdot \\\\vec{B} = 0, \\\\nabla \\\\times \\\\vec{E} = -\\\\frac{\\\\partial \\\\vec{B}}{\\\\partial t}, \\\\nabla \\\\times \\\\vec{B} = \\\\mu_0 \\\\vec{J} + \\\\mu_0 \\\\varepsilon_0 \\\\frac{\\\\partial \\\\vec{E}}{\\\\partial t}$$'
        },
        { 
          description: '拉格朗日方程', 
          formula: '$$\\\\frac{d}{dt}\\\\left(\\\\frac{\\\\partial L}{\\\\partial \\\\dot{q}_j}\\\\right) - \\\\frac{\\\\partial L}{\\\\partial q_j} = 0$$'
        },
        { 
          description: '薛定谔方程', 
          formula: '$$i\\\\hbar \\\\frac{\\\\partial}{\\\\partial t}\\\\Psi(\\\\mathbf{r},t) = \\\\hat{H}\\\\Psi(\\\\mathbf{r},t)$$'
        },
      ]
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>数学公式渲染测试</Text>
      <Text style={styles.subheader}>本页面展示了各种数学公式的渲染效果</Text>

      {examples.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.formulas.map((item, index) => (
            <View key={index} style={styles.formulaContainer}>
              <Text style={styles.formulaDescription}>{item.description}:</Text>
              <EnhancedThemedText style={styles.formula}>{item.formula}</EnhancedThemedText>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>习题示例</Text>
        <View style={styles.exerciseExample}>
          <Text style={styles.exerciseTitle}>习题1：一元二次方程及函数图像</Text>
          <EnhancedThemedText style={styles.exerciseQuestion}>
            求解方程 $3x^2 - 5x + 2 = 0$ 的根，并描述函数 $f(x) = 3x^2 - 5x + 2$ 的图像特征。
          </EnhancedThemedText>
          <View style={styles.optionsContainer}>
            <View style={[styles.option, styles.correctOption]}>
              <Text style={styles.optionLabel}>A.</Text>
              <EnhancedThemedText style={styles.optionText}>$x = 1$ 或 $x = \\frac{2}{3}$，抛物线开口向上，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$</EnhancedThemedText>
            </View>
            <View style={styles.option}>
              <Text style={styles.optionLabel}>B.</Text>
              <EnhancedThemedText style={styles.optionText}>$x = \\frac{1}{3}$ 或 $x = 2$，抛物线开口向上，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$</EnhancedThemedText>
            </View>
            <View style={styles.option}>
              <Text style={styles.optionLabel}>C.</Text>
              <EnhancedThemedText style={styles.optionText}>$x = 1$ 或 $x = \\frac{2}{3}$，抛物线开口向下，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{1}{12})$</EnhancedThemedText>
            </View>
            <View style={styles.option}>
              <Text style={styles.optionLabel}>D.</Text>
              <EnhancedThemedText style={styles.optionText}>$x = \\frac{1}{3}$ 或 $x = 2$，抛物线开口向下，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{1}{12})$</EnhancedThemedText>
            </View>
          </View>
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>解析：</Text>
            
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>1. 求解方程的根</Text>
              <EnhancedThemedText style={styles.explanationText}>
                {'使用求根公式：$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$，其中 $a=3$, $b=-5$, $c=2$'}
              </EnhancedThemedText>
            </View>
            
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>2. 计算判别式</Text>
              <EnhancedThemedText style={styles.explanationText}>
                {'$\\Delta = b^2 - 4ac = (-5)^2 - 4 \\times 3 \\times 2 = 25 - 24 = 1$'}
              </EnhancedThemedText>
            </View>
            
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>3. 代入求根公式</Text>
              <EnhancedThemedText style={styles.explanationText}>
                {'$x = \\frac{5 \\pm \\sqrt{1}}{6} = \\frac{5 \\pm 1}{6}$，所以 $x_1 = \\frac{6}{6} = 1$，$x_2 = \\frac{4}{6} = \\frac{2}{3}$'}
              </EnhancedThemedText>
            </View>
            
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>4. 分析函数图像</Text>
              <EnhancedThemedText style={styles.explanationText}>
                {'(1) 由于 $a = 3 > 0$，抛物线开口向上\n(2) 对称轴 $x = \\frac{-b}{2a} = \\frac{5}{6}$\n(3) 顶点坐标 $(\\frac{-b}{2a}, f(\\frac{-b}{2a}))$\n(4) 计算顶点的 $y$ 坐标：\n$f(\\frac{5}{6}) = 3(\\frac{5}{6})^2 - 5(\\frac{5}{6}) + 2$\n$= 3 \\times \\frac{25}{36} - 5 \\times \\frac{5}{6} + 2$\n$= \\frac{25}{12} - \\frac{25}{6} + 2$\n$= \\frac{25}{12} - \\frac{50}{12} + \\frac{24}{12}$\n$= \\frac{-1}{12}$\n(5) 顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$'}
              </EnhancedThemedText>
            </View>
            
            <View style={styles.conclusionContainer}>
              <EnhancedThemedText style={styles.conclusionText}>
                {'所以正确答案是 A：$x = 1$ 或 $x = \\frac{2}{3}$，抛物线开口向上，对称轴 $x = \\frac{5}{6}$，顶点坐标为 $(\\frac{5}{6}, \\frac{-1}{12})$'}
              </EnhancedThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.exerciseExample}>
          <Text style={styles.exerciseTitle}>习题2：概率与统计</Text>
          <EnhancedThemedText style={styles.exerciseQuestion}>
            从一个装有5个红球和3个白球的袋子中随机抽取2个球，求抽到的两个球都是红球的概率。
          </EnhancedThemedText>
          
          <View style={styles.optionsContainer}>
            <View style={styles.option}>
              <Text style={styles.optionLabel}>A.</Text>
              <EnhancedThemedText style={styles.optionText}>{'$\\frac{5}{8} \\times \\frac{4}{7} = \\frac{20}{56} = \\frac{5}{14}$'}</EnhancedThemedText>
            </View>
            <View style={styles.option}>
              <Text style={styles.optionLabel}>B.</Text>
              <EnhancedThemedText style={styles.optionText}>{'$\\frac{5}{8} \\times \\frac{5}{7} = \\frac{25}{56}$'}</EnhancedThemedText>
            </View>
            <View style={[styles.option, styles.correctOption]}>
              <Text style={styles.optionLabel}>C.</Text>
              <EnhancedThemedText style={styles.optionText}>{'$\\frac{C_5^2}{C_8^2} = \\frac{10}{28} = \\frac{5}{14}$'}</EnhancedThemedText>
            </View>
            <View style={styles.option}>
              <Text style={styles.optionLabel}>D.</Text>
              <EnhancedThemedText style={styles.optionText}>{'$\\frac{5 \\cdot 4}{8 \\cdot 7} = \\frac{20}{56} = \\frac{5}{14}$'}</EnhancedThemedText>
            </View>
          </View>
          
          <View style={styles.explanation}>
            <Text style={styles.explanationTitle}>解析：</Text>
            
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>1. 分析问题</Text>
              <EnhancedThemedText style={styles.explanationText}>
                {'这是一个组合概率问题，我们需要计算从8个球中抽2个球，恰好这2个球都是红球的概率。'}
              </EnhancedThemedText>
            </View>
            
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>2. 计算概率</Text>
              <EnhancedThemedText style={styles.explanationText}>
                {'(1) 总共有 $C_8^2 = \\frac{8 \\times 7}{2 \\times 1} = 28$ 种不同的抽取方式\n(2) 抽到2个红球的方式有 $C_5^2 = \\frac{5 \\times 4}{2 \\times 1} = 10$ 种\n(3) 所以抽到2个红球的概率是 $\\frac{C_5^2}{C_8^2} = \\frac{10}{28} = \\frac{5}{14}$'}
              </EnhancedThemedText>
            </View>
            
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>3. 验证其他选项</Text>
              <EnhancedThemedText style={styles.explanationText}>
                {'选项A和D也得到 $\\frac{5}{14}$，但计算方法不同。选项A是先抽一个红球，再抽一个红球的概率。选项B的计算有误。'}
              </EnhancedThemedText>
            </View>
            
            <View style={styles.conclusionContainer}>
              <EnhancedThemedText style={styles.conclusionText}>
                {'所以正确答案是 C：$\\frac{C_5^2}{C_8^2} = \\frac{10}{28} = \\frac{5}{14}$'}
              </EnhancedThemedText>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  correctOption: {
    borderColor: '#58CC02',
    backgroundColor: 'rgba(88, 204, 2, 0.05)',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  formulaContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formulaDescription: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  formula: {
    fontSize: 16,
    paddingVertical: 8,
    lineHeight: 24,
    textAlign: 'center',
    marginVertical: 8,
  },
  exerciseExample: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  exerciseQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionLabel: {
    width: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  optionText: {
    flex: 1,
  },
  explanation: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#58CC02',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  explanationStep: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 4,
  },
  conclusionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(88, 204, 2, 0.3)',
  },
  conclusionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
    color: '#333',
  }
});

export default MathExamples; 