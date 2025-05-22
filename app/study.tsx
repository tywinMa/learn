import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View as RNView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getUserPoints } from "../app/services/pointsService";
import { USER_ID } from "../app/services/progressService";
import RenderHtml from "react-native-render-html";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "@/constants/apiConfig";

export default function StudyScreen() {
  const params = useLocalSearchParams();
  const { id, unitTitle, color, secondaryColor, subject, isUnlockingTest, unlockPreviousUnits } = params;
  // 获取单元ID - 假定包含学科代码前缀，不再需要分离
  let lessonId = Array.isArray(id) ? id[0] : id || "";
  const subjectCode = Array.isArray(subject) ? subject[0] : subject || "math"; // 获取学科代码，默认为math
  
  // 解析解锁测试参数
  const isTestForUnlocking = isUnlockingTest === "true";
  const shouldUnlockPreviousUnits = unlockPreviousUnits === "true";

  const router = useRouter();
  const [videoStatus, setVideoStatus] = React.useState<any>({});
  const [userPoints, setUserPoints] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [learningContents, setLearningContents] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const flatListRef = useRef<FlatList>(null);

  // 获取颜色参数并提供默认值
  const primaryColor = Array.isArray(color) ? color[0] : color || "#5EC0DE";
  const secondaryCol = Array.isArray(secondaryColor) ? secondaryColor[0] : secondaryColor || primaryColor;

  // 加载学习内容
  useEffect(() => {
    const fetchLearningContents = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!lessonId) {
          setError("无法加载学习内容：缺少单元ID");
          setLoading(false);
          return;
        }

        // 使用新的API路径
        const apiUrl = `${API_BASE_URL}/api/unit-content/${lessonId}`;

        console.log("调用API:", apiUrl);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`获取学习内容失败 (HTTP ${response.status})`);
        }

        const data = await response.json();
        console.log("获取到单元内容:", data);

        if (data.success) {
          // 处理新的数据结构
          const unitData = data.data;
          const contentItems = [];
          
          // 如果有内容，添加为文本类型项
          if (unitData.content) {
            contentItems.push({
              id: `${unitData.id}-content`,
              unitId: unitData.id,
              title: unitData.title,
              content: unitData.content,
              order: 1,
              type: 'text'
            });
          }
          
          // 如果有媒体内容，将每个媒体添加为单独的项
          if (unitData.media && Array.isArray(unitData.media)) {
            unitData.media.forEach((media: { title?: string; url: string; type: string; metadata?: any }, index: number) => {
              contentItems.push({
                id: `${unitData.id}-media-${index}`,
                unitId: unitData.id,
                title: media.title || `${unitData.title} 媒体 ${index + 1}`,
                content: '',
                mediaUrl: media.url,
                order: index + 2, // 文本内容之后
                type: media.type,
                metadata: media.metadata
              });
            });
          }
          
          // 按order字段排序
          const sortedContents = contentItems.sort((a, b) => a.order - b.order);
          setLearningContents(sortedContents);
        } else {
          setError(data.message || "获取学习内容失败");
        }
        
        // 记录用户访问学习页面的次数
        try {
          // 调用API增加学习次数
          const activityApiUrl = `${API_BASE_URL}/api/users/${USER_ID}/increment-study/${lessonId}`;
          
          const activityResponse = await fetch(activityApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (activityResponse.ok) {
            console.log(`成功记录用户学习活动: ${lessonId}`);
          } else {
            console.warn(`记录学习活动失败: HTTP ${activityResponse.status}`);
          }
        } catch (activityError) {
          console.error('记录学习活动出错:', activityError);
          // 这里不需要向用户显示错误，因为这只是一个后台统计功能
        }
      } catch (error: any) {
        console.error("获取学习内容出错:", error);
        setError(error.message || "获取学习内容时出现错误");
      } finally {
        setLoading(false);
      }
    };

    fetchLearningContents();
  }, [lessonId]);

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

  // 切换到下一个视频
  const handleNextVideo = () => {
    if (currentVideoIndex < learningContents.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      flatListRef.current?.scrollToIndex({
        index: currentVideoIndex + 1,
        animated: true,
      });
    }
  };

  // 切换到上一个视频
  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      flatListRef.current?.scrollToIndex({
        index: currentVideoIndex - 1,
        animated: true,
      });
    }
  };

  // 渲染视频项
  const renderVideoItem = ({ item, index }: { item: any; index: number }) => (
    <RNView style={styles.videoContainer}>
      <Video
        source={{ uri: item.mediaUrl }}
        style={{ width: screenWidth, height: screenWidth * 0.56 }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={handleVideoStatusUpdate}
      />
      <LinearGradient
        colors={[primaryColor, secondaryCol]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.videoTitleGradient}
      >
        <Text style={styles.videoTitleText}>{item.title}</Text>
      </LinearGradient>
    </RNView>
  );

  // 获取视频内容
  const videoContents = learningContents.filter((content) => content.type === "video");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen
        options={{
          title: Array.isArray(unitTitle) ? unitTitle[0] : unitTitle || "学习",
          headerBackground: () => (
            <LinearGradient
              colors={[primaryColor, secondaryCol]}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)",
                  params: {
                    refresh: Date.now().toString(), // 添加时间戳参数，强制组件刷新
                    currentSubject: subjectCode, // 传递当前学科
                  },
                })
              }
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
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
          <Ionicons name="alert-circle" size={64} color="#FF9600" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace({
                pathname: "/(tabs)",
                params: {
                  refresh: Date.now().toString(),
                  currentSubject: subjectCode,
                },
              })
            }
          >
            <Text style={styles.backButtonText}>返回首页</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 30 }}>
          {videoContents.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={videoContents}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                  setCurrentVideoIndex(newIndex);
                }}
              />

              <RNView style={styles.videoControls}>
                <TouchableOpacity
                  style={[
                    styles.videoControlButton,
                    {
                      backgroundColor: currentVideoIndex === 0 ? "#f0f0f0" : primaryColor,
                    },
                    currentVideoIndex === 0 && styles.disabledButton,
                  ]}
                  onPress={handlePrevVideo}
                  disabled={currentVideoIndex === 0}
                >
                  <Ionicons name="chevron-back" size={24} color={currentVideoIndex === 0 ? "#ccc" : "#fff"} />
                </TouchableOpacity>

                <Text style={styles.videoCounter}>
                  {currentVideoIndex + 1} / {videoContents.length}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.videoControlButton,
                    {
                      backgroundColor: currentVideoIndex === videoContents.length - 1 ? "#f0f0f0" : primaryColor,
                    },
                    currentVideoIndex === videoContents.length - 1 && styles.disabledButton,
                  ]}
                  onPress={handleNextVideo}
                  disabled={currentVideoIndex === videoContents.length - 1}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={currentVideoIndex === videoContents.length - 1 ? "#ccc" : "#fff"}
                  />
                </TouchableOpacity>
              </RNView>
            </>
          ) : (
            <Text style={styles.noContentText}>暂无视频内容</Text>
          )}

          <RNView style={styles.contentContainer}>
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>本节内容</Text>

            {learningContents.length > 0 ? (
              learningContents.map((content) => (
                <RNView key={content.id} style={styles.contentItem}>
                  <Text style={[styles.contentTitle, { color: primaryColor }]}>{content.title}</Text>
                  {content.type === "text" && (
                    <RenderHtml contentWidth={screenWidth - 40} source={{ html: content.content }} />
                  )}
                  {content.type === "image" && content.mediaUrl && (
                    <Image source={{ uri: content.mediaUrl }} style={styles.contentImage} resizeMode="contain" />
                  )}
                </RNView>
              ))
            ) : (
              <Text style={styles.lessonContent}>暂无学习内容，请联系管理员添加。</Text>
            )}

            <TouchableOpacity
              style={[styles.practiceButton, { backgroundColor: primaryColor }]}
              onPress={() => {
                router.push({
                  pathname: "/practice",
                  params: {
                    id: lessonId, // 使用id参数代替unitId，与practice.tsx中的处理一致
                    unitTitle: Array.isArray(unitTitle) ? unitTitle[0] : unitTitle || "课后练习",
                    color: primaryColor,
                    subject: subjectCode, // 传递学科代码
                    isUnlockingTest: isTestForUnlocking ? "true" : "false",
                    unlockPreviousUnits: shouldUnlockPreviousUnits ? "true" : "false"
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
    width: Dimensions.get("window").width,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "600",
    padding: 12,
    backgroundColor: "#fff",
    color: "#333",
  },
  videoControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
  },
  videoControlButton: {
    padding: 8,
    borderRadius: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  videoCounter: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#666",
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
  contentItem: {
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  lessonContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    marginBottom: 20,
  },
  practiceButton: {
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
  },
  noContentText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
    color: "#666",
  },
  contentImage: {
    width: Dimensions.get("window").width - 40,
    height: Dimensions.get("window").width * 0.56,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    maxWidth: "80%",
  },
  backButton: {
    backgroundColor: "#FF9600",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  videoTitleGradient: {
    padding: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  videoTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
