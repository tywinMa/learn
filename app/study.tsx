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
import { Text, View } from "../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getUserPoints } from "../app/services/pointsService";
import { USER_ID } from "../app/services/progressService";
import RenderHtml from 'react-native-render-html';

// API基础URL
const API_BASE_URL = "http://localhost:3000";

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
  const [loading, setLoading] = React.useState(true);
  const [learningContents, setLearningContents] = React.useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const flatListRef = useRef<FlatList>(null);

  // 加载学习内容
  useEffect(() => {
    const fetchLearningContents = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/learning/${lessonId}`);
        if (!response.ok) {
          throw new Error('获取学习内容失败');
        }
        
        const data = await response.json();
        console.log('获取到学习内容:', data);
        
        if (data.success) {
          // 按order字段排序
          const sortedContents = data.data.sort((a: any, b: any) => a.order - b.order);
          setLearningContents(sortedContents);
        } else {
          console.error('获取学习内容失败:', data.message);
        }
      } catch (error) {
        console.error('获取学习内容出错:', error);
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
        animated: true
      });
    }
  };

  // 切换到上一个视频
  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      flatListRef.current?.scrollToIndex({
        index: currentVideoIndex - 1,
        animated: true
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
      <Text style={styles.videoTitle}>{item.title}</Text>
    </RNView>
  );

  // 获取视频内容
  const videoContents = learningContents.filter(content => content.type === 'video');

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
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={() => router.replace("/")}
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
                  style={[styles.videoControlButton, currentVideoIndex === 0 && styles.disabledButton]} 
                  onPress={handlePrevVideo}
                  disabled={currentVideoIndex === 0}
                >
                  <Ionicons name="chevron-back" size={24} color={currentVideoIndex === 0 ? "#ccc" : "#333"} />
                </TouchableOpacity>
                
                <Text style={styles.videoCounter}>
                  {currentVideoIndex + 1} / {videoContents.length}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.videoControlButton, currentVideoIndex === videoContents.length - 1 && styles.disabledButton]} 
                  onPress={handleNextVideo}
                  disabled={currentVideoIndex === videoContents.length - 1}
                >
                  <Ionicons name="chevron-forward" size={24} color={currentVideoIndex === videoContents.length - 1 ? "#ccc" : "#333"} />
                </TouchableOpacity>
              </RNView>
            </>
          ) : (
            <Text style={styles.noContentText}>暂无视频内容</Text>
          )}

          <RNView style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>本节内容</Text>
            
            {learningContents.length > 0 ? (
              learningContents.map((content) => (
                <RNView key={content.id} style={styles.contentItem}>
                  <Text style={styles.contentTitle}>{content.title}</Text>
                  {content.type === 'text' && (
                    <RenderHtml
                      contentWidth={screenWidth - 40}
                      source={{ html: content.content }}
                    />
                  )}
                  {content.type === 'image' && content.mediaUrl && (
                    <Image
                      source={{ uri: content.mediaUrl }}
                      style={styles.contentImage}
                      resizeMode="contain"
                    />
                  )}
                </RNView>
              ))
            ) : (
              <Text style={styles.lessonContent}>
                暂无学习内容，请联系管理员添加。
              </Text>
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
    backgroundColor: "#f0f0f0",
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
});
