import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "react-native";

// 练习数据
const PRACTICE_SECTIONS = [
  {
    id: "1",
    title: "代数基础",
    lessons: [
      { id: "1.1", name: "一元二次方程", completed: true, icon: "calculator-outline" },
      { id: "1.2", name: "因式分解", completed: true, icon: "options-outline" },
      { id: "1.3", name: "二项式定理", completed: false, icon: "grid-outline" },
      { id: "1.4", name: "公式法应用", completed: false, icon: "create-outline" },
    ],
    progress: 50,
  },
  {
    id: "2",
    title: "几何与证明",
    lessons: [
      { id: "2.1", name: "相似三角形", completed: false, icon: "triangle-outline" },
      { id: "2.2", name: "勾股定理", completed: false, icon: "analytics-outline" },
      { id: "2.3", name: "四边形性质", completed: false, icon: "square-outline" },
      { id: "2.4", name: "圆的切线", completed: false, icon: "ellipse-outline" },
    ],
    progress: 0,
  },
  {
    id: "3",
    title: "统计与概率",
    lessons: [
      { id: "3.1", name: "数据统计", completed: false, icon: "stats-chart-outline" },
      { id: "3.2", name: "频率分布", completed: false, icon: "bar-chart-outline" },
      { id: "3.3", name: "概率计算", completed: false, icon: "dice-outline" },
      { id: "3.4", name: "数学期望", completed: false, icon: "trending-up-outline" },
    ],
    progress: 0,
  },
];

export default function PracticeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [dailyGoal, setDailyGoal] = useState(5);
  const [dailyProgress, setDailyProgress] = useState(2);

  return (
    <View style={styles.container}>
      {/* 日常目标 */}
      <View style={styles.dailyGoalContainer}>
        <View style={styles.dailyGoalHeader}>
          <Text style={styles.dailyGoalTitle}>每日练习</Text>
          <Text style={styles.dailyGoalCount}>
            {dailyProgress}/{dailyGoal}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(dailyProgress / dailyGoal) * 100}%`, backgroundColor: Colors[colorScheme].tint },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* 练习小节 */}
        {PRACTICE_SECTIONS.map((section) => (
          <View key={section.id} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionProgress}>
                <View
                  style={[
                    styles.sectionProgressBar,
                    { width: `${section.progress}%`, backgroundColor: Colors[colorScheme].tint },
                  ]}
                />
              </View>
              <Text style={styles.sectionProgressText}>{section.progress}%</Text>
            </View>

            <View style={styles.lessonsContainer}>
              {section.lessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    {
                      backgroundColor: lesson.completed
                        ? Colors[colorScheme].success + "30" // 30 是透明度
                        : Colors[colorScheme].cardBackground,
                      borderColor: lesson.completed ? Colors[colorScheme].success : Colors[colorScheme].border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.lessonIcon,
                      { backgroundColor: lesson.completed ? Colors[colorScheme].success : Colors[colorScheme].accent },
                    ]}
                  >
                    <Ionicons name={lesson.icon as any} size={24} color="#fff" />
                  </View>
                  <Text style={styles.lessonName}>{lesson.name}</Text>
                  <View style={styles.lessonStatus}>
                    {lesson.completed ? (
                      <Ionicons name="checkmark-circle" size={24} color={Colors[colorScheme].success} />
                    ) : (
                      <Ionicons name="chevron-forward-circle" size={24} color={Colors[colorScheme].accent} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  dailyGoalContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyGoalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dailyGoalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dailyGoalCount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: "#e5e5e5",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginRight: 16,
  },
  sectionProgress: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e5e5",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 8,
  },
  sectionProgressBar: {
    height: "100%",
  },
  sectionProgressText: {
    fontSize: 14,
    opacity: 0.7,
  },
  lessonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  lessonCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lessonName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  lessonStatus: {
    width: 24,
  },
  mascotContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  mascotImage: {
    width: 80,
    height: 80,
    marginRight: 8,
  },
  mascotBubble: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    position: "relative",
  },
  mascotText: {
    fontSize: 14,
    color: "#333",
  },
});
