# 前端目录结构说明

本项目使用 React Native 和 Expo 构建，所有前端代码都组织在 `app` 目录下。

## 目录结构

```
app/
├── (tabs)/ - Tab导航相关页面
├── assets/ - 静态资源
│   ├── fonts/ - 字体文件
│   └── images/ - 图片资源
├── components/ - 可复用组件
│   └── ui/ - UI基础组件
├── constants/ - 常量定义
├── contexts/ - React上下文
├── hooks/ - 自定义React钩子
├── services/ - 业务服务
├── utils/ - 工具函数
└── 其他页面文件(.tsx)
```

## 最佳实践

1. **组件命名**：使用 PascalCase 命名组件
2. **文件命名**：使用 kebab-case 命名非组件文件
3. **导入路径**：使用`@/`作为根目录的别名，例如`import { Button } from '@/components/Button'`
4. **组件分类**：
   - `components/ui/`：放置基础 UI 组件，如按钮、输入框等
   - `components/`：放置业务组件
5. **页面组件**：直接放在 app 目录或子目录中

## 导入规范

推荐使用以下导入顺序：

1. React/React Native 相关导入
2. 第三方库导入
3. 项目内组件导入
4. 样式、常量、工具函数导入

例如：

```tsx
import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";

import { useNavigation } from "@react-navigation/native";

import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/Colors";
```

## 样式指南

建议使用内联样式或 StyleSheet 进行样式定义，保持组件文件内的样式独立。

```tsx
import { StyleSheet } from "react-native";

// 组件定义...

const styles = StyleSheet.create({
  container: {
    // 样式定义
  },
});
```
