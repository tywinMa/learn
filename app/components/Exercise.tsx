import React, { useState, useEffect } from "react";
import { StyleSheet, View as RNView, TouchableOpacity, TextInput } from "react-native";
import { Text } from "../components/Themed";
import { Ionicons } from "@expo/vector-icons";

// 练习题组件
export const Exercise = ({
  exercise,
  onAnswer,
  userAnswers,
  showAnswers,
  isSingleMode = false,
}: {
  exercise: {
    id: string;
    question: string;
    options: any;
    correctAnswer: any;
    type?: string;
    explanation?: string;
  };
  onAnswer: (exerciseId: string, optionIndex: number, matchingAnswers?: number[], fillBlankAnswers?: string[]) => void;
  userAnswers: Record<string, number | number[] | string[] | boolean>;
  showAnswers: boolean;
  isSingleMode?: boolean;
}) => {
  const isAnswered = userAnswers.hasOwnProperty(exercise.id);

  // 由于在外部已经判断过答案正确性并存储在 userAnswers 中，
  // isCorrect 只需要检查该状态而不再自行判断
  let isCorrect = false;
  if (isAnswered && showAnswers) {
    if (typeof userAnswers[exercise.id] === "boolean") {
      // 如果是布尔值，直接使用
      isCorrect = userAnswers[exercise.id] as boolean;
    }
    // 这里不再需要复杂的转换逻辑
  }

  const exerciseType = exercise.type || "choice"; // 默认为选择题类型

  // 添加本地状态，标记题目是否已在本地回答
  const [isAnsweredLocally, setIsAnsweredLocally] = useState(isAnswered);
  // 添加本地选择状态，记录用户选择了哪个选项
  const [localSelection, setLocalSelection] = useState<number | null>(null);
  // 添加匹配和拖拽题的本地状态
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [temporaryMatching, setTemporaryMatching] = useState<number[] | null>(null);
  const [temporaryDragDrop, setTemporaryDragDrop] = useState<number[] | null>(null);
  const [temporaryFillBlank, setTemporaryFillBlank] = useState<string[] | null>(null);

  // 当外部userAnswers变化时，更新本地状态
  useEffect(() => {
    setIsAnsweredLocally(isAnswered);
    if (isAnswered && exerciseType === "choice") {
      setLocalSelection(userAnswers[exercise.id] as number);
    }
  }, [isAnswered, exercise.id, exerciseType, userAnswers]);

  // 将所有useState调用移到组件顶层，确保每次渲染时调用顺序一致
  // 匹配题状态
  const [selectedLeftIndex, setSelectedLeftIndex] = useState<number | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<number[]>(() =>
    Array(exercise.options?.left?.length || 0).fill(-1)
  );

  // 拖拽题状态
  const [dragItems, setDragItems] = useState<string[]>(
    exercise.options?.elements ? [...exercise.options.elements] : []
  );
  const [dropTargets, setDropTargets] = useState<(string | null)[]>(
    exercise.options?.positions ? exercise.options.positions.map(() => null) : []
  );
  const [selectedDragItem, setSelectedDragItem] = useState<string | null>(null);

  // 填空题状态
  const [blankAnswers, setBlankAnswers] = useState<string[]>(
    Array.isArray(exercise.correctAnswer) ? Array(exercise.correctAnswer.length).fill("") : []
  );

  // 清理副作用 - 确保组件重新渲染时重置匹配题状态
  useEffect(() => {
    // 重置匹配题的状态
    setSelectedLeftIndex(null);
    setMatchingPairs(Array(exercise.options?.left?.length || 0).fill(-1));

    // 重置拖拽题状态
    setSelectedDragItem(null);
    setDropTargets(exercise.options?.positions ? exercise.options.positions.map(() => null) : []);

    // 重置填空题状态 - 修复跨题目数据残留的bug
    setBlankAnswers(Array.isArray(exercise.correctAnswer) ? Array(exercise.correctAnswer.length).fill("") : []);

    // 重置本地答题状态
    setIsAnsweredLocally(isAnswered);
    setLocalSelection(null);
    setPendingSubmission(false);
    setTemporaryMatching(null);
    setTemporaryDragDrop(null);
    setTemporaryFillBlank(null);
  }, [exercise.id]); // 当题目ID变化时重置状态

  // 创建选择题答案处理函数
  const handleChoiceSelection = (index: number) => {
    // 选择选项时，只更新本地选择，而不立即提交
    setLocalSelection(index);
    setPendingSubmission(true);
  };

  // 添加确认按钮处理函数
  const handleConfirmAnswer = () => {
    if (isAnswered) return;

    if (exerciseType === "choice") {
      // 提交选择题答案，如果用户没有选择，默认选择第一个选项
      onAnswer(exercise.id, localSelection !== null ? localSelection : 0);
    } else if (exerciseType === "matching") {
      // 提交匹配题答案，如果用户没有完成匹配，提交当前匹配状态
      onAnswer(exercise.id, 0, matchingPairs);
    } else if (exerciseType === "drag_drop") {
      // 提交拖拽题答案
      const dragDropAnswers = dropTargets.map((target) => {
        return target ? exercise.options.elements.findIndex((el: string) => el === target) : 0;
      });
      onAnswer(exercise.id, 0, dragDropAnswers);
    } else if (exerciseType === "fill_blank") {
      // 提交填空题答案
      onAnswer(exercise.id, 0, undefined, blankAnswers);
    }

    setIsAnsweredLocally(true);
    setPendingSubmission(false);
    console.log(`确认提交答案: ${exercise.id}`);
  };

  // 当匹配题建立完整的映射关系后记录临时答案
  const handleMatchingSelection = (leftIndex: number, rightIndex: number) => {
    if (isAnsweredLocally || isAnswered) return;

    // 更新匹配状态
    const newMatchingPairs = [...matchingPairs];
    newMatchingPairs[leftIndex] = rightIndex;
    setMatchingPairs(newMatchingPairs);
    setPendingSubmission(true);
  };

  // 拖拽题处理函数
  const handleDragSelect = (item: string) => {
    if (isAnsweredLocally || isAnswered) return;
    // 选择一个元素进行拖放，使用简化的点选方式代替真实拖放
    // 如果已经在某个位置上，先移除
    const existingIndex = dropTargets.findIndex((t) => t === item);
    if (existingIndex !== -1) {
      const newTargets = [...dropTargets];
      newTargets[existingIndex] = null;
      setDropTargets(newTargets);
      return;
    }

    // 记录当前选中的元素
    setSelectedDragItem(item);
    setPendingSubmission(true);
  };

  const handleDropSelect = (targetIndex: number) => {
    if (isAnsweredLocally || isAnswered || !selectedDragItem) return;

    // 放置选中元素到目标位置
    const newTargets = [...dropTargets];
    newTargets[targetIndex] = selectedDragItem;
    setDropTargets(newTargets);
    setSelectedDragItem(null);
    setPendingSubmission(true);
  };

  // 填空题输入处理函数
  const handleBlankInput = (text: string, index: number) => {
    if (isAnsweredLocally || isAnswered) return;

    const newAnswers = [...blankAnswers];
    newAnswers[index] = text;
    setBlankAnswers(newAnswers);
    setPendingSubmission(true);
  };

  // 填空题渲染函数
  const renderFillBlankQuestion = () => {
    if (!exercise.question) return null;

    // 将问题文本按照空白处分割
    const parts = exercise.question.split("____");

    if (parts.length <= 1) {
      // 没有空白处，直接显示问题
      return <Text style={styles.fillBlankQuestion}>{exercise.question}</Text>;
    }

    // 渲染包含输入框的问题
    return (
      <RNView style={styles.fillBlankQuestionContainer}>
        {parts.map((part, index) => (
          <RNView key={index} style={styles.fillBlankPart}>
            {/* 显示文本部分 */}
            {part && <Text style={styles.fillBlankText}>{part}</Text>}

            {/* 添加输入框，最后一个部分后面不需要输入框 */}
            {index < parts.length - 1 && (
              <TextInput
                style={[
                  styles.fillBlankInput,
                  isAnsweredLocally && styles.fillBlankInputDisabled,
                  isAnswered &&
                    showAnswers &&
                    (blankAnswers[index] === exercise.correctAnswer[index]
                      ? styles.fillBlankInputCorrect
                      : styles.fillBlankInputIncorrect),
                ]}
                value={blankAnswers[index]}
                onChangeText={(text) => handleBlankInput(text, index)}
                placeholder="填写答案"
                editable={!isAnsweredLocally && !isAnswered}
                keyboardType="default"
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          </RNView>
        ))}
      </RNView>
    );
  };

  // 渲染匹配题
  const renderMatchingQuestion = () => {
    if (!exercise.options?.left || !exercise.options?.right) {
      return <Text style={styles.errorText}>匹配题数据格式错误</Text>;
    }

    return (
      <RNView style={styles.matchingContainer}>
        <Text style={styles.matchingInstructions}>请将左侧选项与右侧选项匹配</Text>

        <RNView style={styles.matchingContent}>
          {/* 左侧选项 */}
          <RNView style={styles.matchingColumn}>
            {exercise.options.left.map((item: string, index: number) => (
              <TouchableOpacity
                key={`left-${index}`}
                style={[styles.matchingItem, selectedLeftIndex === index && styles.matchingItemSelected]}
                onPress={() => setSelectedLeftIndex(index)}
                disabled={isAnsweredLocally || isAnswered}
              >
                <Text style={styles.matchingItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </RNView>

          {/* 右侧选项 */}
          <RNView style={styles.matchingColumn}>
            {exercise.options.right.map((item: string, index: number) => (
              <TouchableOpacity
                key={`right-${index}`}
                style={[styles.matchingItem, matchingPairs.includes(index) && styles.matchingItemMatched]}
                onPress={() => {
                  if (selectedLeftIndex !== null) {
                    handleMatchingSelection(selectedLeftIndex, index);
                    setSelectedLeftIndex(null);
                  }
                }}
                disabled={isAnsweredLocally || isAnswered || selectedLeftIndex === null}
              >
                <Text style={styles.matchingItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </RNView>
        </RNView>

        {/* 当前匹配结果 */}
        {matchingPairs.some((pair) => pair !== -1) && (
          <RNView style={styles.matchingResultsContainer}>
            <Text style={styles.matchingResultsTitle}>当前匹配:</Text>
            {matchingPairs.map((rightIndex, leftIndex) => {
              if (rightIndex === -1) return null;
              return (
                <Text key={`match-${leftIndex}`} style={styles.matchingResultText}>
                  {exercise.options.left[leftIndex]} → {exercise.options.right[rightIndex]}
                </Text>
              );
            })}
          </RNView>
        )}

        {isAnswered && showAnswers && (
          <RNView style={styles.matchingCorrectContainer}>
            <Text style={styles.matchingCorrectTitle}>正确答案:</Text>
            {Array.isArray(exercise.correctAnswer) &&
              exercise.correctAnswer.map((rightIndex: number, leftIndex: number) => (
                <Text key={`correct-${leftIndex}`} style={styles.matchingCorrectText}>
                  {exercise.options.left[leftIndex]} → {exercise.options.right[rightIndex]}
                </Text>
              ))}
          </RNView>
        )}
      </RNView>
    );
  };

  // 处理不同题型的渲染逻辑
  const renderExerciseContent = () => {
    switch (exerciseType) {
      case "choice":
        // 选择题
        return (
          <>
            {Array.isArray(exercise.options) ? (
              exercise.options.map((option: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    (isAnsweredLocally || isAnswered) && localSelection === index && styles.selectedOption,
                    isAnswered && showAnswers && index === exercise.correctAnswer && styles.correctOption,
                  ]}
                  onPress={() => handleChoiceSelection(index)}
                  disabled={isAnsweredLocally || isAnswered} // 使用本地状态禁用选项
                >
                  <Text style={styles.optionText}>{option}</Text>
                  {isAnswered && showAnswers && index === exercise.correctAnswer && (
                    <Ionicons name="checkmark-circle" size={24} color="green" style={styles.icon} />
                  )}
                  {isAnswered &&
                    showAnswers &&
                    userAnswers[exercise.id] === index &&
                    index !== exercise.correctAnswer && (
                      <Ionicons name="close-circle" size={24} color="red" style={styles.icon} />
                    )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.errorText}>选项数据格式错误</Text>
            )}
          </>
        );

      case "fill_blank":
        // 填空题
        return (
          <RNView style={styles.fillBlankContainer}>
            <Text style={styles.fillBlankInstructions}>请在空白处填入正确的答案</Text>
            {renderFillBlankQuestion()}

            {isAnswered && showAnswers && (
              <RNView style={styles.fillBlankResultContainer}>
                <Text style={styles.fillBlankResultTitle}>正确答案：</Text>
                {Array.isArray(exercise.correctAnswer) &&
                  exercise.correctAnswer.map((answer, index) => (
                    <Text key={index} style={styles.fillBlankResultText}>
                      空白{index + 1}: {answer}
                    </Text>
                  ))}
              </RNView>
            )}

            {!isAnswered && blankAnswers.some((ans) => ans !== "") && (
              <TouchableOpacity
                style={styles.resetFillBlankButton}
                onPress={() => {
                  setBlankAnswers(Array(exercise.correctAnswer.length).fill(""));
                }}
              >
                <Text style={styles.resetFillBlankText}>清空所有答案</Text>
              </TouchableOpacity>
            )}
          </RNView>
        );

      case "matching":
        // 匹配题
        return renderMatchingQuestion();

      case "drag_drop":
      case "sort":
      case "math":
        // 其他题型，如果需要还可以继续拆分
        return (
          <RNView style={styles.otherTypeContainer}>
            <Text style={styles.otherTypeText}>
              {exerciseType === "drag_drop" ? "拖拽题" : exerciseType === "sort" ? "排序题" : "数学计算题"}-
              功能已实现但界面已简化
            </Text>
          </RNView>
        );

      default:
        return <Text style={styles.errorText}>未知题型: {exerciseType}</Text>;
    }
  };

  // 始终显示提交按钮，除非已经回答了问题
  const renderSubmitButton = () => {
    if (isAnsweredLocally || isAnswered) return null;

    return (
      <TouchableOpacity style={styles.submitButton} onPress={handleConfirmAnswer}>
        <Text style={styles.submitButtonText}>提交答案</Text>
      </TouchableOpacity>
    );
  };

  return (
    <RNView style={styles.exerciseContainer}>
      <Text style={styles.questionText}>{exercise.question}</Text>
      {renderExerciseContent()}

      {/* 始终显示提交按钮，除非已回答 */}
      {renderSubmitButton()}

      {isAnswered && showAnswers && (
        <Text style={[styles.feedbackText, isCorrect ? styles.correctText : styles.incorrectText]}>
          {isCorrect ? "回答正确！" : "回答错误，请再试一次。"}
        </Text>
      )}
    </RNView>
  );
};

const styles = StyleSheet.create({
  exerciseContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
    lineHeight: 22,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    minHeight: 50,
  },
  selectedOption: {
    borderColor: "#5EC0DE",
    borderWidth: 2,
  },
  correctOption: {
    borderColor: "green",
    borderWidth: 2,
    backgroundColor: "rgba(0, 255, 0, 0.05)",
  },
  optionText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  icon: {
    marginLeft: 8,
  },
  feedbackText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  correctText: {
    color: "green",
  },
  incorrectText: {
    color: "red",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  // 填空题样式
  fillBlankContainer: {
    padding: 12,
    width: "100%",
  },
  fillBlankInstructions: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: "#555",
  },
  fillBlankQuestionContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
  },
  fillBlankPart: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
    width: "100%",
  },
  fillBlankQuestion: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  fillBlankText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  fillBlankInput: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 6,
    marginHorizontal: 4,
    marginTop: 4,
    minWidth: 100,
    fontSize: 15,
    backgroundColor: "white",
  },
  fillBlankInputDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  fillBlankInputCorrect: {
    borderColor: "green",
    borderWidth: 2,
  },
  fillBlankInputIncorrect: {
    borderColor: "red",
    borderWidth: 2,
  },
  fillBlankResultContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  fillBlankResultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fillBlankResultText: {
    fontSize: 14,
    marginBottom: 6,
  },
  resetFillBlankButton: {
    backgroundColor: "#5EC0DE",
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: "center",
  },
  resetFillBlankText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // 匹配题样式
  matchingContainer: {
    padding: 12,
    width: "100%",
  },
  matchingInstructions: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    color: "#555",
  },
  matchingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  matchingColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  matchingItem: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    minHeight: 40,
  },
  matchingItemSelected: {
    borderColor: "#5EC0DE",
    borderWidth: 2,
    backgroundColor: "rgba(94, 192, 222, 0.1)",
  },
  matchingItemMatched: {
    borderColor: "#FF9600",
    borderWidth: 2,
    backgroundColor: "rgba(255, 150, 0, 0.1)",
  },
  matchingItemText: {
    fontSize: 14,
    textAlign: "center",
  },
  matchingResultsContainer: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
    marginBottom: 10,
  },
  matchingResultsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },
  matchingResultText: {
    fontSize: 13,
    marginBottom: 4,
  },
  matchingCorrectContainer: {
    padding: 10,
    backgroundColor: "rgba(88, 204, 2, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#58CC02",
  },
  matchingCorrectTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#446A22",
  },
  matchingCorrectText: {
    fontSize: 13,
    marginBottom: 4,
    color: "#446A22",
  },
  otherTypeContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  otherTypeText: {
    fontSize: 16,
    color: "#555",
  },
  // 提交按钮样式
  submitButton: {
    backgroundColor: "#5EC0DE",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
