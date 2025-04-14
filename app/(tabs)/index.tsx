import React, { useState } from "react";
import { StyleSheet, ScrollView, Image, TouchableOpacity, View as RNView } from "react-native";
import { Text, View } from "../../components/Themed";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";

// 课程数据
const COURSES = [
  {
    id: "unit1",
    title: "基础 1",
    icon: "https://i.imgur.com/QgQQXTI.png",
    levels: [
      { id: "1-1", completed: true, stars: 3, type: "normal" },
      { id: "1-2", completed: true, stars: 2, type: "normal" },
      { id: "1-3", completed: true, stars: 3, type: "normal" },
      { id: "1-4", completed: false, stars: 0, type: "normal", current: true },
      { id: "1-5", completed: false, stars: 0, type: "normal", locked: true },
      { id: "1-6", completed: false, stars: 0, type: "challenge", locked: true },
      { id: "1-7", completed: false, stars: 0, type: "normal", locked: true },
      { id: "1-8", completed: false, stars: 0, type: "normal", locked: true },
    ],
  },
  {
    id: "unit2",
    title: "基础 2",
    icon: "https://i.imgur.com/vAMCb0f.png",
    levels: [
      { id: "2-1", completed: false, stars: 0, type: "normal", locked: true },
      { id: "2-2", completed: false, stars: 0, type: "normal", locked: true },
      { id: "2-3", completed: false, stars: 0, type: "normal", locked: true },
      { id: "2-4", completed: false, stars: 0, type: "normal", locked: true },
      { id: "2-5", completed: false, stars: 0, type: "challenge", locked: true },
      { id: "2-6", completed: false, stars: 0, type: "normal", locked: true },
    ],
  },
  {
    id: "unit3",
    title: "旅行",
    icon: "https://i.imgur.com/yjcbqsP.png",
    levels: [
      { id: "3-1", completed: false, stars: 0, type: "normal", locked: true },
      { id: "3-2", completed: false, stars: 0, type: "normal", locked: true },
      { id: "3-3", completed: false, stars: 0, type: "normal", locked: true },
      { id: "3-4", completed: false, stars: 0, type: "challenge", locked: true },
      { id: "3-5", completed: false, stars: 0, type: "normal", locked: true },
    ],
  },
];

// 定义等级徽章
const LevelBadge = ({ level, colorScheme }: { level: any; colorScheme: string }) => {
  // 根据类型和状态选择颜色和样式
  const getBadgeStyle = () => {
    if (level.locked) {
      return {
        backgroundColor: "#e0e0e0",
        borderColor: "#c0c0c0",
      };
    }

    if (level.type === "challenge") {
      return {
        backgroundColor: level.completed ? Colors[colorScheme].gold : Colors[colorScheme].warning,
        borderColor: level.completed ? "#daa520" : "#e78c00",
      };
    }

    if (level.completed) {
      return {
        backgroundColor: Colors[colorScheme].success,
        borderColor: "#3fa052",
      };
    }

    if (level.current) {
      return {
        backgroundColor: Colors[colorScheme].accent,
        borderColor: "#0e90d5",
      };
    }

    return {
      backgroundColor: Colors[colorScheme].cardBackground,
      borderColor: Colors[colorScheme].border,
    };
  };

  const getIconName = () => {
    if (level.locked) {
      return "lock";
    }
    if (level.type === "challenge") {
      return "crown";
    }
    if (level.current) {
      return "play";
    }
    if (level.completed) {
      return "check";
    }
    return "circle";
  };

  return (
    <TouchableOpacity style={[styles.levelBadge, getBadgeStyle()]} disabled={level.locked}>
      <FontAwesome5 name={getIconName()} size={20} color={level.locked ? "#a0a0a0" : "white"} />
      {level.completed && level.stars > 0 && (
        <RNView style={styles.starsContainer}>
          {[...Array(3)].map((_, i) => (
            <FontAwesome5
              key={i}
              name="star"
              size={10}
              color={i < level.stars ? Colors[colorScheme].gold : "#e0e0e0"}
              solid={i < level.stars}
              style={{ marginHorizontal: 1 }}
            />
          ))}
        </RNView>
      )}
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [streak, setStreak] = useState(7); // 连续学习天数
  const [xp, setXp] = useState(523); // 经验值
  const [gems, setGems] = useState(120); // 宝石数量

  return (
    <ScrollView style={styles.container}>
      {/* 用户状态栏 */}
      <View style={styles.statsBar}>
        <RNView style={styles.statItem}>
          <Ionicons name="flame" size={24} color={Colors[colorScheme].warning} />
          <Text style={styles.statText}>{streak}</Text>
        </RNView>
        <RNView style={styles.statItem}>
          <FontAwesome5 name="bolt" size={20} color={Colors[colorScheme].accent} />
          <Text style={styles.statText}>{xp} XP</Text>
        </RNView>
        <RNView style={styles.statItem}>
          <FontAwesome5 name="gem" size={20} color={Colors[colorScheme].gold} />
          <Text style={styles.statText}>{gems}</Text>
        </RNView>
      </View>

      {/* 课程列表 */}
      {COURSES.map((course) => (
        <View key={course.id} style={styles.courseContainer}>
          {/* 课程标题 */}
          <RNView style={styles.courseHeader}>
            <Image source={{ uri: course.icon }} style={styles.courseIcon} />
            <Text style={styles.courseTitle}>{course.title}</Text>
          </RNView>

          {/* 课程关卡 */}
          <RNView style={styles.levelsContainer}>
            {course.levels.map((level, index) => {
              // 计算位置，让关卡路径弯曲
              const isEven = index % 2 === 0;
              const offsetY = isEven ? 0 : 40;

              return (
                <RNView
                  key={level.id}
                  style={[
                    styles.levelWrapper,
                    {
                      left: `${(index / (course.levels.length - 1)) * 82 + 5}%`,
                      top: offsetY,
                    },
                  ]}
                >
                  <LevelBadge level={level} colorScheme={colorScheme} />

                  {/* 连接线 */}
                  {index < course.levels.length - 1 && (
                    <RNView
                      style={[
                        styles.levelConnector,
                        {
                          width: 40,
                          transform: [{ rotate: isEven ? "45deg" : "-45deg" }, { translateX: 18 }],
                          backgroundColor: level.completed ? Colors[colorScheme].success : "#e0e0e0",
                        },
                      ]}
                    />
                  )}
                </RNView>
              );
            })}
          </RNView>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
  },
  statText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "600",
  },
  courseContainer: {
    marginBottom: 40,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  levelsContainer: {
    height: 120,
    position: "relative",
    marginHorizontal: 10,
  },
  levelWrapper: {
    position: "absolute",
    alignItems: "center",
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    zIndex: 2,
  },
  levelConnector: {
    height: 3,
    position: "absolute",
    right: 0,
    top: 24,
    zIndex: 1,
  },
  starsContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: -15,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
});
