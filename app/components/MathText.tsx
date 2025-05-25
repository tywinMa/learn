import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ViewStyle, TextStyle, Platform, Text as RNText } from 'react-native';
import { Text } from './Themed';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
// @ts-ignore
import katex from 'katex';

// 平台特定配置
const isWeb = Platform.OS === 'web';
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// 动态导入WebView，以便在不支持的平台上不会报错
let WebView: any = null;
try {
  if (!isWeb || (typeof navigator !== 'undefined' && navigator.userAgent.includes('Chrome'))) {
    const webViewModule = require('react-native-webview');
    WebView = webViewModule.WebView;
  }
} catch (error) {
  console.warn('WebView不可用:', error);
}

// KaTeX CDN资源 (用于Web平台或本地资源加载失败时)
const KATEX_CDN = {
  css: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  js: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
  autoRender: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
};

/**
 * 预加载和缓存KaTeX资源
 */
const setupKatexResources = async () => {
  try {
    // 验证katex是否可用
    if (typeof katex !== 'undefined' && typeof katex.render === 'function') {
      console.log('KaTeX包已成功加载');
      return true;
    }
    
    // 预加载资源模块
    const resources = [
      require('@/assets/katex/katex.min.js'),
      require('@/assets/katex/auto-render.min.js'),
      require('@/assets/katex/fonts/KaTeX_AMS-Regular.woff2'),
      require('@/assets/katex/fonts/KaTeX_Main-Regular.woff2'),
      require('@/assets/katex/fonts/KaTeX_Math-Italic.woff2'),
      require('@/assets/katex/fonts/KaTeX_Size1-Regular.woff2')
    ];
    
    // 在原生平台上缓存资源到文件系统
    if (!isWeb && FileSystem) {
      const katexJsAsset = Asset.fromModule(resources[0]);
      const katexJsUri = katexJsAsset.localUri || katexJsAsset.uri;
      
      const autoRenderAsset = Asset.fromModule(resources[1]);
      const autoRenderUri = autoRenderAsset.localUri || autoRenderAsset.uri;
      
      // 确保目录存在
      const katexDir = `${FileSystem.cacheDirectory}katex/`;
      const katexFontsDir = `${katexDir}fonts/`;
      
      try {
        const dirInfo = await FileSystem.getInfoAsync(katexDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(katexDir, { intermediates: true });
          await FileSystem.makeDirectoryAsync(katexFontsDir, { intermediates: true });
        }
        
        // 缓存字体文件
        for (let i = 2; i < resources.length; i++) {
          const fontAsset = Asset.fromModule(resources[i]);
          const fontUri = fontAsset.localUri || fontAsset.uri;
          const fontName = fontUri.split('/').pop();
          if (fontUri && fontName) {
            const destUri = `${katexFontsDir}${fontName}`;
            const fontInfo = await FileSystem.getInfoAsync(destUri);
            if (!fontInfo.exists) {
              await FileSystem.copyAsync({
                from: fontUri,
                to: destUri
              });
            }
          }
        }
      } catch (err) {
        console.warn('文件系统缓存失败:', err);
      }
    }

    // 加载资源
    await Asset.loadAsync(resources);
    console.log('KaTeX资源预加载成功');
    return true;
  } catch (error) {
    console.warn('KaTeX资源预加载失败:', error);
    return false;
  }
};

// 尝试设置资源
const resourcesPromise = setupKatexResources();

interface MathTextProps {
  content: string;
  style?: any; // 使用any来兼容不同类型的样式
  containerStyle?: ViewStyle;
  mathFontSize?: number;
  color?: string;
  lightColor?: string;
  darkColor?: string;
}

// 正则表达式用于识别不同类型的LaTeX公式
const inlineMathPattern = /\$(.*?)\$/g; // 行内公式：$...$ 
const displayMathPattern = /\$\$(.*?)\$\$/g; // 行间公式：$$...$$

/**
 * 判断文本是否包含LaTeX公式
 */
export const containsMath = (text: string): boolean => {
  return inlineMathPattern.test(text) || displayMathPattern.test(text);
};

/**
 * 提取文本中的所有LaTeX公式
 */
export const extractMathExpressions = (text: string): string[] => {
  const expressions: string[] = [];
  
  // 提取行内公式
  text.replace(inlineMathPattern, (match, expression) => {
    expressions.push(expression);
    return match;
  });
  
  // 提取行间公式
  text.replace(displayMathPattern, (match, expression) => {
    expressions.push(expression);
    return match;
  });
  
  return expressions;
};

/**
 * 将LaTeX公式分割成纯文本和公式部分
 */
