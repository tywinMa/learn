import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View as RNView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
  useWindowDimensions,
  Alert,
} from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  getCurrentStudentIdForProgress,
  getStudentUnitProgress,
  type UnitProgress,
} from "./services/progressService";
// 导入工具函数，添加新的 processAnswer 函数
import { processAnswer } from "./utils/exerciseUtils";
import { MasteryIndicator } from "./components/MasteryIndicator";

// 正确导入Exercise组件
import { Exercise } from "./components/Exercise";
import { useSubject } from "@/hooks/useSubject";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "@/constants/apiConfig";
import { KnowledgePointModal } from "./components/KnowledgePointModal";
import { DraftPaper } from "./components/DraftPaper";
import RenderHtml from "react-native-render-html";

// HTML渲染组件 - 支持解析内容的HTML格式
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
      color: style?.color || "#444",
      fontSize: style?.fontSize || 15,
      fontFamily: style?.fontFamily || "System",
      lineHeight: style?.lineHeight || 22,
    },
    p: {
      marginVertical: 4,
    },
    strong: {
      fontWeight: "bold" as const,
    },
    em: {
      fontStyle: "italic" as const,
    },
    code: {
      fontFamily: "monospace",
      backgroundColor: "#f5f5f5",
      padding: 2,
      borderRadius: 3,
    },
    pre: {
      backgroundColor: "#f5f5f5",
      padding: 8,
      borderRadius: 5,
      marginVertical: 8,
    },
    sup: {
      fontSize: (style?.fontSize || 15) * 0.7,
      lineHeight: 1,
    },
    sub: {
      fontSize: (style?.fontSize || 15) * 0.7,
      lineHeight: 1,
    },
  };

  return (
    <RenderHtml
      contentWidth={width - 64} // 减去更多的padding
      source={{ html }}
      tagsStyles={tagsStyles}
      systemFonts={["System"]}
      enableExperimentalMarginCollapsing={true}
    />
  );
};

// 知识点类型定义
interface KnowledgePoint {
  id: number;
  title: string;
  content: string;
  type: "text" | "image" | "video";
  mediaUrl?: string;
}

// 可汗学院风格的进度条组件
const KhanStyleProgressBar = ({
  exercises,
  currentIndex,
  answeredExercises,
  skippedExercises,
  hasSubmittedAnswer,
}: {
  exercises: any[];
  currentIndex: number;
  answeredExercises: Record<string, boolean>;
  skippedExercises: Record<string, boolean>;
  hasSubmittedAnswer: boolean;
}) => {
  const renderProgressDot = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return null;

    const exerciseId = exercise.id;
    const isAnswered = answeredExercises.hasOwnProperty(exerciseId);
    const isCorrect = answeredExercises[exerciseId];
    const isSkipped = skippedExercises[exerciseId];
    const isCurrent = exerciseIndex === currentIndex;

    // 确定图标和样式
    let iconName: any = "radio-button-off";
    let iconColor = "#ccc";
    let iconSize = 16;

    if (isAnswered && isCorrect && !isSkipped) {
      // 做对的题目：绿色勾
      iconName = "checkmark-circle";
      iconColor = "#58CC02";
      iconSize = 16;
    } else if (isSkipped || (isAnswered && !isCorrect && !isSkipped)) {
      // 跳过的题目或答错的题目：小实心灰色圆圈
      iconName = "radio-button-on";
      iconColor = "#999";
      iconSize = 12;
    } else if (isCurrent) {
      // 当前题目：大一点的实心灰色圆圈
      iconName = "radio-button-on";
      iconColor = "#666";
      iconSize = 20;
    } else {
      // 待做的题目：空心圆圈
      iconName = "radio-button-off";
      iconColor = "#ccc";
      iconSize = 16;
    }

    return (
      <RNView key={exerciseIndex} style={styles.progressDotContainer}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </RNView>
    );
  };

  return (
    <RNView style={styles.khanProgressContainer}>
      <RNView style={styles.khanProgressDots}>
        {exercises.map((_, index) => renderProgressDot(index))}
      </RNView>
    </RNView>
  );
};

// AI讲解按钮组件
const AIExplanationButtons = () => {
  const handleAIExplanation = (type: string) => {
    Alert.alert("提示", "功能待实现", [{ text: "确定", style: "default" }]);
  };

  return (
    <RNView style={styles.aiExplanationContainer}>
      <RNView style={styles.aiExplanationHeader}>
        <Ionicons name="sparkles" size={16} color="#FF6B35" />
        <Text style={styles.aiExplanationTitle}>AI智能讲解</Text>
      </RNView>
      <RNView style={styles.aiButtonsRow}>
        <TouchableOpacity
          style={[styles.aiButton, styles.aiTextButton]}
          onPress={() => handleAIExplanation("text")}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={18} color="#4A90E2" />
          <Text style={[styles.aiButtonText, { color: "#4A90E2" }]}>
            AI文字讲解
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.aiButton, styles.aiVisualButton]}
          onPress={() => handleAIExplanation("visual")}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={18} color="#50C878" />
          <Text style={[styles.aiButtonText, { color: "#50C878" }]}>
            AI可视化讲解
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.aiButton, styles.aiInteractiveButton]}
          onPress={() => handleAIExplanation("interactive")}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#FF6B35" />
          <Text style={[styles.aiButtonText, { color: "#FF6B35" }]}>
            AI互动讲解
          </Text>
        </TouchableOpacity>
      </RNView>
    </RNView>
  );
};

