import React, { useState, useEffect } from "react";
import { StyleSheet, View as RNView, TouchableOpacity, TextInput, Image, Platform, Alert } from "react-native";
import { Text } from "../components/Themed";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

// 练习题组件
export const Exercise = ({
  exercise,
  onAnswer,
  userAnswers,
  showAnswers,
  isSingleMode = false,
  hideSubmitButton = false,
}: {
  exercise: {
    id: string;
    question: string;
    options: any;
    correctAnswer: any;
    type?: string;
    explanation?: string;
    knowledgePoints?: any[];
    isAI?: boolean;
  };
  onAnswer: (exerciseId: string, optionIndex: number, matchingAnswers?: number[], fillBlankAnswers?: string[]) => void;
  userAnswers: Record<string, number | number[] | string[] | boolean>;
  showAnswers: boolean;
  isSingleMode?: boolean;
  hideSubmitButton?: boolean;
}) => {
  const isAnswered = userAnswers.hasOwnProperty(exercise.id);

  let isCorrect = false;
  if (isAnswered && showAnswers) {
    if (typeof userAnswers[exercise.id] === "boolean") {
      isCorrect = userAnswers[exercise.id] as boolean;
    }
  }

  const exerciseType = exercise.type || "choice";

  const [isAnsweredLocally, setIsAnsweredLocally] = useState(isAnswered);
  const [localSelection, setLocalSelection] = useState<number | null>(null);

  useEffect(() => {
    setIsAnsweredLocally(isAnswered);
    if (isAnswered && exerciseType === "choice") {
      setLocalSelection(userAnswers[exercise.id] as number);
    }
  }, [isAnswered, exercise.id, exerciseType, userAnswers]);

  // 匹配题状态
  const [selectedLeftIndex, setSelectedLeftIndex] = useState<number | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<number[]>(() =>
    Array(exercise.options?.left?.length || 0).fill(-1)
  );

  // 填空题状态
  const [blankAnswers, setBlankAnswers] = useState<string[]>(
    Array.isArray(exercise.correctAnswer) ? Array(exercise.correctAnswer.length).fill("") : []
  );
  
  // 应用题状态
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 清理副作用
  useEffect(() => {
    setSelectedLeftIndex(null);
    setMatchingPairs(Array(exercise.options?.left?.length || 0).fill(-1));
    setBlankAnswers(Array.isArray(exercise.correctAnswer) ? Array(exercise.correctAnswer.length).fill("") : []);
    setPhoto(null);
    setUploading(false);
    setIsAnsweredLocally(isAnswered);
    setLocalSelection(null);
  }, [exercise.id]);

  // 创建选择题答案处理函数
  const handleChoiceSelection = (index: number) => {
    console.log(`选择了选项索引: ${index}`);
    setLocalSelection(index);
    onAnswer(exercise.id, index);
  };

  // 当匹配题建立完整的映射关系后记录临时答案
  const handleMatchingSelection = (leftIndex: number, rightIndex: number) => {
    if (isAnsweredLocally || isAnswered) return;

    const newMatchingPairs = [...matchingPairs];
    newMatchingPairs[leftIndex] = rightIndex;
    setMatchingPairs(newMatchingPairs);
    
    // 检查是否所有左侧选项都已匹配
    const allMatched = newMatchingPairs.every(pair => pair !== -1);
    
    // 无论是否完成匹配，都记录当前状态，但不自动提交
    if (allMatched) {
      console.log('匹配题所有项已匹配完成，等待用户点击提交按钮:', newMatchingPairs);
      onAnswer(exercise.id, 0, newMatchingPairs);
    } else {
      console.log('匹配题部分匹配，当前状态:', newMatchingPairs);
      // 部分匹配时也传递当前状态，但不会被当作有效答案
      onAnswer(exercise.id, -1, newMatchingPairs);
    }
  };

  // 填空题输入处理函数
  const handleBlankInput = (text: string, index: number) => {
    if (isAnsweredLocally || isAnswered) return;

    const newAnswers = [...blankAnswers];
    newAnswers[index] = text;
    setBlankAnswers(newAnswers);
    
    console.log(`填空题输入: index=${index}, text="${text}", 完整答案:`, newAnswers);
    
    onAnswer(exercise.id, 0, undefined, newAnswers);
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
        <Text style={styles.matchingInstructions}>请先选择左侧选项，再选择右侧选项进行匹配</Text>

        <RNView style={styles.matchingContent}>
          {/* 左侧选项 */}
          <RNView style={styles.matchingColumn}>
            <Text style={styles.matchingColumnTitle}>选择项</Text>
            {exercise.options.left.map((item: string, index: number) => (
              <TouchableOpacity
                key={`left-${index}`}
                style={[
                  styles.matchingItem, 
                  selectedLeftIndex === index && styles.matchingItemSelected,
                  matchingPairs[index] !== -1 && styles.matchingItemMatched
                ]}
                onPress={() => setSelectedLeftIndex(index)}
                disabled={isAnsweredLocally || isAnswered}
              >
                <Text 
                  style={[
                    styles.matchingItemText,
                    selectedLeftIndex === index && styles.matchingItemTextSelected,
                    matchingPairs[index] !== -1 && styles.matchingItemTextMatched
                  ]}
                >
                  {item}
                </Text>
                {matchingPairs[index] !== -1 && (
                  <Ionicons name="checkmark-circle" size={18} color="#FF9600" style={styles.matchingItemIcon} />
                )}
              </TouchableOpacity>
            ))}
          </RNView>

          {/* 中间箭头区域 */}
          <RNView style={styles.matchingArrowColumn}>
            {exercise.options.left.map((_: string, index: number) => (
              <RNView 
                key={`arrow-${index}`} 
                style={styles.matchingArrowContainer}
              >
                {selectedLeftIndex === index ? (
                  <Ionicons name="arrow-forward" size={24} color="#5EC0DE" />
                ) : matchingPairs[index] !== -1 ? (
                  <Ionicons name="arrow-forward" size={24} color="#FF9600" />
                ) : (
                  <RNView style={styles.matchingArrowPlaceholder} />
                )}
              </RNView>
            ))}
          </RNView>

          {/* 右侧选项 */}
          <RNView style={styles.matchingColumn}>
            <Text style={styles.matchingColumnTitle}>匹配项</Text>
            {exercise.options.right.map((item: string, index: number) => (
              <TouchableOpacity
                key={`right-${index}`}
                style={[
                  styles.matchingItem, 
                  matchingPairs.includes(index) && styles.matchingItemMatched,
                  selectedLeftIndex !== null && styles.matchingItemSelectable,
                ]}
                onPress={() => {
                  if (selectedLeftIndex !== null) {
                    handleMatchingSelection(selectedLeftIndex, index);
                    setSelectedLeftIndex(null);
                  }
                }}
                disabled={isAnsweredLocally || isAnswered || selectedLeftIndex === null}
              >
                <Text 
                  style={[
                    styles.matchingItemText,
                    matchingPairs.includes(index) && styles.matchingItemTextMatched,
                    selectedLeftIndex !== null && styles.matchingItemTextSelectable,
                  ]}
                >
                  {item}
                </Text>
                {matchingPairs.includes(index) && (
                  <Ionicons name="checkmark-circle" size={18} color="#FF9600" style={styles.matchingItemIcon} />
                )}
              </TouchableOpacity>
            ))}
          </RNView>
        </RNView>

        {/* 当前匹配结果 */}
        {matchingPairs.some((pair) => pair !== -1) && (
          <RNView style={styles.matchingResultsContainer}>
            <Text style={styles.matchingResultsTitle}>当前匹配结果:</Text>
            {matchingPairs.map((rightIndex, leftIndex) => {
              if (rightIndex === -1) return null;
              return (
                <RNView key={`match-${leftIndex}`} style={styles.matchingResultRow}>
                  <Text style={styles.matchingResultText}>
                    {exercise.options.left[leftIndex]} 
                </Text>
                  <Ionicons name="arrow-forward" size={14} color="#666" style={{marginHorizontal: 4}} />
                  <Text style={styles.matchingResultText}>
                    {exercise.options.right[rightIndex]}
                  </Text>
                  <TouchableOpacity 
                    style={styles.matchingDeleteButton}
                    onPress={() => {
                      if (isAnsweredLocally || isAnswered) return;
                      const newMatchingPairs = [...matchingPairs];
                      newMatchingPairs[leftIndex] = -1;
                      setMatchingPairs(newMatchingPairs);
                      
                      // 删除匹配后，重新检查是否所有项都已匹配
                      const allMatched = newMatchingPairs.every(pair => pair !== -1);
                      if (allMatched) {
                        console.log('匹配题删除后重新匹配完成，等待用户点击提交按钮:', newMatchingPairs);
                        onAnswer(exercise.id, 0, newMatchingPairs);
                      } else {
                        // 如果不是全部匹配，传递当前匹配状态
                        console.log('匹配题删除后未完全匹配，当前状态:', newMatchingPairs);
                        onAnswer(exercise.id, -1, newMatchingPairs); // 传递当前状态但标记为未完成
                      }
                    }}
                    disabled={isAnsweredLocally || isAnswered}
                  >
                    <Ionicons name="close-circle" size={18} color="#FF4B4B" />
                  </TouchableOpacity>
                </RNView>
              );
            })}
          </RNView>
        )}
      </RNView>
    );
  };

  // 添加应用题渲染函数
  const renderApplicationQuestion = () => {
    if (!exercise.options?.allowPhoto) {
      return <Text style={styles.errorText}>应用题配置错误</Text>;
    }

    // 请求相机权限
    const requestCameraPermission = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相机权限才能拍照上传答案');
        return false;
      }
      return true;
    };

    // 请求相册权限
    const requestMediaLibraryPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能选择图片');
        return false;
      }
      return true;
    };

    // 从相机拍照
    const takePhoto = async () => {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhoto(result.assets[0].uri);
          onAnswer(exercise.id, 0, undefined, [result.assets[0].uri]); // 将URI作为答案
        }
      } catch (error) {
        console.error('拍照出错:', error);
        Alert.alert('错误', '拍照失败，请重试');
      }
    };

    // 从相册选择
    const pickImage = async () => {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhoto(result.assets[0].uri);
          onAnswer(exercise.id, 0, undefined, [result.assets[0].uri]); // 将URI作为答案
        }
      } catch (error) {
        console.error('选择图片出错:', error);
        Alert.alert('错误', '选择图片失败，请重试');
      }
    };

    return (
      <RNView style={styles.applicationContainer}>
        <Text style={styles.applicationInstructions}>
          解答以下问题，拍照上传你的答案
                </Text>

        {/* 提示信息 */}
        {exercise.options.hint && (
          <RNView style={styles.applicationHintContainer}>
            <Text style={styles.applicationHintTitle}>提示：</Text>
            <Text style={styles.applicationHintText}>{exercise.options.hint}</Text>
          </RNView>
        )}

        {/* 图片预览 */}
        {photo ? (
          <RNView style={styles.photoPreviewContainer}>
            <Image source={{ uri: photo }} style={styles.photoPreview} />
            <TouchableOpacity 
              style={styles.removePhotoButton}
              onPress={() => {
                setPhoto(null);
              }}
              disabled={isAnsweredLocally || isAnswered}
            >
              <Ionicons name="close-circle" size={24} color="#FF4B4B" />
              <Text style={styles.removePhotoText}>移除</Text>
            </TouchableOpacity>
          </RNView>
        ) : (
          <RNView style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={48} color="#ccc" />
            <Text style={styles.photoPlaceholderText}>
              {isAnsweredLocally || isAnswered ? "已提交答案" : "请上传解答图片"}
            </Text>
          </RNView>
        )}

        {/* 操作按钮 */}
        {!isAnsweredLocally && !isAnswered && (
          <RNView style={styles.photoButtonsContainer}>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.photoButtonText}>拍照</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.photoButton}
              onPress={pickImage}
            >
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.photoButtonText}>从相册选择</Text>
            </TouchableOpacity>
          </RNView>
        )}

        {/* 状态信息 */}
        {isAnsweredLocally && (
          <RNView style={styles.applicationStatusContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#58CC02" />
            <Text style={styles.applicationStatusText}>
              答案已提交，等待评分
            </Text>
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
              exercise.options.map((option: any, index: number) => {
                // 处理不同格式的选项数据
                let optionText: string;
                if (typeof option === 'string') {
                  optionText = option;
                } else if (typeof option === 'object' && option.content) {
                  optionText = option.content;
                } else {
                  optionText = String(option);
                }
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      localSelection === index && styles.selectedOption,
                      isAnswered && showAnswers && index === exercise.correctAnswer && styles.correctOption,
                    ]}
                    onPress={() => handleChoiceSelection(index)}
                    disabled={isAnsweredLocally || isAnswered}
                  >
                    <Text style={styles.optionText}>{optionText}</Text>
                    {localSelection === index && !isAnswered && (
                      <Ionicons name="radio-button-on" size={20} color="#5EC0DE" style={styles.icon} />
                    )}
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
                );
              })
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

      case "application":
        // 应用题
        return renderApplicationQuestion();

      case "sort":
      case "math":
        // 其他题型
        return (
          <RNView style={styles.otherTypeContainer}>
            <Text style={styles.otherTypeText}>
              {exerciseType === "sort" ? "排序题" : "数学计算题"}-
              功能已实现但界面已简化
            </Text>
          </RNView>
        );

      default:
        return <Text style={styles.errorText}>未知题型: {exerciseType}</Text>;
    }
  };

  return (
    <RNView style={styles.exerciseContainer}>
      <RNView style={styles.questionContainer}>
        <Text style={styles.questionText}>{exercise.question}</Text>
        {exercise.isAI && (
          <RNView style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={16} color="#FF9500" />
            <Text style={styles.aiText}>AI</Text>
          </RNView>
        )}
      </RNView>
      {renderExerciseContent()}
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
  questionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    flex: 1,
    marginRight: 8,
  },
  aiIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 149, 0, 0.3)",
  },
  aiText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF9500",
    marginLeft: 2,
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
    backgroundColor: "rgba(94, 192, 222, 0.05)",
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
    textAlign: "center",
  },
  matchingContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    alignItems: "stretch",
  },
  matchingColumn: {
    flex: 5,
    marginHorizontal: 2,
  },
  matchingColumnTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    padding: 4,
    borderRadius: 4,
  },
  matchingArrowColumn: {
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
  },
  matchingArrowContainer: {
    height: 40,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  matchingArrowPlaceholder: {
    height: 24,
    width: 24,
  },
  matchingItem: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  matchingItemSelectable: {
    borderColor: "#5EC0DE",
    borderWidth: 1,
    backgroundColor: "rgba(94, 192, 222, 0.05)",
  },
  matchingItemText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  matchingItemTextSelected: {
    fontWeight: "600",
    color: "#5EC0DE",
  },
  matchingItemTextMatched: {
    fontWeight: "600",
    color: "#FF9600",
  },
  matchingItemTextSelectable: {
    color: "#5EC0DE",
  },
  matchingItemIcon: {
    marginLeft: 8,
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
    color: "#444",
  },
  matchingResultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  matchingResultText: {
    fontSize: 13,
    color: "#333",
    flex: 1,
  },
  matchingDeleteButton: {
    padding: 4,
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
  // 应用题样式
  applicationContainer: {
    padding: 12,
    width: "100%",
  },
  applicationInstructions: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: "#555",
    textAlign: "center",
  },
  applicationHintContainer: {
    backgroundColor: "rgba(94, 192, 222, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#5EC0DE",
  },
  applicationHintTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#5EC0DE",
  },
  applicationHintText: {
    fontSize: 14,
    color: "#333",
  },
  photoPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  photoPlaceholderText: {
    color: "#999",
    marginTop: 8,
  },
  photoPreviewContainer: {
    width: "100%",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  removePhotoText: {
    color: "#FF4B4B",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
  },
  photoButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5EC0DE",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  photoButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  applicationStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 204, 2, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  applicationStatusText: {
    color: "#58CC02",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
  },
});