export const parseMathContent = (text: string): { type: 'text' | 'math', content: string, isDisplayMode: boolean }[] => {
  const segments: { type: 'text' | 'math', content: string, isDisplayMode: boolean }[] = [];
  
  // 将文本按照所有公式模式分割
  const combinedPattern = /(\$\$.*?\$\$|\$.*?\$)/gs;
  const parts = text.split(combinedPattern);
  
  parts.forEach(part => {
    if (part.trim() === '') return;
    
    if (part.startsWith('$$') && part.endsWith('$$')) {
      // 行间公式
      segments.push({
        type: 'math',
        content: part.slice(2, -2),
        isDisplayMode: true
      });
    } else if (part.startsWith('$') && part.endsWith('$')) {
      // 行内公式
      segments.push({
        type: 'math',
        content: part.slice(1, -1),
        isDisplayMode: false
      });
    } else {
      // 普通文本
      segments.push({
        type: 'text',
        content: part,
        isDisplayMode: false
      });
    }
  });
  
  return segments;
};

/**
 * 增强版数学公式渲染（用于WebView不可用时的备选方案）
 * 尝试将常见的LaTeX符号转换为Unicode字符
 */
const EnhancedMathDisplay = ({ content, style, isDisplayMode }: { content: string, style?: any, isDisplayMode: boolean }) => {
  // 转换简单的LaTeX符号为Unicode字符
  const formattedContent = content
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "$1/$2") // 简单分数
    .replace(/\\sqrt\{([^{}]+)\}/g, "√($1)") // 平方根
    .replace(/\\pm/g, "±") // 加减号
    .replace(/\\times/g, "×") // 乘号
    .replace(/\\cdot/g, "·") // 点乘
    .replace(/\\div/g, "÷") // 除号
    .replace(/\\alpha/g, "α") // 希腊字母
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\delta/g, "δ")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\omega/g, "ω")
    .replace(/\^2/g, "²") // 平方
    .replace(/\^3/g, "³") // 立方
    .replace(/\^([0-9])/g, "^$1") // 其他指数
    .replace(/\_([0-9])/g, "_$1"); // 下标
  
  return (
    <Text style={[
      style, 
      isDisplayMode ? { textAlign: 'center', width: '100%', marginVertical: 8 } : null,
      { fontStyle: 'italic' }
    ]}>
      {isDisplayMode ? `[${formattedContent}]` : formattedContent}
    </Text>
  );
};

/**
 * 创建HTML内容 - 适用于不同平台
 */
