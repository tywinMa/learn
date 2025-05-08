import React, { useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View as RNView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text, View } from "../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getUserPoints } from "../app/services/pointsService";
import { USER_ID } from "../app/services/progressService";

// 导入抽取的组件
import { Exercise } from "./components/Exercise";
import { SummaryModal } from "./components/SummaryModal";

// 导入业务逻辑
import { useStudy } from "./hooks/useStudy";

// 视频资源映射
const VIDEO_RESOURCES = {
  "1-1": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4", // 示例视频URL
  "1-2": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "1-3": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "1-4": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "2-1": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "2-2": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "2-3": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "3-1": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  "3-2": "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
};

export default function StudyScreen() {
  const params = useLocalSearchParams();
  const { id, unitTitle, color } = params;
  const exerciseIdParam = Array.isArray(params.exerciseId) ? params.exerciseId[0] : params.exerciseId;
  const lessonId = Array.isArray(id) ? id[0] : id || "";

  const router = useRouter();
  const [videoStatus, setVideoStatus] = React.useState<any>({});
  const [userPoints, setUserPoints] = React.useState(0);
  const screenWidth = Dimensions.get("window").width;

  // 使用自定义hook管理学习状态和逻辑
  const {
    exercises,
    loading,
    error,
    userAnswers,
    showAnswers,
    correctCount,
    showSummary,
    scrollViewRef,
    handleAnswer,
    handleSubmit,
    handleRetry,
    setShowSummary,
    updateProgress,
  } = useStudy(lessonId);

  // 加载用户积分
  useEffect(() => {
    const fetchUserPoints = async () => {
      try {
        const points = await getUserPoints(USER_ID);
        setUserPoints(points);
      } catch (err) {
        console.error("获取用户积分失败:", err);
      }
    };

    fetchUserPoints();
  }, []);

  // 处理视频状态变化
  const handleVideoStatusUpdate = (status: any) => {
    setVideoStatus(status);
  };

  // 处理退出按钮
  const handleExit = () => {
    setShowSummary(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen
        options={{
          title: Array.isArray(unitTitle) ? unitTitle[0] : unitTitle || "学习",
          headerStyle: {
            backgroundColor: Array.isArray(color) ? color[0] : color || "#5EC0DE",
          },
          headerTintColor: "#fff",
          headerRight: () => (
            <RNView style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
              <Ionicons name="star" size={20} color="#FFD900" />
              <Text style={{ color: "white", marginLeft: 4, fontWeight: "bold" }}>{userPoints}</Text>
            </RNView>
          ),
        }}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5EC0DE" />
          <Text style={styles.loadingText}>正在加载内容...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              router.replace({
                pathname: router.pathname,
                params: router.params,
              });
            }}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: VIDEO_RESOURCES[lessonId as keyof typeof VIDEO_RESOURCES] || VIDEO_RESOURCES["1-1"] }}
              style={{ width: screenWidth, height: screenWidth * 0.56 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={handleVideoStatusUpdate}
            />
          </View>

          <RNView style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>本节内容</Text>
            <Text style={styles.lessonContent}>
              本单元讲解了React Native的基础知识，包括组件、状态管理和样式设置。通过学习，你将能够构建跨平台移动应用。
            </Text>

            <Text style={styles.sectionTitle}>练习部分</Text>
            {exercises.length === 0 ? (
              <Text style={styles.noExercisesText}>本单元暂无练习题</Text>
            ) : (
              <>
                {exercises.map((exercise) => (
                  <Exercise
                    key={exercise.id}
                    exercise={exercise}
                    onAnswer={handleAnswer}
                    userAnswers={userAnswers}
                    showAnswers={showAnswers}
                  />
                ))}
              </>
            )}

            {!showAnswers && exercises.length > 0 && (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>交卷</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.practiceButton}
              onPress={() => {
                router.push({
                  pathname: "/practice",
                  params: {
                    unitId: lessonId,
                    unitTitle: Array.isArray(unitTitle) ? unitTitle[0] : unitTitle || "课后练习",
                    color: Array.isArray(color) ? color[0] : color || "#5EC0DE",
                  },
                });
              }}
            >
              <Ionicons name="pencil" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.practiceButtonText}>进入练习</Text>
            </TouchableOpacity>
          </RNView>
        </ScrollView>
      )}

      {/* 总结弹窗 */}
      <SummaryModal
        visible={showSummary}
        correctCount={correctCount}
        totalCount={exercises.length}
        onRetry={handleRetry}
        onExit={handleExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    backgroundColor: "black",
    width: "100%",
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 20,
    color: "#333",
  },
  lessonContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    marginBottom: 20,
  },
  noExercisesText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: "#5EC0DE",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  practiceButton: {
    backgroundColor: "#FF9600",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  practiceButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#5EC0DE",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
