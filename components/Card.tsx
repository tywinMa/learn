import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { View, Text } from "./Themed";
import Colors from "../constants/Colors";
import { useColorScheme } from "react-native";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  footer?: React.ReactNode;
  elevation?: number;
  borderRadius?: number;
  padding?: number;
}

export default function Card({
  title,
  children,
  style,
  onPress,
  footer,
  elevation = 2,
  borderRadius = 8,
  padding = 16,
}: CardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const Container = onPress ? TouchableOpacity : View;

  const cardStyle = {
    ...styles.card,
    borderRadius,
    padding,
    backgroundColor: Colors[colorScheme].cardBackground,
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: elevation,
    elevation,
  };

  return (
    <Container style={[cardStyle, style]} {...(onPress && { onPress, activeOpacity: 0.7 })}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  content: {
    backgroundColor: "transparent",
  },
  footer: {
    backgroundColor: "transparent",
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
});
