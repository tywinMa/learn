import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  type = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  // 根据类型选择按钮样式
  const getTypeStyles = () => {
    switch (type) {
      case "primary":
        return {
          backgroundColor: disabled ? "#a0a0a0" : Colors[colorScheme].tint,
          borderColor: "transparent",
          color: "#fff",
        };
      case "secondary":
        return {
          backgroundColor: isDark ? "#333" : "#eee",
          borderColor: "transparent",
          color: isDark ? "#fff" : "#333",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: Colors[colorScheme].tint,
          color: Colors[colorScheme].tint,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          color: Colors[colorScheme].tint,
        };
      default:
        return {
          backgroundColor: Colors[colorScheme].tint,
          borderColor: "transparent",
          color: "#fff",
        };
    }
  };

  // 根据尺寸选择按钮样式
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 14,
        };
      case "medium":
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          fontSize: 16,
        };
      case "large":
        return {
          paddingVertical: 14,
          paddingHorizontal: 20,
          fontSize: 18,
        };
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          fontSize: 16,
        };
    }
  };

  const { backgroundColor, borderColor, color } = getTypeStyles();
  const { paddingVertical, paddingHorizontal, fontSize } = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          paddingVertical,
          paddingHorizontal,
          opacity: disabled ? 0.6 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon && icon}
          <Text style={[styles.text, { color, fontSize, marginLeft: icon ? 8 : 0 }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});
