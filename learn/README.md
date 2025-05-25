# 跨平台移动应用脚手架

这是一个基于 React Native 和 Expo 的跨平台移动应用脚手架，支持 iOS 和 Android 平台的应用开发和发布。

## 特性

- ✅ 使用 React Native 和 Expo 实现跨平台开发
- ✅ 支持 iOS 和 Android 平台
- ✅ 内置响应式主题（明/暗模式）
- ✅ 完整的页面导航系统
- ✅ 可定制的 UI 组件库
- ✅ TypeScript 类型支持
- ✅ 浏览器开发和调试支持

## 快速开始

### 准备工作

确保你的开发环境已安装：

- Node.js (推荐 14.0.0 或更高版本)
- npm 或 yarn
- iOS 开发需要 macOS 系统和 Xcode
- Android 开发需要 Android Studio

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 运行项目

```bash
# 启动开发服务器
npm start
# 或
yarn start

# 运行 iOS 模拟器
npm run ios
# 或
yarn ios

# 运行 Android 模拟器
npm run android
# 或
yarn android

# 在网页浏览器中运行（用于调试）
npm run web
# 或
yarn web
```

## 项目结构

```
mobile-app-scaffold/
├── app/                      # 应用程序入口和页面
│   ├── (tabs)/               # 标签页面
│   │   ├── index.tsx         # 首页
│   │   ├── profile.tsx       # 个人资料页
│   │   ├── settings.tsx      # 设置页
│   │   └── _layout.tsx       # 标签布局
│   └── _layout.tsx           # 应用布局
├── assets/                   # 静态资源
├── components/               # 可复用组件
│   ├── Button.tsx            # 按钮组件
│   ├── Card.tsx              # 卡片组件
│   └── Themed.tsx            # 主题组件
├── constants/                # 常量定义
│   └── Colors.ts             # 颜色常量
├── node_modules/             # 依赖包
├── .gitignore                # Git 忽略文件
├── app.json                  # Expo 配置
├── package.json              # 项目配置
└── tsconfig.json             # TypeScript 配置
```

## 自定义和扩展

### 添加新页面

1. 在 `app/(tabs)` 目录中创建新的 `.tsx` 文件
2. 在 `app/(tabs)/_layout.tsx` 中添加新的标签配置

### 自定义主题

编辑 `constants/Colors.ts` 文件来修改应用的颜色主题。

### 添加新组件

在 `components` 目录中创建新的组件文件。

## 发布应用

### 构建生产版本

```bash
# 为 iOS 构建
expo build:ios

# 为 Android 构建
expo build:android
```

### 提交到应用商店

按照 Expo 官方文档指南将应用提交到 App Store 和 Google Play：
https://docs.expo.dev/distribution/app-stores/

## 许可证

MIT