const createHtml = (
  formula: string, 
  isDisplayMode: boolean, 
  fontSize: number, 
  textColor: string,
  resourcesReady: boolean
): string => {
  // 资源路径处理
  let fontPathPrefix = '';
  
  // 为Web平台添加KaTeX CSS
  const katexCssLink = isWeb ? `<link rel="stylesheet" href="${KATEX_CDN.css}">` : '';
  
  // 字体加载部分 - 只在使用本地资源且不是Web平台时使用
  const fontFaces = !isWeb && fontPathPrefix ? `
    @font-face {
      font-family: 'KaTeX_AMS';
      src: url('${fontPathPrefix}KaTeX_AMS-Regular.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'KaTeX_Main';
      src: url('${fontPathPrefix}KaTeX_Main-Regular.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'KaTeX_Math';
      src: url('${fontPathPrefix}KaTeX_Math-Italic.woff2') format('woff2');
      font-weight: normal;
      font-style: italic;
    }
    @font-face {
      font-family: 'KaTeX_Size1';
      src: url('${fontPathPrefix}KaTeX_Size1-Regular.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
  ` : '';
  
  // 将katex渲染结果内联到HTML中，避免依赖问题
  let renderedFormula = '';
  try {
    if (typeof katex !== 'undefined' && typeof katex.renderToString === 'function') {
      renderedFormula = katex.renderToString(formula, {
        displayMode: isDisplayMode,
        throwOnError: false,
        output: 'html'
      });
    } else {
      renderedFormula = `<div>${formula}</div>`;
    }
  } catch (error) {
    console.warn('KaTeX渲染失败:', error);
    renderedFormula = `<div>${formula}</div>`;
  }
  
  // 创建HTML内容
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${katexCssLink}
        <style>
          ${fontFaces}
          
          body {
            margin: 0;
            padding: 0;
            font-size: ${fontSize}px;
            display: flex;
            align-items: center;
            justify-content: ${isDisplayMode ? 'center' : 'flex-start'};
            color: ${textColor};
            background-color: transparent;
            overflow: hidden;
          }
          
          .math-container {
            ${isDisplayMode ? 'width: 100%; text-align: center;' : ''}
            padding: 8px 0;
          }
          
          .katex {
            font-size: 1.1em;
            font-family: KaTeX_Main, KaTeX_Math, KaTeX_AMS, KaTeX_Size1, serif;
            line-height: 1.2;
          }
          
          /* 基本KaTeX样式 */
          .katex .mfrac .frac-line {
            border-bottom-width: 1px;
            border-bottom-style: solid;
          }
          
          .katex .mspace { display: inline-block; }
          
          .katex .mord, .katex .mbin, .katex .mrel, .katex .mopen, 
          .katex .mclose, .katex .mpunct, .katex .minner {
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="math-container" id="formula">${renderedFormula}</div>
        <script>
          document.addEventListener("DOMContentLoaded", function() {
            // 通知React Native调整大小
            setTimeout(function() {
              const height = document.body.scrollHeight;
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'resize',
                  height: height
                }));
              }
            }, 200);
          });
        </script>
      </body>
    </html>
  `;
};

/**
 * MathText组件：渲染包含LaTeX公式的文本
 */
export const MathText = ({
  content,
  style,
  containerStyle,
  mathFontSize = 16,
  color,
  lightColor,
  darkColor
}: MathTextProps) => {
  const [resourcesReady, setResourcesReady] = useState(false);
  
  // 加载资源
  useEffect(() => {
    resourcesPromise.then(ready => {
      setResourcesReady(ready);
    });
  }, []);
  
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const actualColor = color || textColor;
  
  // 如果文本不包含公式，直接使用普通Text组件渲染
  if (!containsMath(content)) {
    return <Text style={style}>{content}</Text>;
  }
  
  // 解析文本内容，分离出纯文本和公式部分
  const segments = parseMathContent(content);
  
  // 检查WebView是否可用
  const isWebViewAvailable = WebView != null;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          // 渲染普通文本
          return <Text key={index} style={[style, { color: actualColor }]}>{segment.content}</Text>;
        } else if (!isWebViewAvailable) {
          // 如果WebView不可用，使用备选方案
          return (
            <EnhancedMathDisplay 
              key={index}
              content={segment.content}
              style={[style, { color: actualColor }]}
              isDisplayMode={segment.isDisplayMode}
            />
          );
        } else {
          // 使用WebView渲染数学公式
          const html = createHtml(
            segment.content,
            segment.isDisplayMode,
            mathFontSize,
            actualColor,
            resourcesReady
          );

          // WebView配置 - 为不同平台提供优化
          const webViewProps: any = {
            source: { html },
            style: segment.isDisplayMode ? styles.displayMath : styles.inlineMath,
            scrollEnabled: false,
            bounces: false,
            showsHorizontalScrollIndicator: false,
            showsVerticalScrollIndicator: false,
            originWhitelist: ['*'],
            javaScriptEnabled: true,
            domStorageEnabled: true,
            automaticallyAdjustContentInsets: true,
            onMessage: (event: { nativeEvent: { data: string } }) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'resize') {
                  // 可以添加动态调整WebView高度的逻辑
                }
              } catch (e) {
                console.warn('解析WebView消息失败', e);
              }
            }
          };
          
          // iOS特定配置
          if (isIOS) {
            webViewProps.scalesPageToFit = false;
            webViewProps.useWebKit = true;
          }
          
          // Android特定配置
          if (isAndroid) {
            webViewProps.androidLayerType = 'software';
          }
          
          // Web特定配置
          if (isWeb) {
            webViewProps.cacheEnabled = true;
          }

          return (
            <View key={index} style={segment.isDisplayMode ? styles.displayMathContainer : styles.inlineMathContainer}>
              <WebView {...webViewProps} />
            </View>
          );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  inlineMathContainer: {
    minHeight: 40,
    marginHorizontal: 2,
    ...Platform.select({
      ios: {
        height: 40, // iOS上固定高度表现更好
      },
      android: {
        minHeight: 40,
        height: 'auto',
      },
      web: {
        height: 40,
      }
    }),
  },
  displayMathContainer: {
    width: '100%',
    minHeight: 70,
    marginVertical: 10,
    ...Platform.select({
      ios: {
        minHeight: 70,
      },
      android: {
        minHeight: 70,
        height: 'auto',
      },
      web: {
        minHeight: 70,
      }
    }),
  },
  inlineMath: {
    flex: 1,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        height: 40,
      },
      android: {
        minHeight: 40,
      },
      web: {
        height: 40,
      }
    }),
  },
  displayMath: {
    flex: 1,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        minHeight: 70,
      },
      android: {
        minHeight: 70,
      },
      web: {
        minHeight: 70,
      }
    }),
  },
});

export default MathText; 