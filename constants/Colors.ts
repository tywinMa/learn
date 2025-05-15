/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// 多邻国色彩方案
const duoGreen = "#58CC02"; // 多邻国主要绿色
const duoBlue = "#1CB0F6"; // 多邻国蓝色
const duoOrange = "#FF9600"; // 多邻国橙色
const duoRed = "#FF4B4B"; // 多邻国红色

export const WELCOME_SCREEN_KEY = "hasSeenWelcomeScreen_v1";

export default {
  light: {
    text: "#4b4b4b", // 深灰色文字
    background: "#fff", // 白色背景
    tint: duoGreen, // 主色调为绿色
    tabIconDefault: "#bdbdbd", // 未选中的标签图标颜色
    tabIconSelected: duoGreen, // 选中的标签图标颜色
    border: "#e5e5e5", // 边框颜色
    cardBackground: "#f7f7f7", // 卡片背景色
    shadow: "rgba(0, 0, 0, 0.1)", // 阴影颜色
    accent: duoBlue, // 强调色（蓝色）
    success: duoGreen, // 成功色（绿色）
    warning: duoOrange, // 警告色（橙色）
    error: duoRed, // 错误色（红色）
    gold: "#FFD900", // 金币/奖励颜色
  },
  dark: {
    text: "#f9f9f9", // 浅色文字
    background: "#191919", // 深色背景
    tint: duoGreen, // 主色调依然为绿色
    tabIconDefault: "#6e6e6e", // 未选中的标签图标颜色
    tabIconSelected: duoGreen, // 选中的标签图标颜色
    border: "#3d3d3d", // 边框颜色
    cardBackground: "#2a2a2a", // 卡片背景色
    shadow: "rgba(255, 255, 255, 0.1)", // 阴影颜色
    accent: duoBlue, // 强调色（蓝色）
    success: duoGreen, // 成功色（绿色）
    warning: duoOrange, // 警告色（橙色）
    error: duoRed, // 错误色（红色）
    gold: "#FFD900", // 金币/奖励颜色
  },
};