// 独立的知识点组件
const KnowledgePointsSection = ({
  knowledgePoints,
}: {
  knowledgePoints?: KnowledgePoint[];
}) => {
  // 知识点弹窗状态
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] =
    useState<KnowledgePoint | null>(null);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);

  const handleKnowledgePointPress = (knowledgePoint: KnowledgePoint) => {
    setSelectedKnowledgePoint(knowledgePoint);
    setShowKnowledgeModal(true);
  };

  return (
    <>
      {/* AI讲解按钮 - 始终显示 */}
      <AIExplanationButtons />

      {/* 相关知识点 - 只有当存在知识点时才显示 */}
      {knowledgePoints && knowledgePoints.length > 0 && (
        <RNView style={styles.knowledgePointsContainer}>
          <RNView style={styles.knowledgePointsHeader}>
            <Ionicons name="bulb-outline" size={16} color="#FF9500" />
            <Text style={styles.knowledgePointsTitle}>相关知识点</Text>
          </RNView>
          <RNView style={styles.knowledgePointsList}>
            {knowledgePoints.map((point, index) => (
              <TouchableOpacity
                key={index}
                style={styles.knowledgePointTag}
                onPress={() => handleKnowledgePointPress(point)}
                activeOpacity={0.7}
              >
                <Text style={styles.knowledgePointText}>{point.title}</Text>
                <Ionicons name="chevron-forward" size={14} color="#666" />
              </TouchableOpacity>
            ))}
          </RNView>
        </RNView>
      )}

      {/* 知识点弹窗 */}
      <KnowledgePointModal
        visible={showKnowledgeModal}
        knowledgePoint={selectedKnowledgePoint}
        onClose={() => {
          setShowKnowledgeModal(false);
          setSelectedKnowledgePoint(null);
        }}
      />
    </>
  );
};

// 结果反馈组件 - 显示每道题做完后的反馈
const ResultFeedback = ({
  isCorrect,
  explanation,
  onContinue,
  onSubmitAnswer,
  onSkip,
  hasSubmitted,
  onOpenDraftPaper,
  currentIndex,
  totalCount,
  exercises,
  answeredExercises,
  skippedExercises,
  exerciseAttempts,
}: {
  isCorrect: boolean;
  explanation?: string;
  onContinue: () => void;
  onSubmitAnswer?: () => void;
  onSkip?: () => void;
  hasSubmitted: boolean;
  onOpenDraftPaper?: () => void;
  currentIndex: number;
  totalCount: number;
  exercises: any[];
  answeredExercises: Record<string, boolean>;
  skippedExercises: Record<string, boolean>;
  exerciseAttempts: Record<string, number>;
}) => {
  const progressPercentage =
    totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;

  return (
    <RNView style={styles.feedbackContainer}>
      {hasSubmitted ? (
        // 已提交答案，显示结果反馈
        <>
          <RNView
            style={[
              styles.resultContainer,
              isCorrect
                ? styles.correctFeedbackContainer
                : styles.incorrectFeedbackContainer,
            ]}
          >
            <RNView style={styles.feedbackHeader}>
              <Ionicons
                name={
                  isCorrect
                    ? "checkmark-circle"
                    : !isCorrect &&
                      (exerciseAttempts[exercises[currentIndex]?.id] || 0) === 1
                    ? "help-circle"
                    : "close-circle"
                }
                size={32}
                color={
                  isCorrect
                    ? "#58CC02"
                    : !isCorrect &&
                      (exerciseAttempts[exercises[currentIndex]?.id] || 0) === 1
                    ? "#FF9600"
                    : "#FF4B4B"
                }
              />
              <Text
                style={[
                  styles.feedbackHeaderText,
                  isCorrect
                    ? styles.correctFeedbackText
                    : !isCorrect &&
                      (exerciseAttempts[exercises[currentIndex]?.id] || 0) === 1
                    ? styles.gentleFeedbackText
                    : styles.incorrectFeedbackText,
                ]}
              >
                {isCorrect
                  ? "回答正确！"
                  : !isCorrect &&
                    (exerciseAttempts[exercises[currentIndex]?.id] || 0) === 1
                  ? "不太对，再试一次？"
                  : "回答错误！"}
              </Text>
            </RNView>

            {/* 解析只在答对或第二次答错时显示 */}
            {explanation &&
              (isCorrect ||
                (!isCorrect &&
                  (exerciseAttempts[exercises[currentIndex]?.id] || 0) >=
                    2)) && (
                <RNView style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>解析：</Text>
                  <HtmlContent
                    html={explanation}
                    style={styles.explanationText}
                  />
                </RNView>
              )}

            <TouchableOpacity
              style={[
                styles.continueButton,
                isCorrect
                  ? styles.correctContinueButton
                  : styles.incorrectContinueButton,
              ]}
              onPress={onContinue}
            >
              <Text style={styles.continueButtonText}>
                {!isCorrect &&
                (exerciseAttempts[exercises[currentIndex]?.id] || 0) === 1
                  ? "重新尝试"
                  : "继续"}
              </Text>
              <Ionicons
                name={
                  !isCorrect &&
                  (exerciseAttempts[exercises[currentIndex]?.id] || 0) === 1
                    ? "refresh"
                    : "arrow-forward"
                }
                size={20}
                color="white"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </RNView>
        </>
      ) : (
        // 未提交答案，显示底部操作区域
        <RNView style={styles.bottomActionsWrapper}>
          {/* 第一行：进度条、跳过按钮、提交按钮 */}
          <RNView style={styles.bottomActionsContainer}>
            {/* 进度条区域 */}
            <KhanStyleProgressBar
              exercises={exercises}
              currentIndex={currentIndex}
              answeredExercises={answeredExercises}
              skippedExercises={skippedExercises}
              hasSubmittedAnswer={hasSubmitted}
            />

            {/* 跳过按钮 */}
            <TouchableOpacity style={styles.actionButton} onPress={onSkip}>
              <RNView style={styles.actionButtonContent}>
                <Text style={styles.skipButtonText}>跳过</Text>
              </RNView>
            </TouchableOpacity>

            {/* 提交按钮 */}
            <TouchableOpacity
              style={styles.submitActionButton}
              onPress={onSubmitAnswer}
            >
              <RNView style={styles.actionButtonContent}>
                <Text style={styles.submitButtonText}>
                  {(exerciseAttempts[exercises[currentIndex]?.id] || 0) >= 1
                    ? "再次提交"
                    : "提交"}
                </Text>
              </RNView>
            </TouchableOpacity>
          </RNView>

          {/* 第二行：画板按钮 */}
          <RNView style={styles.draftPaperButtonContainer}>
            <TouchableOpacity
              style={styles.draftPaperActionButton}
              onPress={onOpenDraftPaper}
            >
              <RNView style={styles.actionButtonContent}>
                <Ionicons name="create-outline" size={20} color="#666" />
                <Text style={styles.actionButtonText}>画板</Text>
              </RNView>
            </TouchableOpacity>
          </RNView>
        </RNView>
      )}
    </RNView>
  );
};

