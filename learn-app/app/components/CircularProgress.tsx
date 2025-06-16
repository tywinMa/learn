import React from "react";
import { View, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressProps {
  // 学习进度（0-1之间）
  studyProgress: number;
  // 掌握程度（0-1之间）
  masteryLevel: number;
  // 主色调
  color?: string;
  // 尺寸
  size?: number;
  // 中心图标名称
  iconName?: string;
  // 中心图标颜色
  iconColor?: string;
  // 是否显示皇冠（当两个都达到100%时）
  showCrown?: boolean;
}

/**
 * 环形进度条组件，显示学习进度和掌握程度，中心显示图标
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  studyProgress,
  masteryLevel,
  color = "#58CC02",
  size = 60,
  iconName = "play",
  iconColor = "#666",
  showCrown = true,
}) => {
  const strokeWidth = 4;
  const outerRadius = (size - strokeWidth) / 2;
  const innerRadius = outerRadius - strokeWidth - 2; // 内圆环比外圆环小一些
  const outerCircumference = outerRadius * 2 * Math.PI;
  const innerCircumference = innerRadius * 2 * Math.PI;

  // 计算进度条的偏移量
  const studyProgressOffset =
    outerCircumference - studyProgress * outerCircumference;
  const masteryProgressOffset =
    innerCircumference - masteryLevel * innerCircumference;

  // 判断是否显示皇冠
  const studyComplete = studyProgress >= 1.0;
  const masteryComplete = masteryLevel >= 1.0;
  const bothComplete = studyComplete && masteryComplete && showCrown;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* SVG环形进度条 */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        {/* 外层背景圆环 */}
        <Circle
          stroke="#E5E5E5"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          strokeWidth={strokeWidth}
        />

        {/* 内层背景圆环 */}
        <Circle
          stroke="#F0F0F0"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          strokeWidth={strokeWidth - 1}
        />

        {/* 学习进度圆环（外层） */}
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          strokeWidth={strokeWidth}
          strokeDasharray={outerCircumference}
          strokeDashoffset={studyProgressOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          opacity={0.9}
        />

        {/* 掌握程度圆环（内层） */}
        <Circle
          stroke="#FF6B35"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          strokeWidth={strokeWidth - 1}
          strokeDasharray={innerCircumference}
          strokeDashoffset={masteryProgressOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          opacity={0.9}
        />
      </Svg>

      {/* 中心内容 */}
      <View style={styles.centerContent}>
        {bothComplete ? (
          // 当两个都完成时显示大皇冠
          <FontAwesome5 name="crown" size={size * 0.4} color="#FFD700" solid />
        ) : (
          // 否则显示传入的图标
          <FontAwesome5
            name={iconName as any}
            size={size * 0.35}
            color={iconColor}
            solid={iconName === "star" || iconName === "crown"}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
});
