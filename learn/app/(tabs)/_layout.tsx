import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "react-native";
import { Text } from "@/components/Themed";

// 定义标签图标属性的类型
type TabBarIconProps = {
  color: string;
  focused: boolean;
  size?: number;
};

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <Ionicons name="book" size={24} color={color} />
              <Text style={{ color, fontSize: 12, marginTop: 2 }}>课程</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <Ionicons name="person" size={24} color={color} />
              <Text style={{ color, fontSize: 12, marginTop: 2 }}>个人</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={[styles.tabItem, styles.centerTab]}>
              <View
                style={[styles.centerTabCircle, { backgroundColor: focused ? Colors[colorScheme].tint : "#dddddd" }]}
              >
                <Ionicons name="barbell" size={24} color={focused ? "white" : "#888"} />
              </View>
              <Text style={{ color, fontSize: 12, marginTop: 2 }}>练习</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wrong-exercises"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <Ionicons name="book-outline" size={24} color={color} />
              <Text style={{ color, fontSize: 10, marginTop: 2 }}>错题本</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <FontAwesome5 name="store" size={20} color={color} />
              <Text style={{ color, fontSize: 10, marginTop: 2 }}>积分商城</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerTab: {
    justifyContent: "flex-start",
  },
  centerTabCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