// 总结弹窗组件
const SummaryModal = ({
  visible,
  correctCount,
  totalCount,
  onRetry,
  onExit,
  isTestForUnlocking,
  shouldUnlockPreviousUnits,
}: {
  visible: boolean;
  correctCount: number;
  totalCount: number;
  onRetry: () => void;
  onExit: () => void;
  isTestForUnlocking: boolean;
  shouldUnlockPreviousUnits: boolean;
}) => {
  // 计算完成率
  const completionRate = totalCount > 0 ? correctCount / totalCount : 0;
  const isFullCompletion = completionRate >= 0.8;

  // 计算奖励积分
  // 基础积分：每题1分
  const basePoints = correctCount;

  // 额外奖励：全部答对额外2分，80%以上额外1分
  let bonusPoints = 0;
  if (correctCount === totalCount && totalCount > 0) {
    bonusPoints = 2;
  } else if (correctCount >= totalCount * 0.8 && totalCount > 0) {
    bonusPoints = 1;
  }

  // 总积分
  const totalPoints = basePoints + bonusPoints;

  // 渲染皇冠图标
  const renderCrown = () => {
    if (isFullCompletion) {
      return (
        <FontAwesome5
          name="crown"
          size={48}
          color="#FFD700"
          solid
          style={{ marginVertical: 16 }}
        />
      );
    } else if (completionRate >= 0.6) {
      return (
        <FontAwesome5
          name="crown"
          size={36}
          color="#FF9800"
          solid
          style={{ marginVertical: 16 }}
        />
      );
    }
    return null;
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onExit}
    >
      <RNView style={styles.modalOverlay}>
        <RNView style={styles.modalContent}>
          <Text style={styles.modalTitle}>练习完成！</Text>

          <RNView style={styles.summaryContainer}>
            <Text style={styles.summaryText}>本次练习总结</Text>
            <Text style={styles.summaryDetail}>
              总题数：<Text style={styles.summaryHighlight}>{totalCount}</Text>
            </Text>
            <Text style={styles.summaryDetail}>
              答对题数：
              <Text style={styles.summaryHighlight}>{correctCount}</Text>
            </Text>
            <Text style={styles.summaryDetail}>
              正确率：
              <Text style={styles.summaryHighlight}>
                {Math.round(completionRate * 100)}%
              </Text>
            </Text>

            {totalPoints > 0 && (
              <RNView style={styles.bonusPointsContainer}>
                <FontAwesome5 name="gem" size={16} color="#1CB0F6" solid />
                <RNView style={styles.pointsDetailContainer}>
                  <Text style={styles.bonusPointsText}>
                    获得积分：
                    <Text style={styles.bonusPointsValue}>{totalPoints}</Text>
                  </Text>
                  <Text style={styles.pointsBreakdown}>
                    基础积分：{basePoints}{" "}
                    {bonusPoints > 0 ? `+ 额外奖励：${bonusPoints}` : ""}
                  </Text>
                </RNView>
              </RNView>
            )}
          </RNView>

          <RNView style={styles.crownContainer}>{renderCrown()}</RNView>

          {isFullCompletion && (
            <RNView style={styles.unlockMessage}>
              <Ionicons name="checkmark-circle" size={18} color="#58CC02" />
              <Text style={styles.unlockText}>恭喜！您已解锁下一单元</Text>
            </RNView>
          )}

          {isTestForUnlocking &&
            shouldUnlockPreviousUnits &&
            completionRate >= 0.6 && (
              <RNView style={styles.unlockMessage}>
                <Ionicons name="flag" size={18} color="#FF9600" />
                <Text style={[styles.unlockText, { color: "#FF9600" }]}>
                  恭喜！您将解锁所有之前的单元
                </Text>
              </RNView>
            )}

          <RNView style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.retryButton]}
              onPress={onRetry}
            >
              <Text style={styles.modalButtonText}>重新练习</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.exitButton]}
              onPress={onExit}
            >
              <Text style={styles.modalButtonText}>完成</Text>
            </TouchableOpacity>
          </RNView>
        </RNView>
      </RNView>
    </Modal>
  );
};

