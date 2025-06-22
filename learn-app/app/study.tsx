import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View as RNView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { VideoPlayer } from "./components/VideoPlayer";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { getStudentPoints } from "../app/services/pointsService";
import { getCurrentStudentIdForProgress } from "../app/services/progressService";
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
  const [studentPoints, setStudentPoints] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [learningContents, setLearningContents] = React.useState<any[]>([]);
  const [exampleContents, setExampleContents] = React.useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string>("");
  const screenWidth = Dimensions.get("window").width;

  // 获取颜色参数并提供默认值
  const primaryColor = Array.isArray(color) ? color[0] : color || "#5EC0DE";
  const secondaryCol = Array.isArray(secondaryColor) ? secondaryColor[0] : secondaryColor || primaryColor;

  // 加载学习内容
  useEffect(() => {
    const fetchLearningContents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 记录学习开始时间
        const studyStartTime = Date.now();

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
          const exampleItems: any[] = [];
          
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
          
          // 如果有例题媒体内容，将每个例题媒体添加为单独的项
          if (unitData.exampleMedia && Array.isArray(unitData.exampleMedia)) {
            unitData.exampleMedia.forEach((media: { title?: string; url: string; type: string; metadata?: any }, index: number) => {
              exampleItems.push({
                id: `${unitData.id}-example-${index}`,
                unitId: unitData.id,
                title: media.title || `例题 ${index + 1}`,
                content: '',
                mediaUrl: media.url,
                order: index + 1,
                type: media.type,
                metadata: media.metadata
              });
            });
          }
          
          // 按order字段排序
          const sortedContents = contentItems.sort((a, b) => a.order - b.order);
          const sortedExamples = exampleItems.sort((a, b) => a.order - b.order);
          setLearningContents(sortedContents);
          setExampleContents(sortedExamples);
        } else {
          setError(data.message || "获取学习内容失败");
        }
        
        // 记录用户访问学习页面的次数
        try {
          // 计算学习时间（秒）
          const timeSpent = Math.floor((Date.now() - studyStartTime) / 1000);
          // 如果学习时间太短（小于5秒），设置一个合理的最小值
          const reportedTimeSpent = Math.max(timeSpent, 5);
          
          // 调用API增加学习次数
          const studentId = await getCurrentStudentIdForProgress();
          const activityApiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/increment-study/${lessonId}`;

          const activityResponse = await fetch(activityApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activityType: "study_start", // 明确标识活动类型
              timeSpent: 0, // 开始时没有花费时间
            }),
          });
          
          if (activityResponse.ok) {
            console.log(`成功记录用户学习活动: ${lessonId}, 学习时间: ${reportedTimeSpent}秒`);
            
            // 尝试获取返回的掌握度数据
            const activityData = await activityResponse.json();
            if (activityData.success && activityData.data) {
              console.log('用户学习统计:', activityData.data);
            }
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
    
    // 组件卸载时记录总学习时间
    const studyStartTime = Date.now();
    return () => {
      // 计算总学习时间
      const totalStudyTime = Math.floor((Date.now() - studyStartTime) / 1000);
      
      // 仅当学习时间超过10秒时才记录
      if (totalStudyTime > 10 && lessonId) {
        console.log(`用户学习了 ${totalStudyTime} 秒`);
        
        // 发送最终学习时间统计
        fetch(`${API_BASE_URL}/api/answer-records/${currentStudentId}/increment-study/${lessonId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            activityType: "study_end", // 明确标识活动类型
            timeSpent: totalStudyTime // 使用与服务器端匹配的字段名
          })
        }).catch(err => {
          console.error('记录最终学习时间失败:', err);
        });
      }
    };
  }, [lessonId]);

  // 加载学生积分
  useEffect(() => {
    const fetchStudentPoints = async () => {
      try {
        const studentId = await getCurrentStudentIdForProgress();
        setCurrentStudentId(studentId);
        const points = await getStudentPoints();
        setStudentPoints(points);
      } catch (err) {
        console.error("获取学生积分失败:", err);
      }
    };

    fetchStudentPoints();
  }, []);

  // 处理视频状态变化
  const handleVideoStatusUpdate = (status: any) => {
    setVideoStatus(status);
  };

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
              <Text style={{ color: "white", marginLeft: 4, fontWeight: "bold" }}>{studentPoints}</Text>
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
          {/* 主要媒体资源部分 - Grid布局 */}
          {videoContents.length > 0 && (
            <RNView style={styles.contentContainer}>
              <Text style={[styles.sectionTitle, { color: primaryColor, marginTop: 0 }]}>学习视频</Text>
              <RNView style={styles.mediaGrid}>
                {videoContents.map((video, index) => (
                  <RNView key={video.id} style={styles.mediaItem}>
                    <TouchableOpacity
                      style={styles.mediaVideoContainer}
                      onPress={() => {
                        // 可以添加视频播放逻辑或导航到全屏播放
                      }}
                    >
                                             <VideoPlayer
                        source={{ uri: video.mediaUrl }}
                        title={video.title}
                        style={styles.mediaVideo}
                        primaryColor={primaryColor}
                        onPlaybackStatusUpdate={handleVideoStatusUpdate}
                      />
                    </TouchableOpacity>
                  </RNView>
                ))}
              </RNView>
            </RNView>
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

            {/* 例题资源部分 */}
            {exampleContents.length > 0 && (
              <RNView style={styles.exampleSection}>
                <Text style={[styles.sectionTitle, { color: primaryColor }]}>例题讲解</Text>
                <RNView style={styles.exampleGrid}>
                  {exampleContents.map((example, index) => (
                    <RNView key={example.id} style={styles.exampleItem}>
                      {example.type === "video" && example.mediaUrl && (
                        <TouchableOpacity
                          style={styles.exampleVideoContainer}
                          onPress={() => {
                            // 可以添加视频播放逻辑或导航到全屏播放
                          }}
                        >
                          <VideoPlayer
                            source={{ uri: example.mediaUrl }}
                            title={example.title}
                            style={styles.exampleVideo}
                            primaryColor={primaryColor}
                            onPlaybackStatusUpdate={handleVideoStatusUpdate}
                          />
                        </TouchableOpacity>
                      )}
                      {example.type === "image" && example.mediaUrl && (
                        <TouchableOpacity style={styles.exampleVideoContainer}>
                          <Image 
                            source={{ uri: example.mediaUrl }} 
                            style={styles.exampleVideo} 
                            resizeMode="cover" 
                          />
                          <RNView style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>{example.title}</Text>
                          </RNView>
                        </TouchableOpacity>
                      )}
                    </RNView>
                  ))}
                </RNView>
              </RNView>
            )}

            <TouchableOpacity
              style={[styles.practiceButton, { backgroundColor: primaryColor }]}
              onPress={() => {
                router.push({
                  pathname: "/exercise",
                  params: {
                    id: lessonId, // 使用id参数代替unitId，与exercise.tsx中的处理一致
                    unitTitle: Array.isArray(unitTitle) ? unitTitle[0] : unitTitle || "课后练习",
                    color: primaryColor,
                    secondaryColor: secondaryCol, // 添加缺失的secondaryColor参数
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
  // 主要媒体资源Grid布局样式
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  mediaItem: {
    width: (Dimensions.get("window").width - 60) / 2, // 一行两个，减去padding和间距
  },
  mediaVideoContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  mediaVideo: {
    width: "100%",
    height: 120,
    borderRadius: 12,
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

  exampleSection: {
    marginTop: 30,
  },
  exampleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  exampleItem: {
    width: (Dimensions.get("window").width - 70) / 2, // 一行两个，减去padding和间距
  },
  exampleVideoContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  exampleVideo: {
    width: "100%",
    height: 120,
    borderRadius: 12,
  },

});
