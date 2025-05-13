import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { ScrollView } from "react-native";
import { processAnswer } from "../utils/exerciseUtils";
import { USER_ID } from "../services/progressService";

// API基础URL - 根据环境选择不同的URL
const isDevelopment = process.env.NODE_ENV === "development";
const API_BASE_URL = "http://101.126.135.102:3000"; // 直接使用固定URL

/**
 * 学习页面业务逻辑Hook
 */
export function useStudy(lessonId: string, subjectCode: string = "math") {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | number[] | string[] | boolean>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const allAnswered = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // 加载练习题
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        // 调试日志
        console.log(`开始加载${lessonId}单元的练习题列表`);

        // 构建API URL，假定lessonId已包含学科前缀
        const apiUrl = `${API_BASE_URL}/api/exercises/${lessonId}`;

        console.log(`API URL: ${apiUrl}`);

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP 错误: ${response.status}`);
        }

        const data = await response.json();
        console.log(`成功获取到${data.data ? data.data.length : 0}道练习题`);

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setExercises(data.data);
        } else if (data.success && data.data && data.data.length === 0 && data.allCompleted) {
          console.log("所有练习题已完成");
          setExercises([]);
          setError("所有练习题已完成!");
        } else if (Array.isArray(data) && data.length > 0) {
          // 兼容旧的API格式，直接返回数组
          setExercises(data);
        } else {
          console.log("服务器返回的练习题为空数组或无效数据");
          setExercises([]);
          setError("没有找到练习题");
        }
      } catch (err: any) {
        console.error("加载练习题失败:", err.message);
        setError(`加载练习题失败: ${err.message}`);
        Alert.alert("错误", `无法加载练习题: ${err.message}`);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchExercises();
    }
  }, [lessonId]);

  // 检查是否所有题目都已回答
  const checkAllAnswered = (currentAnswers: Record<string, number | number[] | string[] | boolean>) => {
    if (allAnswered.current) return; // 如果已经显示过总结，不再重复显示

    const answeredCount = Object.keys(currentAnswers).length;
    if (answeredCount === exercises.length && exercises.length > 0) {
      // 计算正确答案数量
      let correct = 0;
      exercises.forEach((exercise) => {
        if (currentAnswers[exercise.id] === true) {
          correct++;
        }
      });

      setCorrectCount(correct);
      allAnswered.current = true;
    }
  };

  // 处理用户回答
  const handleAnswer = async (
    exerciseId: string,
    optionIndex: number,
    matchingAnswers?: number[],
    fillBlankAnswers?: string[]
  ) => {
    // 调试日志
    console.log(`接收到答案提交: ${exerciseId}`, { optionIndex, matchingAnswers, fillBlankAnswers });

    // 获取当前练习题
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    // 统一使用工具函数处理答题结果
    const userAnswer = fillBlankAnswers || matchingAnswers || optionIndex;
    const isCorrect = await processAnswer(exerciseId, lessonId, exercise, userAnswer);

    // 更新本地状态 - 保存用户答案和正确性状态
    const newAnswers = {
      ...userAnswers,
      // 将答题结果保存为布尔值，方便 Exercise 组件直接使用
      [exerciseId]: isCorrect,
    };

    console.log("更新后的userAnswers状态:", newAnswers);
    setUserAnswers(newAnswers);

    // 检查是否所有题目都已回答
    checkAllAnswered(newAnswers);

    // 提交答题结果到服务器
    try {
      const apiUrl = `${API_BASE_URL}/api/users/${USER_ID}/submit`;
      console.log("提交答题结果:", {
        exerciseId,
        unitId: lessonId,
        isCorrect,
        answerType: exercise.type || "choice",
        answerValue: userAnswer,
      });

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
      } else {
        // 检查是否是最后一个答案，且所有答案都正确
        const allAnswered = Object.keys(newAnswers).length === exercises.length;
        if (allAnswered) {
          // 计算所有答题是否都正确
          const allCorrect = exercises.every((ex) => newAnswers[ex.id] === true);

          if (allCorrect) {
            console.log("所有答案都正确，强制更新星星数量");
            // 额外API调用来强制更新进度
            updateProgress();
          }
        }
      }
    } catch (err) {
      console.error("提交答题结果出错:", err);
    }
  };

  // 更新学习进度
  const updateProgress = async () => {
    try {
      // 直接使用lessonId，假定已包含学科前缀
      const apiUrl = `${API_BASE_URL}/api/users/${USER_ID}/progress`;
      console.log(`更新进度: 单元ID=${lessonId}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unitId: lessonId,
          completed: true,
        }),
      });

      if (!response.ok) {
        console.error(`更新进度失败: HTTP ${response.status}`);
      } else {
        console.log("进度更新成功");
        // 更新用户星星数
        refreshUserPoints();
      }
    } catch (err) {
      console.error("更新进度出错:", err);
    }
  };

  // 刷新用户星星数
  const refreshUserPoints = async () => {
    try {
      const points = await fetch(`${API_BASE_URL}/api/users/${USER_ID}/points`).then((res) => res.json());
      setUserPoints(points.total || 0);
    } catch (err) {
      console.error("获取用户积分失败:", err);
    }
  };

  // 添加交卷处理函数
  const handleSubmit = () => {
    console.log("handleSubmit 执行开始");
    console.log("当前答题状态:", userAnswers);
    console.log("题目数量:", exercises.length);

    setShowAnswers(true); // 显示所有答案
    console.log("setShowAnswers 设置为true");

    // 滚动到顶部
    setTimeout(() => {
      console.log("尝试滚动到顶部");
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
        console.log("滚动到顶部成功");
      } else {
        console.log("scrollViewRef.current 为 null");
      }
    }, 100);

    // 计算正确答案数量
    let correct = 0;
    exercises.forEach((exercise) => {
      if (userAnswers[exercise.id] === true) {
        correct++;
      }
    });

    setCorrectCount(correct);

    // 如果所有题目都回答正确，更新进度
    const allCorrect = correct === exercises.length && exercises.length > 0;
    if (allCorrect) {
      updateProgress();
    }

    // 延迟显示总结弹窗
    setTimeout(() => {
      setShowSummary(true);
    }, 3000); // 给用户3秒时间浏览答案后再显示总结
  };

  // 重做练习
  const handleRetry = () => {
    setShowSummary(false);
    setShowAnswers(false);
    setUserAnswers({});
    allAnswered.current = false;

    // 滚动到顶部
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }

    // 重置答题进度
    setCorrectCount(0);
  };

  return {
    exercises,
    loading,
    error,
    userAnswers,
    showAnswers,
    correctCount,
    showSummary,
    userPoints,
    scrollViewRef,
    handleAnswer,
    handleSubmit,
    handleRetry,
    setShowSummary,
    updateProgress,
  };
}