// 主页面组件
export default function PracticeScreen() {
  const params = useLocalSearchParams();
  const { currentSubject } = useSubject();
  const router = useRouter();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true); // 始终显示反馈区域
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState(false);
  const [answeredExercises, setAnsweredExercises] = useState<
    Record<string, boolean>
  >({});
  const [pendingAnswer, setPendingAnswer] = useState<{
    exerciseId: string;
    optionIndex?: number;
    matchingAnswers?: number[];
    fillBlankAnswers?: string[];
  } | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
  const [practiceStartTime, setPracticeStartTime] = useState<number>(
    Date.now()
  );
  const [showDraftPaper, setShowDraftPaper] = useState(false);
  const [skippedExercises, setSkippedExercises] = useState<
    Record<string, boolean>
  >({});
  const [exerciseAttempts, setExerciseAttempts] = useState<
    Record<string, number>
  >({});
  const [showHelpForExercise, setShowHelpForExercise] = useState<
    Record<string, boolean>
  >({});
  const scrollViewRef = useRef<ScrollView>(null);
  const helpSectionRef = useRef<RNView>(null);

  // 解析解锁测试参数
  const isTestForUnlocking = params.isUnlockingTest === "true";
  const shouldUnlockPreviousUnits = params.unlockPreviousUnits === "true";

  // 从URL参数中获取单元ID和学科代码
  // 同时支持id和unitId参数，兼容两种URL参数形式
  let lessonId =
    typeof params.id === "string" && params.id.trim()
      ? params.id.trim()
      : typeof params.unitId === "string" && params.unitId.trim()
      ? params.unitId.trim()
      : "";
  // 获取学科代码参数，用于记录
  const subjectCode =
    typeof params.subject === "string" && params.subject.trim()
      ? params.subject.trim()
      : currentSubject?.code !== undefined && currentSubject?.code !== null
      ? currentSubject.code
      : "math";

  // 假定lessonId已包含学科前缀，不再需要格式化

  // 获取其他参数用于界面显示
  const unitTitle =
    typeof params.unitTitle === "string" ? params.unitTitle : "练习";
  const color = typeof params.color === "string" ? params.color : "#5EC0DE";
  const secondaryColor =
    typeof params.secondaryColor === "string" ? params.secondaryColor : color;

  // 获取练习题
  const fetchExercises = async () => {
    try {
      setLoading(true);

      // 检查必要参数
      if (!lessonId) {
        console.error("缺少必要参数：lessonId");
        throw new Error("无法加载练习题：缺少单元ID");
      }

      // 构建API URL，直接使用lessonId
      const studentId = await getCurrentStudentIdForProgress();
      const apiUrl = `${API_BASE_URL}/api/exercises/${lessonId}?userId=${studentId}&filterCompleted=true`;

      console.log("请求练习题URL:", apiUrl);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(`HTTP错误: ${response.status}`);
        throw new Error(`获取练习题失败 (HTTP ${response.status})`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        console.log(`获取到 ${result.data.length} 道练习题`);

        if (result.data.length === 0 && result.allCompleted) {
          // 所有题目都已完成
          setError("您已经完成了所有练习题！");
        } else {
          setExercises(result.data);
          setError(null);

          // 记录用户访问练习页面的次数
          try {
            // 记录练习开始时间
            setPracticeStartTime(Date.now());

            // 重要修改：直接使用课程ID(lessonId)作为进度记录的单元ID
            // 不再使用习题的unitId，因为习题可能被多个课程共享
            // 这样确保进度记录到正确的课程而不是习题的原始单元
            const actualUnitId = lessonId; // 直接使用课程ID
            setActualUnitId(actualUnitId); // 保存实际的unitId

            // 调用API增加练习次数
            const activityApiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/increment-practice/${actualUnitId}`;

            const activityResponse = await fetch(activityApiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                activityType: "practice_start", // 明确标识活动类型
                timeSpent: 0, // 开始时没有花费时间
              }),
            });

            if (activityResponse.ok) {
              console.log(
                `成功记录用户练习活动: ${actualUnitId}（课程ID: ${lessonId}）`
              );

              // 获取并保存当前单元的进度数据
              try {
                const progress = await getStudentUnitProgress(actualUnitId);
                setUnitProgress(progress);
                console.log("获取到单元进度:", progress);
              } catch (progressErr) {
                console.error("获取单元进度失败:", progressErr);
              }
            } else {
              console.warn(`记录练习活动失败: HTTP ${activityResponse.status}`);
            }
          } catch (activityError) {
            console.error("记录练习活动出错:", activityError);
            // 这里不需要向用户显示错误，因为这只是一个后台统计功能
          }
        }
      } else {
        throw new Error(result.message || "获取练习题失败: 服务器未返回数据");
      }
    } catch (error: any) {
      console.error("获取练习题出错:", error);
      setError(error.message || "获取练习题出错，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 存储学生ID用于清理函数
  const [currentStudentId, setCurrentStudentId] = useState<string>("");
  // 存储实际的unitId，用于统一进度记录
  const [actualUnitId, setActualUnitId] = useState<string>("");

  // 初始加载
  useEffect(() => {
    if (lessonId) {
      // 获取并保存学生ID
      getCurrentStudentIdForProgress().then((id) => {
        setCurrentStudentId(id);
      });
      fetchExercises();
    } else {
      setError("无法加载练习题：缺少单元ID");
      setLoading(false);
    }

    // 组件卸载时记录总练习时间
    return () => {
      const totalPracticeTime = Math.floor(
        (Date.now() - practiceStartTime) / 1000
      );
      // 仅当练习时间超过5秒时才记录
      if (totalPracticeTime > 5 && currentStudentId) {
        console.log(`用户练习了 ${totalPracticeTime} 秒`);

        // 使用保存的actualUnitId，如果没有则回退到lessonId
        const unitIdForRecord = actualUnitId !== "" ? actualUnitId : lessonId;

        // 发送最终练习时间统计
        fetch(
          `${API_BASE_URL}/api/answer-records/${currentStudentId}/increment-practice/${unitIdForRecord}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activityType: "practice_end", // 明确标识活动类型
              timeSpent: totalPracticeTime, // 使用与服务器端匹配的字段名
            }),
          }
        ).catch((err) => {
          console.error("记录最终练习时间失败:", err);
        });
      }
    };
  }, [lessonId, currentStudentId, actualUnitId]);

  // 计算正确答题数
  const getCorrectCount = () => {
    return Object.values(answeredExercises).filter((isCorrect) => isCorrect)
      .length;
  };

  // 处理答题
  const handleAnswer = (
    exerciseId: string,
    optionIndex: number,
    matchingAnswers?: number[],
    fillBlankAnswers?: string[]
  ) => {
    console.log(
      `接收到用户答案: exerciseId=${exerciseId}, optionIndex=${optionIndex}`
    );

    // 保存临时答案，等待确认
    setPendingAnswer({
      exerciseId,
      optionIndex,
      matchingAnswers,
      fillBlankAnswers,
    });
  };

  // 确认提交答案
  const submitConfirmedAnswer = async () => {
    const exercise = exercises[currentExerciseIndex];
    if (!exercise) return;

    const currentExerciseId = exercise.id;

    // 获取当前题目的尝试次数
    const currentAttempts = exerciseAttempts[currentExerciseId] || 0;

    // 如果没有待处理的答案，创建一个默认的空答案
    // 这样即使用户没有做任何选择，也能提交答案（默认为错误）
    let userAnswer: number | number[] | string[] | Record<string, string> = -1; // 默认使用-1，确保不会与任何选项索引匹配
    let hasUserSelection = false; // 标记是否有用户选择

    if (pendingAnswer && pendingAnswer.exerciseId === currentExerciseId) {
      // 如果有待处理的答案，使用用户的选择
      // 修复bug：当用户选择索引为0的选项时，由于0在逻辑或中会被视为false，导致使用后面的默认值0
      // 需要分别处理不同类型的答案，避免使用 || 运算符
      if (exercise.type === "choice") {
        // 选择题：直接使用optionIndex，即使是0也可以正确处理
        if (pendingAnswer.optionIndex !== undefined) {
          userAnswer = pendingAnswer.optionIndex;
          hasUserSelection = true;
        } else {
          // 用户未选择，使用一个肯定错误的答案
          userAnswer = exercise.correctAnswer !== -1 ? -1 : -2; // 确保与正确答案不同
        }
      } else if (
        exercise.type === "fill_blank" &&
        pendingAnswer.fillBlankAnswers
      ) {
        // 填空题：明确处理填空题答案
        userAnswer = pendingAnswer.fillBlankAnswers;
        hasUserSelection = true;
        console.log("提交填空题答案:", userAnswer);
      } else if (
        exercise.type === "matching" &&
        pendingAnswer.matchingAnswers
      ) {
        // 匹配题：将数组格式转换为对象格式
        const matchingPairs = pendingAnswer.matchingAnswers;
        const allMatched =
          Array.isArray(matchingPairs) &&
          matchingPairs.every((pair) => pair !== -1);

        if (allMatched) {
          // 将数组格式转换为对象格式
          const matchingObj: Record<string, string> = {};
          matchingPairs.forEach((rightIndex: number, leftIndex: number) => {
            if (rightIndex !== -1) {
              matchingObj[leftIndex.toString()] = rightIndex.toString();
            }
          });

          userAnswer = matchingObj;
          hasUserSelection = true;
          console.log("提交匹配题答案:", userAnswer);
        } else {
          // 如果还有未匹配的项，使用默认错误答案（空对象）
          console.log("匹配题未完全匹配，当前状态:", matchingPairs);
          userAnswer = {}; // 空对象表示没有匹配
          hasUserSelection = false;
        }
      }
    } else {
      // 如果用户没有做任何选择，使用默认答案
      console.log("用户没有选择答案，使用默认错误答案");

      // 根据题型创建默认的空答案
      if (
        exercise.type === "matching" &&
        Array.isArray(exercise.options?.left)
      ) {
        // 匹配题默认答案使用对象格式，空对象表示没有匹配
        userAnswer = {};
      } else if (
        exercise.type === "fill_blank" &&
        Array.isArray(exercise.correctAnswer)
      ) {
        // 填空题默认全部为空字符串
        userAnswer = Array(exercise.correctAnswer.length).fill("");
      } else if (exercise.type === "choice") {
        // 选择题默认使用一个肯定错误的答案
        userAnswer = exercise.correctAnswer !== -1 ? -1 : -2; // 确保与正确答案不同
      }
    }

    console.log("提交答案：", {
      exerciseId: currentExerciseId,
      exerciseType: exercise.type,
      correctAnswer: exercise.correctAnswer,
      userAnswer: userAnswer,
      hasUserSelection: hasUserSelection,
    });

    // 使用统一处理函数判断答案正确性
    // 重要修改：使用课程ID(lessonId)而不是习题的unitId，确保进度记录到正确的课程
    const isCorrect = await processAnswer(
      currentExerciseId,
      lessonId,
      exercise,
      userAnswer
    );

    // 更新尝试次数
    const newAttempts = currentAttempts + 1;
    setExerciseAttempts((prev) => ({
      ...prev,
      [currentExerciseId]: newAttempts,
    }));

    // 如果答错了
    if (!isCorrect) {
      if (newAttempts === 1) {
        // 第一次答错：显示帮助内容并滚动过去
        setShowHelpForExercise((prev) => ({
          ...prev,
          [currentExerciseId]: true,
        }));

        // 延迟滚动，确保内容已渲染
        setTimeout(() => {
          if (helpSectionRef.current) {
            helpSectionRef.current.measureLayout(
              scrollViewRef.current as any,
              (x, y) => {
                scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
              },
              () => {
                // fallback: 滚动到底部
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }
            );
          }
        }, 200);

        // 设置最后一次答题的结果
        setIsLastAnswerCorrect(false);

        // 标记已提交答案
        setHasSubmittedAnswer(true);

        // 清空待处理答案，允许用户重新选择
        setPendingAnswer(null);

        // 第一次答错不记录到答题记录中，给用户第二次机会
        return;
      } else {
        // 第二次答错：正式记录为错误
        setAnsweredExercises((prev) => ({
          ...prev,
          [currentExerciseId]: false,
        }));
      }
    } else {
      // 答对了：记录为正确
      setAnsweredExercises((prev) => ({
        ...prev,
        [currentExerciseId]: true,
      }));
    }

    // 设置最后一次答题的结果
    setIsLastAnswerCorrect(isCorrect);

    // 标记已提交答案
    setHasSubmittedAnswer(true);

    // 在清空pendingAnswer之前，先获取用户答案
    let userAnswerForServer = null;
    if (pendingAnswer && pendingAnswer.exerciseId === currentExerciseId) {
      if (exercise.type === "choice") {
        userAnswerForServer = pendingAnswer.optionIndex;
      } else if (exercise.type === "fill_blank") {
        userAnswerForServer = pendingAnswer.fillBlankAnswers;
      } else if (exercise.type === "matching") {
        // 匹配题：将数组格式转换为对象格式
        const matchingPairs = pendingAnswer.matchingAnswers;
        if (Array.isArray(matchingPairs)) {
          const matchingObj: Record<string, string> = {};
          matchingPairs.forEach((rightIndex: number, leftIndex: number) => {
            if (rightIndex !== -1) {
              matchingObj[leftIndex.toString()] = rightIndex.toString();
            }
          });
          userAnswerForServer = matchingObj;
        } else {
          userAnswerForServer = {};
        }
      }
    }

    // 如果没有用户答案，使用默认错误答案
    if (userAnswerForServer === undefined || userAnswerForServer === null) {
      if (exercise.type === "choice") {
        userAnswerForServer = -1; // 默认错误答案
      } else if (
        exercise.type === "fill_blank" &&
        Array.isArray(exercise.correctAnswer)
      ) {
        userAnswerForServer = exercise.correctAnswer.map(() => "");
      } else if (
        exercise.type === "matching" &&
        Array.isArray(exercise.options?.left)
      ) {
        userAnswerForServer = {}; // 空对象表示没有匹配
      }
    }

    // 提交答题结果到服务器，传递用户答案
    submitAnswerToServer(currentExerciseId, isCorrect, userAnswerForServer);

    // 清空待处理答案
    setPendingAnswer(null);
  };

  // 提交答题结果到服务器
  const submitAnswerToServer = async (
    exerciseId: string,
    isCorrect: boolean,
    userAnswer?: number | number[] | string[] | Record<string, string> | null
  ) => {
    try {
      // 使用新的AnswerRecord API端点
      const studentId = await getCurrentStudentIdForProgress();
      const apiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/submit`;
      const currentExercise = exercises.find((ex) => ex.id === exerciseId);

      // 计算响应时间 (秒)
      const responseTime = Math.floor(Math.random() * 10000) + 2000; // 模拟2-12秒的响应时间

      // 生成或获取会话ID
      let sessionId = sessionStorage?.getItem("currentSessionId");
      if (!sessionId) {
        sessionId =
          Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);
        sessionStorage?.setItem("currentSessionId", sessionId);
      }

      // 重要修改：使用课程ID(lessonId)而不是习题的unitId，确保进度记录到正确的课程
      const actualUnitId = lessonId;

      // 记录提交的答题结果
      console.log(
        `提交答题结果: 练习ID=${exerciseId}, 课程ID=${actualUnitId}, 习题原unitId=${currentExercise?.unitId}, 是否正确=${isCorrect}, 响应时间=${responseTime}ms`
      );

      // 创建请求体，包含丰富的答题数据
      const requestBody = {
        exerciseId,
        unitId: actualUnitId, // 使用课程ID，确保进度记录到正确的课程
        answer: userAnswer, // 只传递答案，让服务器验证
        responseTime: Math.floor(responseTime / 1000), // 转换为秒
        sessionId,
        practiceMode: isTestForUnlocking ? "unlock_test" : "normal",
        hintsUsed: 0, // 当前版本未实现提示功能
        helpRequested: false, // 当前版本未实现帮助功能
        confidence: null, // 可以后续添加用户信心度收集
        knowledgePointsViewed: [], // 可以记录用户查看的知识点
        deviceInfo: {
          platform: "mobile", // 可以通过Platform.OS获取
          userAgent: navigator?.userAgent || "unknown",
          screenSize: `${Dimensions.get("window").width}x${
            Dimensions.get("window").height
          }`,
        },
      };

      console.log("答题请求数据:", {
        exerciseId,
        answer: userAnswer,
        unitId: actualUnitId,
      });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`提交答题结果失败: HTTP ${response.status}`);
      } else {
        // 尝试获取返回数据，包含掌握度等信息
        const data = await response.json();
        if (data.success && data.data) {
          console.log("用户掌握度数据:", data.data);

          // 更新用户掌握度信息
          if (data.data.masteryLevel !== undefined) {
            setUnitProgress((prev) => {
              if (!prev)
                return {
                  ...data.data,
                  unitId: actualUnitId, // 使用课程ID
                  totalExercises: exercises.length,
                  completedExercises: getCorrectCount() + (isCorrect ? 1 : 0),
                  completionRate:
                    exercises.length > 0
                      ? (getCorrectCount() + (isCorrect ? 1 : 0)) /
                        exercises.length
                      : 0,
                  stars: 0,
                  unlockNext: false,
                };

              return {
                ...prev,
                masteryLevel: data.data.masteryLevel,
                correctCount:
                  data.data.correctCount !== undefined
                    ? data.data.correctCount
                    : prev.correctCount,
                incorrectCount:
                  data.data.incorrectCount !== undefined
                    ? data.data.incorrectCount
                    : prev.incorrectCount,
                totalAnswerCount:
                  data.data.totalAnswers !== undefined
                    ? data.data.totalAnswers
                    : prev.totalAnswerCount,
              };
            });
          }
        }
      }
    } catch (err) {
      console.error("提交答题结果出错:", err);
    }
  };

  // 处理继续按钮点击
  const handleContinue = () => {
    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) return;

    const currentExerciseId = currentExercise.id;
    const attempts = exerciseAttempts[currentExerciseId] || 0;

    // 如果是第一次答错，重置状态允许重新答题
    if (!isLastAnswerCorrect && attempts === 1) {
      setHasSubmittedAnswer(false);
      setPendingAnswer(null);
      // 滚动到顶部让用户重新答题
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    // 记录答题结束时间并计算花费时间
    const answerEndTime = Date.now();
    const timeSpent = answerEndTime - practiceStartTime;

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setHasSubmittedAnswer(false);
      // 清空待处理的答案，为下一题做准备
      setPendingAnswer(null);
    } else {
      // 最后一题，显示总结
      setShowSummary(true);
    }

    // 滚动到顶部
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // 跳过题目处理函数
  const handleSkip = async () => {
    if (!exercises[currentExerciseIndex]) return;

    const currentExercise = exercises[currentExerciseIndex];

    // 标记为跳过
    setSkippedExercises({
      ...skippedExercises,
      [currentExercise.id]: true,
    });

    // 将跳过视为回答错误
    setIsLastAnswerCorrect(false);
    setAnsweredExercises({
      ...answeredExercises,
      [currentExercise.id]: false,
    });
    setHasSubmittedAnswer(true);

    // 记录到错题本 - 跳过的题目也记录为错误
    try {
      await submitAnswerToServer(currentExercise.id, false, null);
    } catch (error) {
      console.error("记录跳过题目失败:", error);
    }
  };

  // 重新开始练习
  const handleRetry = () => {
    setShowSummary(false);
    setAnsweredExercises({});
    setSkippedExercises({});
    setExerciseAttempts({});
    setShowHelpForExercise({});
    setCurrentExerciseIndex(0);
    setHasSubmittedAnswer(false);
    setPendingAnswer(null);
  };

  // 退出练习返回学习页面
  const handleExit = async () => {
    // 检查是否为解锁测试且需要解锁之前的单元
    const correctCount = getCorrectCount();
    const totalCount = exercises.length;
    const completionRate = totalCount > 0 ? correctCount / totalCount : 0;
    const earnedStars =
      completionRate >= 0.8
        ? 3
        : completionRate >= 0.6
        ? 2
        : completionRate > 0
        ? 1
        : 0;

    // 如果这是解锁测试，并且需要解锁之前的单元，并且获得了至少1星
    if (isTestForUnlocking && shouldUnlockPreviousUnits && earnedStars >= 1) {
      try {
        // 获取当前单元ID的信息
        const parts = lessonId.split("-");
        if (parts.length === 3) {
          const currentSubject = parts[0];
          const currentMainUnit = parseInt(parts[1]);

          // 创建要解锁的单元ID列表
          let unitsToUnlock = [];

          // TODO: 在新架构下，解锁逻辑需要基于当前年级重新设计
          // 当前暂时禁用批量解锁功能，因为新架构要求必须指定年级
          console.log("批量解锁功能暂时禁用 - 需要基于年级重新设计");
        }
      } catch (error) {
        console.error("解锁前面单元失败:", error);
      }
    }

    router.replace({
      pathname: "/(tabs)",
      params: {
        refresh: Date.now().toString(),
        currentSubject: subjectCode,
      },
    });
  };

  // 保留这个函数以备后用，但在handleExit中不再调用它
  const awardPoints = async (points: number) => {
    try {
      const studentId = await getCurrentStudentIdForProgress();
      const apiUrl = `${API_BASE_URL}/api/students/${studentId}/points/add`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points,
        }),
      });

      if (response.ok) {
        console.log(`成功奖励 ${points} 积分`);
      } else {
        console.error(`奖励积分失败: HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("奖励积分出错:", err);
    }
  };

  // 当前练习题
  const currentExercise = exercises[currentExerciseIndex];

  // 计算进度
  const progress =
    exercises.length > 0 ? (currentExerciseIndex + 1) / exercises.length : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: unitTitle,
          headerBackground: () => (
            <LinearGradient
              colors={[color, secondaryColor]}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity onPress={handleExit} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowDraftPaper(true)}
              style={styles.draftPaperButton}
            >
              <Ionicons name="create-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar barStyle="light-content" backgroundColor={color} />

      {/* 进度条 */}
      <RNView style={styles.progressContainer}>
        <RNView style={styles.progressBarBackground}>
          <RNView
            style={[
              styles.progressBarFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: typeof color === "string" ? color : "#5EC0DE",
              },
            ]}
          />
        </RNView>
        <Text style={styles.progressText}>
          {currentExerciseIndex + 1} / {exercises.length}
        </Text>
      </RNView>

      {/* 内容区域 */}
      <ScrollView
        style={styles.scrollContent}
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {loading ? (
          <RNView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5EC0DE" />
            <Text style={styles.loadingText}>加载练习题...</Text>
          </RNView>
        ) : error ? (
          <RNView style={styles.errorContainer}>
            <Ionicons
              name={
                error.includes("完成了所有练习题")
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={24}
              color={error.includes("完成了所有练习题") ? "#58CC02" : "red"}
            />
            <Text
              style={[
                styles.errorText,
                error.includes("完成了所有练习题") && styles.successText,
              ]}
            >
              {error}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                error.includes("完成了所有练习题") && styles.successButton,
              ]}
              onPress={
                error.includes("完成了所有练习题") ? handleExit : fetchExercises
              }
            >
              <Text style={styles.modalButtonText}>
                {error.includes("完成了所有练习题") ? "返回课程" : "重试"}
              </Text>
            </TouchableOpacity>
          </RNView>
        ) : currentExercise ? (
          <RNView style={styles.exerciseWrapper}>
            {/* 当前练习题 */}
            <Exercise
              exercise={currentExercise}
              onAnswer={handleAnswer}
              userAnswers={
                answeredExercises.hasOwnProperty(currentExercise.id)
                  ? {
                      [currentExercise.id]:
                        answeredExercises[currentExercise.id],
                    }
                  : {}
              }
              showAnswers={showFeedback && hasSubmittedAnswer}
              isSingleMode={true}
              hideSubmitButton={true}
            />

            {/* 答题反馈 */}
            {showFeedback && (
              <ResultFeedback
                isCorrect={isLastAnswerCorrect}
                explanation={currentExercise.explanation}
                onContinue={handleContinue}
                onSubmitAnswer={submitConfirmedAnswer}
                onSkip={handleSkip}
                hasSubmitted={hasSubmittedAnswer}
                onOpenDraftPaper={() => setShowDraftPaper(true)}
                currentIndex={currentExerciseIndex}
                totalCount={exercises.length}
                exercises={exercises}
                answeredExercises={answeredExercises}
                skippedExercises={skippedExercises}
                exerciseAttempts={exerciseAttempts}
              />
            )}

            {/* 知识点区域 - 仅在第一次答错后显示 */}
            {showHelpForExercise[currentExercise.id] && (
              <RNView ref={helpSectionRef}>
                <KnowledgePointsSection
                  knowledgePoints={currentExercise.knowledgePoints}
                />
              </RNView>
            )}
          </RNView>
        ) : (
          <RNView style={styles.noExerciseContainer}>
            <Ionicons name="information-circle" size={32} color="#5EC0DE" />
            <Text style={styles.noExerciseText}>没有可用的练习题</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleExit}>
              <Text style={styles.modalButtonText}>返回课程</Text>
            </TouchableOpacity>
          </RNView>
        )}
      </ScrollView>

      {/* 总结弹窗 */}
      <SummaryModal
        visible={showSummary}
        correctCount={getCorrectCount()}
        totalCount={exercises.length}
        onRetry={handleRetry}
        onExit={handleExit}
        isTestForUnlocking={isTestForUnlocking}
        shouldUnlockPreviousUnits={shouldUnlockPreviousUnits}
      />

      {/* 草稿纸组件 */}
      <DraftPaper
        visible={showDraftPaper}
        onClose={() => setShowDraftPaper(false)}
        currentExercise={currentExercise}
      />
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
    justifyContent: "space-between",
    backgroundColor: "white",
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  backButton: {
    padding: 8,
  },
  draftPaperButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    width: 60,
    textAlign: "right",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },
  exerciseWrapper: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#ffeeee",
  },
  errorText: {
    marginVertical: 16,
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  successText: {
    color: "#58CC02",
    fontSize: 18,
    fontWeight: "600",
  },
  successButton: {
    backgroundColor: "#58CC02",
  },
  noExerciseContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  noExerciseText: {
    marginVertical: 16,
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  resultContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  feedbackHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
  },
  correctFeedbackContainer: {
    backgroundColor: "rgba(88, 204, 2, 0.1)",
  },
  incorrectFeedbackContainer: {
    backgroundColor: "rgba(255, 75, 75, 0.1)",
  },
  correctFeedbackText: {
    color: "#58CC02",
  },
  incorrectFeedbackText: {
    color: "#FF4B4B",
  },
  gentleFeedbackText: {
    color: "#FF9600",
  },
  explanationContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  correctContinueButton: {
    backgroundColor: "#58CC02",
  },
  incorrectContinueButton: {
    backgroundColor: "#FF9600",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // 总结弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  summaryContainer: {
    width: "100%",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  summaryDetail: {
    fontSize: 16,
    marginVertical: 4,
    color: "#555",
  },
  summaryHighlight: {
    fontWeight: "bold",
    color: "#5EC0DE",
  },
  crownContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  unlockMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 204, 2, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  unlockText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#58CC02",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  retryButton: {
    backgroundColor: "#5EC0DE",
  },
  exitButton: {
    backgroundColor: "#FF9600",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomActionsWrapper: {
    width: "100%",
  },
  bottomActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  draftPaperButtonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  draftPaperActionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    minWidth: 100,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressPercentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#58CC02",
  },
  submitActionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FF9600",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  bonusPointsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E6F7FF",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  bonusPointsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  bonusPointsValue: {
    fontWeight: "bold",
    color: "#1CB0F6",
  },
  pointsDetailContainer: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 8,
  },
  pointsBreakdown: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
  },
  masteryContainer: {
    marginBottom: 16,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "white",
  },
  knowledgePointsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  knowledgePointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  knowledgePointsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#444",
  },
  knowledgePointsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  knowledgePointTag: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  knowledgePointText: {
    fontSize: 13,
    color: "#495057",
    fontWeight: "500",
    marginRight: 4,
  },
  // AI讲解按钮样式
  aiExplanationContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  aiExplanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiExplanationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#444",
  },
  aiButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#f8f9fa",
  },
  aiTextButton: {
    borderColor: "#4A90E2",
  },
  aiVisualButton: {
    borderColor: "#50C878",
  },
  aiInteractiveButton: {
    borderColor: "#FF6B35",
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  // 可汗学院风格进度条样式
  khanProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 8,
    marginVertical: 8,
  },
  khanProgressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 12,
  },
  khanProgressDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  khanProgressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
    minWidth: 50,
    textAlign: "right",
  },
  progressDotContainer: {
    marginHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 24,
    minHeight: 24,
  },
});
