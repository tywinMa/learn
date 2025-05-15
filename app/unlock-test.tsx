import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/constants/apiConfig";
import { USER_ID } from "./services/progressService"; // Assuming unlock-test.tsx is in app/ and services is in app/services/
import { LinearGradient } from "expo-linear-gradient";

// Define types for cleaner code
interface Question {
  id: string;
  unitId: string; // This might refer to the simple unit code like '1-1' or full 'math-1-1'
  question: string;
  options?: string[];
  type: "choice" | "fill_blank" | "matching" | "application" | string; // Add other types as needed
  correctAnswer: any;
  completed?: boolean; // Added completed field
  // Add other question properties as needed
}

interface UnitInfo {
  id: string; // Composite ID, e.g., "math-1-1"
  unitCode: string; // Unit's own code, e.g., "1-1"
  title: string;
  level: number;
  order: number;
}

// Helper function for promise timeout
const withTimeout = <T,>(promise: Promise<T>, ms: number, timeoutError = new Error("Operation timed out")) => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(timeoutError);
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const UnlockTestScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    targetUnitId, // e.g., "math-2-3"
    startUnitIdForTestRange, // e.g., "math-1-1"
    subjectCode, // e.g., "math"
    unitTitle, // Title for the header, can be the target unit's title
    color, // Primary color for styling
    secondaryColor, // Secondary color for styling
  } = params as {
    targetUnitId: string;
    startUnitIdForTestRange: string;
    subjectCode: string;
    unitTitle: string;
    color: string;
    secondaryColor: string;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allUnitsInRange, setAllUnitsInRange] = useState<UnitInfo[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [testFinished, setTestFinished] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all units for the subject to determine the exact range.
  // 2. Filter units from startUnitIdForTestRange to targetUnitId.
  // 3. Fetch questions for these units.
  useEffect(() => {
    const fetchTestDetails = async () => {
      if (!startUnitIdForTestRange || !targetUnitId || !subjectCode) {
        setError("缺少必要的参数来加载测试。");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const unitsResponsePromise = fetch(`${API_BASE_URL}/api/subjects/${subjectCode}/units`);
        const unitsResponse = await withTimeout(unitsResponsePromise, 15000, new Error("获取单元列表超时。"));

        if (!unitsResponse.ok) {
          throw new Error(`获取学科单元失败 (HTTP ${unitsResponse.status})`);
        }
        const unitsResult = await unitsResponse.json();
        if (!unitsResult.success || !Array.isArray(unitsResult.data)) {
          throw new Error("获取学科单元数据格式不正确或失败。");
        }

        const allSubjectUnitsFromApi: any[] = unitsResult.data;

        const mappedUnits: UnitInfo[] = allSubjectUnitsFromApi.map((u: any) => ({
          id: `${subjectCode}-${u.code}`,
          unitCode: u.code,
          title: u.title,
          level: u.level,
          order: u.order,
        }));

        mappedUnits.sort((a, b) => {
          if (a.level !== b.level) return a.level - b.level;
          return a.order - b.order;
        });

        const startIndex = mappedUnits.findIndex((u) => u.id === startUnitIdForTestRange);
        const endIndex = mappedUnits.findIndex((u) => u.id === targetUnitId);

        if (startIndex === -1) {
          console.error(
            "Start unit for test range not found in fetched units:",
            startUnitIdForTestRange,
            mappedUnits.map((u) => u.id)
          );
          throw new Error(`起始单元 (${startUnitIdForTestRange}) 未在学科单元列表中找到。`);
        }
        if (endIndex === -1) {
          console.error(
            "Target unit for test not found in fetched units:",
            targetUnitId,
            mappedUnits.map((u) => u.id)
          );
          throw new Error(`目标单元 (${targetUnitId}) 未在学科单元列表中找到。`);
        }
        if (startIndex > endIndex) {
          console.error("Start index is greater than end index for test range:", {
            startUnitIdForTestRange,
            targetUnitId,
            startIndex,
            endIndex,
          });
          throw new Error("无法确定有效的测试单元范围：起始位置在结束位置之后。");
        }

        const unitsForTest = mappedUnits.slice(startIndex, endIndex + 1);
        setAllUnitsInRange(unitsForTest);

        if (unitsForTest.length === 0) {
          setQuestions([]);
          setError("在指定范围内没有找到可测试的单元。");
          setIsLoading(false); // Added this line to stop loading if no units
          return;
        }

        const fetchedQuestions: Question[] = [];
        for (const unit of unitsForTest) {
          const qResponsePromise = fetch(
            `${API_BASE_URL}/api/exercises/${subjectCode}/${unit.unitCode}?userId=${USER_ID}`
          );
          const qResponse = await withTimeout(
            qResponsePromise,
            10000,
            new Error(`获取单元 ${unit.unitCode} 题目超时。`)
          );

          if (qResponse.ok) {
            const qResult = await qResponse.json();
            if (qResult.success && qResult.data) {
              const unitQuestions = qResult.data.filter((q: Question) => !q.completed).slice(0, 1);
              if (unitQuestions.length === 0 && qResult.data.length > 0) {
                unitQuestions.push(qResult.data[0]);
              }
              fetchedQuestions.push(...unitQuestions.map((q: Question) => ({ ...q, unitId: unit.id })));
            }
          } else {
            console.warn(`获取单元 ${unit.id} (code: ${unit.unitCode}) 的题目失败 (HTTP ${qResponse.status})`);
          }
        }

        setQuestions(fetchedQuestions);
        if (fetchedQuestions.length === 0) {
          setError("未能抽取到该范围的题目。请确认这些单元有题目并且您尚未完成它们。");
        }
      } catch (err: any) {
        console.error("加载解锁测试题目出错:", err);
        setError(err.message || "加载题目时发生未知错误。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestDetails();
  }, [targetUnitId, startUnitIdForTestRange, subjectCode]);

  const handleAnswer = (questionId: string, answer: any) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitTest = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (q.type === "choice") {
        const userAnswerIndex = parseInt(userAnswers[q.id], 10);
        if (userAnswerIndex === q.correctAnswer) {
          correctCount++;
        }
      }
    });
    setCorrectAnswersCount(correctCount);
    setTestFinished(true);

    if (correctCount > 0 && allUnitsInRange.length > 0) {
      unlockUnits();
    } else {
      const message =
        correctCount === 0 && questions.length > 0
          ? `您答对了 ${correctCount} 道题。请再接再厉！`
          : "测试完成。未能解锁新的单元。";
      Alert.alert("测试结果", message, [
        {
          text: "返回主页",
          onPress: () =>
            router.replace({
              pathname: "/(tabs)",
              params: { refresh: Date.now().toString(), currentSubject: subjectCode },
            }),
        },
      ]);
      setIsLoading(false);
    }
  };

  const unlockUnits = async () => {
    setIsLoading(true);
    try {
      let unitsToActuallyUnlock = [...allUnitsInRange];
      if (
        unitsToActuallyUnlock.length > 0 &&
        unitsToActuallyUnlock[unitsToActuallyUnlock.length - 1].id === targetUnitId
      ) {
        unitsToActuallyUnlock.pop();
      }
      const unitIdsToUnlock = unitsToActuallyUnlock.map((u) => u.id);

      console.log("Target Unit ID (clicked, NOT to be unlocked by this test):", targetUnitId);
      console.log("Attempting to unlock unit IDs (up to unit BEFORE target):", JSON.stringify(unitIdsToUnlock));

      if (unitIdsToUnlock.length === 0) {
        Alert.alert("提示", "没有需要通过本次测试解锁的先前单元。目标单元仍需单独学习。", [
          {
            text: "好的",
            onPress: () => {
              router.replace({
                pathname: "/(tabs)",
                params: { refresh: Date.now().toString(), currentSubject: subjectCode },
              });
            },
          },
        ]);
        return;
      }

      const fetchPromise = fetch(`${API_BASE_URL}/api/units/batch-unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitIds: unitIdsToUnlock, userId: USER_ID }),
      });

      const response = await withTimeout(fetchPromise, 20000, new Error("批量解锁请求超时。"));
      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert(
          "恭喜!",
          `您已成功解锁 ${result.data?.unlocked?.length || 0} 个新单元！它们现在可以学习了（星星为0）。`,
          [
            {
              text: "太棒了!",
              onPress: () => {
                router.replace({
                  pathname: "/(tabs)",
                  params: { refresh: Date.now().toString(), currentSubject: subjectCode },
                });
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || "批量解锁单元失败。请检查服务端日志。");
      }
    } catch (err: any) {
      console.error("解锁单元失败:", err);
      let displayMessage = "无法解锁单元，请稍后重试。";
      if (err.message) {
        displayMessage = err.message.includes("超时") ? err.message : `发生错误: ${err.message.substring(0, 100)}`;
      }
      Alert.alert("解锁失败", displayMessage, [
        {
          text: "返回主页",
          onPress: () => {
            router.replace({
              pathname: "/(tabs)",
              params: { refresh: Date.now().toString(), currentSubject: subjectCode },
            });
          },
        },
      ]);
    } finally {
      setIsLoading(false);
      console.log("unlockUnits finally block: setIsLoading(false) called.");
    }
  };

  const renderQuestion = (question: Question) => {
    // Basic choice question rendering. Extend for other types.
    if (question.type === "choice" && question.options) {
      return (
        <View key={question.id} style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.question}</Text>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, userAnswers[question.id] === index.toString() && styles.selectedOption]}
              onPress={() => handleAnswer(question.id, index.toString())}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return <Text key={question.id}>题目类型尚不支持: {question.type}</Text>;
  };

  if (isLoading && questions.length === 0 && !error && !testFinished) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={color || Colors.light.tint} />
        <Text style={{ marginTop: 10, color: color || Colors.light.text }}>加载测试题中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>加载测试失败: {error}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: color || Colors.light.tint }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (questions.length === 0 && !isLoading && !testFinished) {
    return (
      <View style={styles.centered}>
        <Ionicons name="information-circle-outline" size={48} color={color || Colors.light.text} />
        <Text style={styles.errorText}>{error || "没有可供测试的题目。"}</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: color || Colors.light.tint }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: unitTitle || "解锁测试",
          headerBackground: () => (
            <LinearGradient
              colors={color && secondaryColor ? [color, secondaryColor] : ["#6e48eb", "#4b2c9a"]}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
          headerTintColor: "#fff",
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 15 }}
              onPress={() => {
                if (testFinished && !isLoading) {
                  router.replace({
                    pathname: "/(tabs)",
                    params: { refresh: Date.now().toString(), currentSubject: subjectCode },
                  });
                } else if (!isLoading) {
                  Alert.alert("退出测试?", "您确定要退出测试吗？当前进度将不会保存。", [
                    { text: "取消", style: "cancel" },
                    { text: "退出", style: "destructive", onPress: () => router.back() },
                  ]);
                }
              }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoading && (testFinished || (questions.length > 0 && !error)) ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={color || Colors.light.tint} />
            <Text style={{ marginTop: 10, color: color || Colors.light.text }}>
              {testFinished ? "处理结果中..." : "加载中..."}
            </Text>
          </View>
        ) : !testFinished && currentQ && !error ? (
          <>
            <Text style={styles.progressText}>
              题目 {currentQuestionIndex + 1} / {questions.length}
            </Text>
            {renderQuestion(currentQ)}
            <View style={styles.navigationButtons}>
              {currentQuestionIndex > 0 && (
                <TouchableOpacity
                  style={[styles.button, styles.navButton, { backgroundColor: secondaryColor || "#8a6df2" }]}
                  onPress={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>上一题</Text>
                </TouchableOpacity>
              )}
              {currentQuestionIndex < questions.length - 1 ? (
                <TouchableOpacity
                  style={[styles.button, styles.navButton, { backgroundColor: color || Colors.light.tint }]}
                  onPress={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>下一题</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.navButton, { backgroundColor: color || Colors.light.tint }]}
                  onPress={handleSubmitTest}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>完成测试</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : testFinished && !isLoading && !error ? (
          <View style={styles.centered}>
            <Text style={styles.resultTitle}>测试完成!</Text>
            <Text style={styles.resultText}>
              您答对了 {correctAnswersCount} 道题 (共 {questions.length} 道)。
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: color || Colors.light.tint, marginTop: 20 }]}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)",
                  params: { refresh: Date.now().toString(), currentSubject: subjectCode },
                })
              }
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>返回主页</Text>
            </TouchableOpacity>
          </View>
        ) : (
          !error && (
            <View style={styles.centered}>
              <Text style={styles.errorText}>题目加载完毕，但无法显示当前题目或结果。</Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: color || Colors.light.tint }]}
                onPress={() => router.back()}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>返回</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

// Import Colors if not already (e.g. from ../constants/Colors)
const Colors = {
  light: {
    text: "#000",
    background: "#fff",
    tint: "#2f95dc", // Default tint color
    // ... other colors
  },
  dark: {
    // ... dark mode colors
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1, // Ensure content can be centered if it's small
  },
  centered: {
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
  questionContainer: {
    marginBottom: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  optionButton: {
    backgroundColor: "#e9e9e9",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: "#d0e0ff", // A light blue for selected
    borderColor: "#4a71d3",
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    color: "#333",
  },
  progressText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  navButton: {
    marginHorizontal: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  resultText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
});

export default UnlockTestScreen;
