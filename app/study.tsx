import React, { useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  View as RNView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Text, View } from "../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getUserPoints } from "../app/services/pointsService";
import { USER_ID } from "../app/services/progressService";

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
  const lessonId = Array.isArray(id) ? id[0] : id || "";

  const router = useRouter();
  const [videoStatus, setVideoStatus] = React.useState<any>({});
  const [userPoints, setUserPoints] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const screenWidth = Dimensions.get("window").width;

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
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 30 }}>
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
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  }
});
