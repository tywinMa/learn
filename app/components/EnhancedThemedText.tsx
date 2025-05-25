import React from 'react';
import { TextProps } from 'react-native';
import { ThemedText, ThemedTextProps } from './ThemedText';
import MathText, { containsMath } from './MathText';

interface EnhancedThemedTextProps extends ThemedTextProps {
  /**
   * 是否自动检测并渲染数学公式
   * 默认为true
   */
  detectMath?: boolean;
  
  /**
   * 数学公式文本大小
   * 默认与文本大小相同
   */
  mathFontSize?: number;
}

/**
 * 增强版ThemedText组件
 * 自动检测文本中的LaTeX公式并使用MathText进行渲染
 */
export function EnhancedThemedText({
  children,
  style,
  lightColor,
  darkColor,
  type = 'default',
  detectMath = true,
  mathFontSize,
  ...rest
}: EnhancedThemedTextProps) {
  // 如果禁用了数学公式检测，或者内容不是字符串，直接使用ThemedText
  if (!detectMath || typeof children !== 'string') {
    return (
      <ThemedText
        style={style}
        lightColor={lightColor}
        darkColor={darkColor}
        type={type}
        {...rest}
      >
        {children}
      </ThemedText>
    );
  }

  // 检查文本是否包含数学公式
  if (containsMath(children)) {
    // 计算数学公式字体大小
    let fontSize = mathFontSize;
    if (!fontSize) {
      // 根据类型确定默认字体大小
      switch (type) {
        case 'title':
          fontSize = 32;
          break;
        case 'subtitle':
          fontSize = 20;
          break;
        default:
          fontSize = 16;
      }
    }

    // 使用MathText渲染包含数学公式的文本
    return (
      <MathText
        content={children}
        style={style || undefined}
        lightColor={lightColor}
        darkColor={darkColor}
        mathFontSize={fontSize}
      />
    );
  }

  // 不包含数学公式，使用普通ThemedText
  return (
    <ThemedText
      style={style}
      lightColor={lightColor}
      darkColor={darkColor}
      type={type}
      {...rest}
    >
      {children}
    </ThemedText>
  );
}

export default EnhancedThemedText; 