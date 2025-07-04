import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View as RNView, TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions } from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useRouter } from "expo-router";
import { API_BASE_URL } from "@/constants/apiConfig";
import { getCurrentStudentIdForProgress } from "../services/progressService";
import RenderHtml from 'react-native-render-html';

// HTML渲染组件 - 支持题目和选项的HTML内容
const HtmlContent = ({ html, style }: { html: string; style?: any }) => {
  const { width } = useWindowDimensions();
  
  // 检查是否包含HTML标签
  const hasHtmlTags = /<[^>]*>/g.test(html);
  
  if (!hasHtmlTags) {
    // 没有HTML标签，直接使用Text组件
    return <Text style={style}>{html}</Text>;
  }
  
  // 有HTML标签，使用RenderHtml组件
  const tagsStyles = {
    body: {
      color: style?.color || '#333',
      fontSize: style?.fontSize || 16,
      fontFamily: style?.fontFamily || 'System',
      lineHeight: style?.lineHeight || 22,
    },
    p: {
      marginVertical: 4,
    },
    strong: {
      fontWeight: 'bold' as const,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    code: {
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      padding: 2,
      borderRadius: 3,
    },
    sup: {
      fontSize: (style?.fontSize || 16) * 0.7,
      lineHeight: 1,
    },
    sub: {
      fontSize: (style?.fontSize || 16) * 0.7,
      lineHeight: 1,
    },
  };
  
  return (
    <RenderHtml
      contentWidth={width - 64} // 减去padding
      source={{ html }}
      tagsStyles={tagsStyles}
      systemFonts={['System']}
      enableExperimentalMarginCollapsing={true}
    />
  );
};

export default function WrongExercisesScreen() {
  const router = useRouter();
  const [wrongExercises, setWrongExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取错题本数据
  useEffect(() => {
    const fetchWrongExercises = async () => {
      try {
        setLoading(true);
        // 使用新的AnswerRecord API端点
        const studentId = await getCurrentStudentIdForProgress();
        const apiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/wrong-exercises`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error("获取错题本失败");
        }

        const result = await response.json();

        if (result.success && result.data) {
          setWrongExercises(result.data);
        } else {
          throw new Error(result.message || "获取错题本失败");
        }
      } catch (err: any) {
        console.error("获取错题本出错:", err);
        setError(err.message || "获取错题本失败，请稍后再试");
        setWrongExercises([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWrongExercises();
  }, []);

  // 从错题本中删除一道题
  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      // 使用新的AnswerRecord API端点
      const studentId = await getCurrentStudentIdForProgress();
      const apiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/wrong-exercises/${exerciseId}`;
      const response = await fetch(apiUrl, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除错题失败");
      }

      // 更新本地状态
      setWrongExercises((prev) => {
        if (!prev || !Array.isArray(prev)) {
          return [];
        }
        return prev.filter((item) => item && item.exerciseData && item.exerciseData.id !== exerciseId);
      });

      Alert.alert("成功", "已从错题本中删除");
    } catch (err: any) {
      console.error("删除错题出错:", err);
      Alert.alert("错误", err.message || "删除错题失败，请稍后再试");
    }
  };

  // 跳转到学习页面
  const handlePracticeAgain = (exercise: any) => {
    router.push({
      pathname: "/study",
      params: {
        id: exercise.unitId,
        unitTitle: `错题练习 - ${exercise.exerciseData.question.substring(0, 10)}...`,
        exerciseId: exercise.exerciseData.id,
      },
    });
  };

  return (
    <View style={styles.container}>
      <RNView style={styles.header}>
        <Text style={styles.headerTitle}>错题本</Text>
      </RNView>

      <ScrollView style={styles.scrollContent}>
        {loading ? (
          <RNView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5EC0DE" />
            <Text style={styles.loadingText}>加载错题本...</Text>
          </RNView>
        ) : error ? (
          <RNView style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="red" />
            <Text style={styles.errorText}>{error}</Text>
          </RNView>
        ) : wrongExercises.length === 0 ? (
          <RNView style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#58CC02" />
            <Text style={styles.emptyText}>太棒了！你的错题本是空的</Text>
            <Text style={styles.emptySubText}>继续学习，巩固知识吧</Text>
          </RNView>
        ) : (
          <RNView style={styles.exercisesContainer}>
            <Text style={styles.sectionTitle}>我的错题 ({wrongExercises.length})</Text>

            {wrongExercises.map((item, index) => {
              if (!item || !item.exerciseData) {
                return null;
              }
              return (
                <RNView key={index} style={styles.exerciseCard}>
                  <RNView style={styles.questionContainer}>
                    <HtmlContent html={item.exerciseData.question} style={styles.questionText} />
                    {item.exerciseData.isAI && (
                      <RNView style={styles.aiIconContainer}>
                        <Ionicons name="sparkles" size={16} color="#FF9500" />
                        <Text style={styles.aiText}>AI</Text>
                      </RNView>
                    )}
                  </RNView>

                  <RNView style={styles.optionsContainer}>
                    {item.exerciseData.options && Array.isArray(item.exerciseData.options) ? (
                      item.exerciseData.options.map((option: string, optIndex: number) => (
                        <RNView
                          key={optIndex}
                          style={[
                            styles.optionItem,
                            optIndex === item.exerciseData.correctAnswer && styles.correctOption,
                          ]}
                        >
                          <HtmlContent html={option} style={styles.optionText} />
                          {optIndex === item.exerciseData.correctAnswer && (
                            <Ionicons name="checkmark-circle" size={20} color="green" />
                          )}
                        </RNView>
                      ))
                    ) : (
                      <Text>无选项数据</Text>
                    )}
                  </RNView>

                  <RNView style={styles.attemptsContainer}>
                    <Text style={styles.attemptsText}>尝试次数: {item.attempts}</Text>
                  </RNView>

                  <RNView style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handlePracticeAgain(item)}>
                      <Ionicons name="refresh" size={18} color="#5EC0DE" />
                      <Text style={styles.actionButtonText}>再练一次</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.removeButton]}
                      onPress={() => handleRemoveExercise(item.exerciseData.id)}
                    >
                      <Ionicons name="trash" size={18} color="#FF6B6B" />
                      <Text style={[styles.actionButtonText, styles.removeButtonText]}>移除</Text>
                    </TouchableOpacity>
                  </RNView>
                </RNView>
              );
            })}
          </RNView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#ffeeee",
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    marginLeft: 10,
    fontSize: 16,
    color: "red",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  exercisesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  aiIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.3)",
  },
  aiText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9500",
    marginLeft: 2,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderColor: "#eaeaea",
    borderRadius: 8,
    marginBottom: 8,
  },
  correctOption: {
    borderColor: "green",
    backgroundColor: "rgba(0, 255, 0, 0.05)",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  attemptsContainer: {
    marginBottom: 12,
  },
  attemptsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f9ff",
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#5EC0DE",
    fontWeight: "500",
  },
  removeButton: {
    backgroundColor: "#fff0f0",
  },
  removeButtonText: {
    color: "#FF6B6B",
  },
});
