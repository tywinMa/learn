import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";
import { Text } from "../../components/Themed";

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
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors[colorScheme].tint,
        },
        headerTitleStyle: {
          color: "#fff",
          fontWeight: "bold",
        },
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
          title: "课程",
          headerTitle: "课程",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <Ionicons name="book" size={24} color={color} />
              <Text style={{ color, fontSize: 12, marginTop: 2 }}>课程</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "故事",
          headerTitle: "故事",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <Ionicons name="book-outline" size={24} color={color} />
              <Text style={{ color, fontSize: 12, marginTop: 2 }}>故事</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "练习",
          headerTitle: "练习",
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
        name="profile"
        options={{
          title: "排行榜",
          headerTitle: "排行榜",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <Ionicons name="trophy" size={24} color={color} />
              <Text style={{ color, fontSize: 12, marginTop: 2 }}>排行榜</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "个人",
          headerTitle: "个人资料",
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <View style={styles.tabItem}>
              <Ionicons name="person" size={24} color={color} />
              <Text style={{ color, fontSize: 12, marginTop: 2 }}>个人</Text>
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
