import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Text, View } from "../../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";

// 练习数据
const PRACTICE_SECTIONS = [
  {
    id: "1",
    title: "基础 1",
    lessons: [
      { id: "1.1", name: "问候", completed: true, icon: "chatbubble-outline" },
      { id: "1.2", name: "自我介绍", completed: true, icon: "person-outline" },
      { id: "1.3", name: "食物", completed: false, icon: "fast-food-outline" },
      { id: "1.4", name: "家庭", completed: false, icon: "people-outline" },
    ],
    progress: 50,
  },
  {
    id: "2",
    title: "旅行",
    lessons: [
      { id: "2.1", name: "交通", completed: false, icon: "car-outline" },
      { id: "2.2", name: "酒店", completed: false, icon: "bed-outline" },
      { id: "2.3", name: "购物", completed: false, icon: "cart-outline" },
      { id: "2.4", name: "问路", completed: false, icon: "map-outline" },
    ],
    progress: 0,
  },
  {
    id: "3",
    title: "商务",
    lessons: [
      { id: "3.1", name: "会议", completed: false, icon: "business-outline" },
      { id: "3.2", name: "项目", completed: false, icon: "document-outline" },
      { id: "3.3", name: "电话", completed: false, icon: "call-outline" },
      { id: "3.4", name: "邮件", completed: false, icon: "mail-outline" },
    ],
    progress: 0,
  },
];

export default function PracticeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [dailyGoal, setDailyGoal] = useState(3);
  const [dailyProgress, setDailyProgress] = useState(1);

  return (
    <View style={styles.container}>
      {/* 日常目标 */}
      <View style={styles.dailyGoalContainer}>
        <View style={styles.dailyGoalHeader}>
          <Text style={styles.dailyGoalTitle}>今日目标</Text>
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
                    <Ionicons name={lesson.icon} size={24} color="#fff" />
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

        {/* 底部角色 */}
        <View style={styles.mascotContainer}>
          <Image source={{ uri: "https://i.imgur.com/dZeL8oJ.png" }} style={styles.mascotImage} />
          <View style={styles.mascotBubble}>
            <Text style={styles.mascotText}>继续努力学习！你已经完成了今天目标的 33%</Text>
          </View>
        </View>
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
