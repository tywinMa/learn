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
} from "react-native";
import { Text, View } from "../components/Themed";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
// TypeScript暂时忽略 expo-router 导出错误
// @ts-ignore
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { USER_ID } from "./services/progressService";
// 移除直接导入 addToErrorBook
// import { addToErrorBook } from "./services/errorBookService";

// 导入工具函数，添加新的 processAnswer 函数
import { checkAnswerCorrect, addToErrorBook, calculateCorrectCount, processAnswer } from "./utils/exerciseUtils";

// 使用与study.tsx相同的API基础URL配置
const isDevelopment = process.env.NODE_ENV === "development";
const API_BASE_URL = "http://localhost:3000"; // 直接使用绝对URL，不依赖环境判断

// 正确导入Exercise组件
import { Exercise } from "./components/Exercise";

import { useSubject } from "@/hooks/useSubject";

// 总结弹窗组件
const SummaryModal = ({
  visible,
  correctCount,
  totalCount,
  onRetry,
  onExit,
}: {
  visible: boolean;
  correctCount: number;
  totalCount: number;
  onRetry: () => void;
  onExit: () => void;
}) => {
  // 计算完成率和星星数
  const completionRate = totalCount > 0 ? correctCount / totalCount : 0;
  const earnedStars = completionRate >= 0.8 ? 3 : completionRate >= 0.6 ? 2 : completionRate > 0 ? 1 : 0;
  const isThreeStars = earnedStars === 3;
  
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

  // 渲染星星图标
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const iconName = i < earnedStars ? "star" : "star-outline";
      const iconColor = i < earnedStars ? "#FFD700" : "#C0C0C0";
      stars.push(
        <Ionicons
          key={i}
          name={iconName as any}
          size={36}
          color={iconColor}
          style={{ marginHorizontal: 8 }}
        />
      );
    }
    return stars;
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
              答对题数：<Text style={styles.summaryHighlight}>{correctCount}</Text>
            </Text>
            <Text style={styles.summaryDetail}>
              正确率：<Text style={styles.summaryHighlight}>{Math.round(completionRate * 100)}%</Text>
            </Text>
            
            {totalPoints > 0 && (
              <RNView style={styles.bonusPointsContainer}>
                <FontAwesome5 name="gem" size={16} color="#1CB0F6" solid />
                <RNView style={styles.pointsDetailContainer}>
                  <Text style={styles.bonusPointsText}>
                    获得积分：<Text style={styles.bonusPointsValue}>{totalPoints}</Text>
                  </Text>
                  <Text style={styles.pointsBreakdown}>
                    基础积分：{basePoints} {bonusPoints > 0 ? `+ 额外奖励：${bonusPoints}` : ""}
                  </Text>
                </RNView>
              </RNView>
            )}
          </RNView>

          <RNView style={styles.starsContainer}>{renderStars()}</RNView>

          {isThreeStars && (
            <RNView style={styles.unlockMessage}>
              <Ionicons name="checkmark-circle" size={18} color="#58CC02" />
              <Text style={styles.unlockText}>恭喜！您已解锁下一单元</Text>
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

// 结果反馈组件 - 显示每道题做完后的反馈
const ResultFeedback = ({
  isCorrect,
  explanation,
  onContinue,
  onSubmitAnswer,
  hasSubmitted,
}: {
  isCorrect: boolean;
  explanation?: string;
  onContinue: () => void;
  onSubmitAnswer?: () => void;
  hasSubmitted: boolean;
}) => {
  return (
    <RNView
      style={[
        styles.feedbackContainer,
        isCorrect ? styles.correctFeedbackContainer : styles.incorrectFeedbackContainer,
      ]}
    >
      {hasSubmitted ? (
        // 已提交答案，显示结果反馈
        <>
          <RNView style={styles.feedbackHeader}>
            <Ionicons
              name={isCorrect ? "checkmark-circle" : "close-circle"}
              size={32}
              color={isCorrect ? "#58CC02" : "#FF4B4B"}
            />
            <Text
              style={[styles.feedbackHeaderText, isCorrect ? styles.correctFeedbackText : styles.incorrectFeedbackText]}
            >
              {isCorrect ? "回答正确！" : "回答错误！"}
            </Text>
          </RNView>

          {explanation && (
            <RNView style={styles.explanationContainer}>
              <Text style={styles.explanationTitle}>解析：</Text>
              <Text style={styles.explanationText}>{explanation}</Text>
            </RNView>
          )}

          <TouchableOpacity
            style={[styles.continueButton, isCorrect ? styles.correctContinueButton : styles.incorrectContinueButton]}
            onPress={onContinue}
          >
            <Text style={styles.continueButtonText}>继续</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </>
      ) : (
        // 未提交答案，始终显示提交按钮
        <TouchableOpacity style={styles.confirmSubmitButton} onPress={onSubmitAnswer}>
          <Text style={styles.confirmSubmitButtonText}>提交答案</Text>
          <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}
    </RNView>
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
  const [answeredExercises, setAnsweredExercises] = useState<Record<string, boolean>>({});
  const [pendingAnswer, setPendingAnswer] = useState<{
    exerciseId: string;
    optionIndex?: number;
    matchingAnswers?: number[];
    fillBlankAnswers?: string[];
  } | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 从URL参数中获取单元ID和学科代码
// 同时支持id和unitId参数，兼容两种URL参数形式
let lessonId = typeof params.id === 'string' && params.id.trim() ? 
              params.id.trim() : 
              (typeof params.unitId === 'string' && params.unitId.trim() ? 
              params.unitId.trim() : '');
// 先使用URL参数中的学科代码，如果没有则使用全局当前学科代码
const subjectCode = typeof params.subject === 'string' && params.subject.trim() ? 
                    params.subject.trim() : currentSubject?.code || 'math';

// 处理可能的混合格式 (如 "math-1-1")
if (lessonId.includes('-') && lessonId.split('-').length > 2) {
  const parts = lessonId.split('-');
  // 如果ID中已包含学科代码，则需要提取纯单元号部分
  if (parts[0] === subjectCode) {
    // 移除学科前缀，保留单元号部分 (如 "1-1")
    lessonId = parts.slice(1).join('-');
  }
}

// 获取其他参数用于界面显示
const unitTitle = typeof params.unitTitle === 'string' ? params.unitTitle : '练习';
const color = typeof params.color === 'string' ? params.color : '#5EC0DE';

  // 获取练习题
const fetchExercises = async () => {
  try {
    setLoading(true);
    
    // 检查必要参数
    if (!lessonId) {
      console.error("缺少必要参数：lessonId");
      throw new Error("无法加载练习题：缺少单元ID");
    }
    
    // 确保subjectCode和lessonId都有效，避免发送无效的API请求
    if (!subjectCode) {
      throw new Error("无法加载练习题：缺少学科代码");
    }
    
    // 构建API URL，确保包含学科代码和lessonId
    const apiUrl = `${API_BASE_URL}/api/exercises/${subjectCode}/${lessonId}?userId=${USER_ID}&filterCompleted=true`;
    
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

  // 初始加载
  useEffect(() => {
    if (lessonId) {
      fetchExercises();
    } else {
      setError("无法加载练习题：缺少单元ID");
      setLoading(false);
    }
  }, [lessonId]);

  // 计算正确答题数
  const getCorrectCount = () => {
    return Object.values(answeredExercises).filter((isCorrect) => isCorrect).length;
  };

  // 处理答题
  const handleAnswer = (
    exerciseId: string,
    optionIndex: number,
    matchingAnswers?: number[],
    fillBlankAnswers?: string[]
  ) => {
    console.log(`接收到用户答案: exerciseId=${exerciseId}, optionIndex=${optionIndex}`);
    
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

    // 如果没有待处理的答案，创建一个默认的空答案
    // 这样即使用户没有做任何选择，也能提交答案（默认为错误）
    const currentExerciseId = exercise.id;
    let userAnswer: number | number[] | string[] = -1; // 默认使用-1，确保不会与任何选项索引匹配
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
      } else if (exercise.type === "fill_blank" && pendingAnswer.fillBlankAnswers) {
        // 填空题：明确处理填空题答案
        userAnswer = pendingAnswer.fillBlankAnswers;
        hasUserSelection = true;
        console.log("提交填空题答案:", userAnswer);
      } else if (pendingAnswer.matchingAnswers) {
        // 匹配题
        userAnswer = pendingAnswer.matchingAnswers;
        hasUserSelection = true;
      }
    } else {
      // 如果用户没有做任何选择，使用默认答案
      console.log("用户没有选择答案，使用默认错误答案");

      // 根据题型创建默认的空答案
      if (exercise.type === "matching" && Array.isArray(exercise.options?.left)) {
        // 匹配题默认全部匹配为-1（未匹配）
        userAnswer = Array(exercise.options.left.length).fill(-1);
      } else if (exercise.type === "fill_blank" && Array.isArray(exercise.correctAnswer)) {
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
      hasUserSelection: hasUserSelection
    });

    // 使用统一处理函数判断答案正确性
    const isCorrect = await processAnswer(currentExerciseId, lessonId, exercise, userAnswer);

    // 更新已答题记录
    setAnsweredExercises((prev) => ({
      ...prev,
      [currentExerciseId]: isCorrect,
    }));

    // 设置最后一次答题的结果
    setIsLastAnswerCorrect(isCorrect);

    // 标记已提交答案
    setHasSubmittedAnswer(true);

    // 提交答题结果到服务器
    submitAnswerToServer(currentExerciseId, isCorrect);

    // 清空待处理答案
    setPendingAnswer(null);
  };

  // 提交答题结果到服务器
  const submitAnswerToServer = async (exerciseId: string, isCorrect: boolean) => {
    try {
      const apiUrl = `${API_BASE_URL}/api/users/${USER_ID}/submit`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exerciseId,
          unitId: lessonId,
          isCorrect,
        }),
      });

      if (!response.ok) {
        console.error(`提交答题结果失败: HTTP ${response.status}`);
      }
    } catch (err) {
      console.error("提交答题结果出错:", err);
    }
  };

  // 处理继续按钮点击
  const handleContinue = () => {
    // 隐藏反馈内容，但保持反馈区域可见
    setHasSubmittedAnswer(false);

    // 如果有下一题，前进到下一题
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      // 如果是最后一题，显示总结
      setShowSummary(true);
    }

    // 滚动到顶部
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // 重新开始练习
  const handleRetry = () => {
    setShowSummary(false);
    setAnsweredExercises({});
    setCurrentExerciseIndex(0);
    setHasSubmittedAnswer(false);
  };

  // 退出练习返回学习页面
  const handleExit = () => {
    // 移除重复增加积分的代码，依赖服务器端的自动积分增加
    
    router.replace({
      pathname: "/study",
      params: {
        id: lessonId,
        unitTitle: unitTitle || "",
        color: color || "#5EC0DE",
        subject: subjectCode, // 确保传递学科代码
      },
    });
  };

  // 保留这个函数以备后用，但在handleExit中不再调用它
  const awardPoints = async (points: number) => {
    try {
      const apiUrl = `${API_BASE_URL}/api/users/${USER_ID}/points/add`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points
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
  const progress = exercises.length > 0 ? (currentExerciseIndex + 1) / exercises.length : 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 自定义header */}
      <RNView style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitTitle || "课后练习"}</Text>
        <RNView style={styles.placeholder} />
      </RNView>

      {/* 进度条 */}
      <RNView style={styles.progressContainer}>
        <RNView style={styles.progressBarBackground}>
          <RNView
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%`, backgroundColor: typeof color === "string" ? color : "#5EC0DE" },
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
            <Ionicons name={error.includes("完成了所有练习题") ? "checkmark-circle" : "alert-circle"} 
                    size={24} 
                    color={error.includes("完成了所有练习题") ? "#58CC02" : "red"} />
            <Text style={[
              styles.errorText, 
              error.includes("完成了所有练习题") && styles.successText
            ]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[
                styles.retryButton, 
                error.includes("完成了所有练习题") && styles.successButton
              ]} 
              onPress={error.includes("完成了所有练习题") ? handleExit : fetchExercises}>
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
                      [currentExercise.id]: answeredExercises[currentExercise.id],
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
                hasSubmitted={hasSubmittedAnswer}
              />
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
  correctFeedbackContainer: {
    backgroundColor: "rgba(88, 204, 2, 0.1)",
  },
  incorrectFeedbackContainer: {
    backgroundColor: "rgba(255, 75, 75, 0.1)",
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
  correctFeedbackText: {
    color: "#58CC02",
  },
  incorrectFeedbackText: {
    color: "#FF4B4B",
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
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
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
  // 确认提交样式
  confirmSubmitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9600",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  confirmSubmitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
});
