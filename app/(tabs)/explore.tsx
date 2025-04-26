import React, { useState } from "react";
import { StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { View, Text } from "../../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useColorScheme } from "react-native";

// 题集数据
const STORIES = [
  {
    id: "1",
    title: "方程解法精讲",
    description: "详解一元二次方程的各种解法技巧，包括配方法、公式法和根与系数关系",
    image: "https://i.imgur.com/A8eQsll.jpeg",
    difficulty: "基础",
    duration: "15分钟",
    category: "代数",
    new: true,
    completed: false,
  },
  {
    id: "2",
    title: "几何证明题集",
    description: "系统学习三角形、四边形的性质证明方法与技巧",
    image: "https://i.imgur.com/OdvhLkR.jpeg",
    difficulty: "进阶",
    duration: "20分钟",
    category: "几何",
    new: false,
    completed: false,
  },
  {
    id: "3",
    title: "函数图像分析",
    description: "学习函数图像的绘制、分析与应用，掌握二次函数性质",
    image: "https://i.imgur.com/cquUCUq.jpeg",
    difficulty: "基础",
    duration: "12分钟",
    category: "函数",
    new: false,
    completed: true,
  },
  {
    id: "4",
    title: "概率与统计精选",
    description: "中考常见概率统计题型分析与解题思路详解",
    image: "https://i.imgur.com/rkxsxQJ.jpeg",
    difficulty: "进阶",
    duration: "18分钟",
    category: "统计",
    new: true,
    completed: false,
  },
];

// 题集分类
const CATEGORIES = ["全部", "代数", "几何", "函数", "统计"];

export default function ExploreScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [activeCategory, setActiveCategory] = useState("全部");

  const filteredStories =
    activeCategory === "全部" ? STORIES : STORIES.filter((story) => story.category === activeCategory);

  return (
    <View style={styles.container}>
      {/* 题集分类选择 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              activeCategory === category && {
                backgroundColor: Colors[colorScheme].tint,
              },
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === category && {
                  color: "white",
                  fontWeight: "bold",
                },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 题集列表 */}
      <ScrollView style={styles.storiesContainer}>
        {filteredStories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyCard}>
            <Image source={{ uri: story.image }} style={styles.storyImage} />

            <View style={styles.storyContent}>
              <View style={styles.storyHeader}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                {story.new && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>新</Text>
                  </View>
                )}
              </View>

              <Text style={styles.storyDescription} numberOfLines={2}>
                {story.description}
              </Text>

              <View style={styles.storyFooter}>
                <View style={styles.storyMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={Colors[colorScheme].text} />
                    <Text style={styles.metaText}>{story.duration}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="stats-chart-outline" size={14} color={Colors[colorScheme].text} />
                    <Text style={styles.metaText}>{story.difficulty}</Text>
                  </View>
                </View>

                {story.completed ? (
                  <View style={[styles.storyButton, { backgroundColor: Colors[colorScheme].success }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={styles.storyButtonText}>已完成</Text>
                  </View>
                ) : (
                  <View style={[styles.storyButton, { backgroundColor: Colors[colorScheme].accent }]}>
                    <Ionicons name="document-text-outline" size={14} color="#fff" />
                    <Text style={styles.storyButtonText}>开始学习</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* 底部提示 */}
        <View style={styles.bottomHint}>
          <Ionicons name="bulb-outline" size={20} color={Colors[colorScheme].warning} />
          <Text style={styles.bottomHintText}>通过完成题集可以获得解题经验和奖励分数！</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoriesContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  categoryText: {
    fontSize: 14,
  },
  storiesContainer: {
    flex: 1,
    padding: 16,
  },
  storyCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  storyImage: {
    width: 120,
    height: "100%",
  },
  storyContent: {
    flex: 1,
    padding: 12,
  },
  storyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#ff7043",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  newBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  storyDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  storyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storyMeta: {
    flexDirection: "row",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  storyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  storyButtonText: {
    color: "white",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  bottomHint: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff9e6",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ffe0b2",
  },
  bottomHintText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#b38600",
  },
});
