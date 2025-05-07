import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  View as RNView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Text, View } from "../components/Themed";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { USER_ID } from "../app/services/progressService";
import { getUserPoints } from "../app/services/pointsService";

// API基础URL - 根据环境选择不同的URL
const isDevelopment = process.env.NODE_ENV === 'development';
// API基础URL - 本地开发使用IP地址，生产环境使用相对路径
const API_BASE_URL = isDevelopment 
  ? "http://localhost:3000/api"  // 开发环境
  : "/api";  // 生产环境，使用相对路径

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

// 练习题组件
const Exercise = ({
  exercise,
  onAnswer,
  userAnswers,
}: {
  exercise: {
    id: string;
    question: string;
    options: any;
    correctAnswer: any;
    type?: string;
  };
  onAnswer: (exerciseId: string, optionIndex: number, matchingAnswers?: number[], fillBlankAnswers?: string[]) => void;
  userAnswers: Record<string, number | number[] | string[]>;
}) => {
  const isAnswered = userAnswers.hasOwnProperty(exercise.id);
  const isCorrect = isAnswered && 
    (exercise.type === 'matching' 
      ? JSON.stringify(userAnswers[exercise.id]) === JSON.stringify(exercise.correctAnswer)
      : userAnswers[exercise.id] === exercise.correctAnswer);
  const exerciseType = exercise.type || 'choice'; // 默认为选择题类型
  
  // 匹配题状态
  const [selectedLeftIndex, setSelectedLeftIndex] = useState<number | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<number[]>(
    Array(exercise.options?.left?.length || 0).fill(-1)
  );
  
  // 当匹配题建立完整的映射关系后提交答案
  const submitMatchingAnswer = () => {
    // 检查是否所有左侧项目都已匹配
    if (matchingPairs.every(pair => pair !== -1)) {
      onAnswer(exercise.id, 0, matchingPairs);
    }
  };

  // 处理不同题型的渲染逻辑
  const renderExerciseContent = () => {
    switch (exerciseType) {
      case 'choice':
        // 选择题
        return (
          <>
            {Array.isArray(exercise.options) ? (
              exercise.options.map((option: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isAnswered && userAnswers[exercise.id] === index && styles.selectedOption,
                    isAnswered && index === exercise.correctAnswer && styles.correctOption,
                  ]}
                  onPress={() => onAnswer(exercise.id, index)}
                  disabled={isAnswered}
                >
                  <Text style={styles.optionText}>{option}</Text>
                  {isAnswered && index === exercise.correctAnswer && (
                    <Ionicons name="checkmark-circle" size={24} color="green" style={styles.icon} />
                  )}
                  {isAnswered && userAnswers[exercise.id] === index && index !== exercise.correctAnswer && (
                    <Ionicons name="close-circle" size={24} color="red" style={styles.icon} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.errorText}>选项数据格式错误</Text>
            )}
          </>
        );
      
      case 'matching':
        // 匹配题
        return (
          <RNView style={styles.matchingOuterContainer}>
            {exercise.options && exercise.options.left && exercise.options.right ? (
              <>
                <Text style={styles.matchingInstructions}>
                  请点击左侧项目，然后点击右侧对应项目进行匹配
                </Text>
                <RNView style={styles.matchingContainer}>
                  <RNView style={styles.matchingColumn}>
                    <Text style={styles.columnHeader}>左侧项目</Text>
                    {exercise.options.left.map((item: string, leftIndex: number) => (
                      <TouchableOpacity
                        key={leftIndex}
                        style={[
                          styles.matchingItem,
                          selectedLeftIndex === leftIndex && styles.selectedMatchingItem,
                          matchingPairs[leftIndex] !== -1 && styles.matchedItem
                        ]}
                        onPress={() => {
                          if (isAnswered) return;
                          setSelectedLeftIndex(leftIndex);
                        }}
                        disabled={isAnswered}
                      >
                        <Text style={styles.matchingText}>{item}</Text>
                        {matchingPairs[leftIndex] !== -1 && (
                          <RNView style={styles.matchingNumberBadge}>
                            <Text style={styles.matchingNumberText}>{matchingPairs[leftIndex] + 1}</Text>
                          </RNView>
                        )}
                      </TouchableOpacity>
                    ))}
                  </RNView>
                  
                  <RNView style={styles.matchingArrowsColumn}>
                    {matchingPairs.map((rightIndex, leftIndex) => 
                      rightIndex !== -1 ? (
                        <RNView key={leftIndex} style={styles.matchingArrow}>
                          <Ionicons name="arrow-forward" size={20} color="#5EC0DE" />
                        </RNView>
                      ) : null
                    )}
                  </RNView>
                  
                  <RNView style={styles.matchingColumn}>
                    <Text style={styles.columnHeader}>右侧项目</Text>
                    {exercise.options.right.map((item: string, rightIndex: number) => (
                      <TouchableOpacity
                        key={rightIndex}
                        style={[
                          styles.matchingItem,
                          matchingPairs.includes(rightIndex) && styles.matchedItem
                        ]}
                        onPress={() => {
                          if (isAnswered || selectedLeftIndex === null) return;
                          // 更新匹配关系
                          const newPairs = [...matchingPairs];
                          // 如果这个右侧项目已经被匹配了，先清除原来的匹配
                          const existingPairIndex = newPairs.findIndex(p => p === rightIndex);
                          if (existingPairIndex !== -1) {
                            newPairs[existingPairIndex] = -1;
                          }
                          newPairs[selectedLeftIndex] = rightIndex;
                          setMatchingPairs(newPairs);
                          setSelectedLeftIndex(null);
                          
                          // 如果所有项目都已匹配，自动提交答案
                          if (newPairs.every(p => p !== -1)) {
                            setTimeout(() => submitMatchingAnswer(), 500);
                          }
                        }}
                        disabled={isAnswered || selectedLeftIndex === null}
                      >
                        <Text style={styles.matchingText}>{item}</Text>
                        {matchingPairs.includes(rightIndex) && (
                          <RNView style={styles.matchingNumberBadge}>
                            <Text style={styles.matchingNumberText}>
                              {matchingPairs.findIndex(p => p === rightIndex) + 1}
                            </Text>
                          </RNView>
                        )}
                      </TouchableOpacity>
                    ))}
                  </RNView>
                </RNView>
                
                {!isAnswered && selectedLeftIndex !== null && (
                  <Text style={styles.matchingPrompt}>
                    现在请在右侧选择对应项目
                  </Text>
                )}
                
                {!isAnswered && matchingPairs.some(p => p !== -1) && matchingPairs.some(p => p === -1) && (
                  <TouchableOpacity 
                    style={styles.resetMatchingButton}
                    onPress={() => {
                      setSelectedLeftIndex(null);
                      setMatchingPairs(Array(exercise.options.left.length).fill(-1));
                    }}
                  >
                    <Text style={styles.resetMatchingText}>重置匹配</Text>
                  </TouchableOpacity>
                )}
                
                {isAnswered && (
                  <RNView style={styles.matchingResultContainer}>
                    <Text style={styles.matchingResultTitle}>正确答案：</Text>
                    {Array.isArray(exercise.correctAnswer) && exercise.options.left.map((leftItem: string, index: number) => {
                      const correctRightIndex = exercise.correctAnswer[index];
                      return (
                        <Text key={index} style={styles.matchingResultText}>
                          {leftItem} ➔ {exercise.options.right[correctRightIndex]}
                        </Text>
                      );
                    })}
                  </RNView>
                )}
              </>
            ) : (
              <Text style={styles.errorText}>匹配数据格式错误</Text>
            )}
          </RNView>
        );
      
      case 'drag_drop':
        // 拖拽题
        const [dragItems, setDragItems] = useState<string[]>(
          exercise.options?.elements ? [...exercise.options.elements] : []
        );
        const [dropTargets, setDropTargets] = useState<(string | null)[]>(
          exercise.options?.positions ? exercise.options.positions.map(() => null) : []
        );
        
        const handleDragSelect = (item: string) => {
          if (isAnswered) return;
          // 选择一个元素进行拖放，使用简化的点选方式代替真实拖放
          // 如果已经在某个位置上，先移除
          const existingIndex = dropTargets.findIndex(t => t === item);
          if (existingIndex !== -1) {
            const newTargets = [...dropTargets];
            newTargets[existingIndex] = null;
            setDropTargets(newTargets);
            return;
          }
          
          // 记录当前选中的元素
          setSelectedDragItem(item);
        };
        
        const handleDropSelect = (targetIndex: number) => {
          if (isAnswered || !selectedDragItem) return;
          
          // 放置选中元素到目标位置
          const newTargets = [...dropTargets];
          newTargets[targetIndex] = selectedDragItem;
          setDropTargets(newTargets);
          setSelectedDragItem(null);
          
          // 如果所有位置都填满了，提交答案
          if (newTargets.every(t => t !== null)) {
            const dragDropAnswers = newTargets.map(target => {
              return exercise.options.elements.findIndex((el: string) => el === target);
            });
            setTimeout(() => onAnswer(exercise.id, 0, dragDropAnswers), 500);
          }
        };
        
        const [selectedDragItem, setSelectedDragItem] = useState<string | null>(null);
        
        return (
          <RNView style={styles.dragDropContainer}>
            {exercise.options && exercise.options.elements && exercise.options.positions ? (
              <>
                <Text style={styles.dragDropInstructions}>
                  请先点击左侧元素，然后点击右侧位置进行放置
                </Text>
                
                <RNView style={styles.dragDropContent}>
                  {/* 拖动项容器 */}
                  <RNView style={styles.dragItemsContainer}>
                    <Text style={styles.dragDropSectionTitle}>元素</Text>
                    {exercise.options.elements.map((item: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dragItem,
                          selectedDragItem === item && styles.selectedDragItem,
                          dropTargets.includes(item) && styles.placedDragItem
                        ]}
                        onPress={() => handleDragSelect(item)}
                        disabled={isAnswered}
                      >
                        <Text style={styles.dragItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNView>
                  
                  {/* 放置区容器 */}
                  <RNView style={styles.dropTargetsContainer}>
                    <Text style={styles.dragDropSectionTitle}>位置</Text>
                    {exercise.options.positions.map((position: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dropTarget,
                          dropTargets[index] !== null && styles.filledDropTarget
                        ]}
                        onPress={() => handleDropSelect(index)}
                        disabled={isAnswered || selectedDragItem === null}
                      >
                        <Text style={styles.dropTargetLabel}>{position}</Text>
                        {dropTargets[index] && (
                          <RNView style={styles.droppedItemContainer}>
                            <Text style={styles.droppedItemText}>{dropTargets[index]}</Text>
                          </RNView>
                        )}
                      </TouchableOpacity>
                    ))}
                  </RNView>
                </RNView>
                
                {!isAnswered && selectedDragItem && (
                  <Text style={styles.dragDropPrompt}>
                    请在右侧选择要放置"{selectedDragItem}"的位置
                  </Text>
                )}
                
                {!isAnswered && dropTargets.some(t => t !== null) && (
                  <TouchableOpacity 
                    style={styles.resetDragDropButton}
                    onPress={() => {
                      setSelectedDragItem(null);
                      setDropTargets(exercise.options.positions.map(() => null));
                    }}
                  >
                    <Text style={styles.resetDragDropText}>重置所有位置</Text>
                  </TouchableOpacity>
                )}
                
                {isAnswered && (
                  <RNView style={styles.dragDropResultContainer}>
                    <Text style={styles.dragDropResultTitle}>正确答案：</Text>
                    {Array.isArray(exercise.correctAnswer) && exercise.options.positions.map((position: string, index: number) => {
                      const correctElementIndex = exercise.correctAnswer[index];
                      const correctElement = exercise.options.elements[correctElementIndex];
                      return (
                        <Text key={index} style={styles.dragDropResultItem}>
                          {position}: {correctElement}
                        </Text>
                      );
                    })}
                  </RNView>
                )}
              </>
            ) : (
              <Text style={styles.errorText}>拖拽题数据格式错误</Text>
            )}
          </RNView>
        );
      
      case 'fill_blank':
        // 填空题
        const [blankAnswers, setBlankAnswers] = useState<string[]>(
          Array.isArray(exercise.correctAnswer) ? Array(exercise.correctAnswer.length).fill('') : []
        );
        
        // 解析问题文本，找出空白处
        const renderFillBlankQuestion = () => {
          if (!exercise.question) return null;
          
          // 将问题文本按照空白处分割
          const parts = exercise.question.split('____');
          
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
                        isAnswered && styles.fillBlankInputDisabled,
                        isAnswered && 
                          (blankAnswers[index] === exercise.correctAnswer[index] 
                            ? styles.fillBlankInputCorrect 
                            : styles.fillBlankInputIncorrect)
                      ]}
                      value={blankAnswers[index]}
                      onChangeText={(text) => {
                        if (isAnswered) return;
                        const newAnswers = [...blankAnswers];
                        newAnswers[index] = text;
                        setBlankAnswers(newAnswers);
                        
                        // 检查是否所有空都已填写
                        if (newAnswers.every(ans => ans.trim() !== '')) {
                          // 检查答案是否正确
                          const isCorrect = newAnswers.every(
                            (ans, i) => ans.trim() === exercise.correctAnswer[i]
                          );
                          setTimeout(() => onAnswer(exercise.id, isCorrect ? 1 : 0, undefined, newAnswers), 500);
                        }
                      }}
                      placeholder="填写答案"
                      editable={!isAnswered}
                    />
                  )}
                </RNView>
              ))}
            </RNView>
          );
        };
        
        return (
          <RNView style={styles.fillBlankContainer}>
            {renderFillBlankQuestion()}
            
            {isAnswered && (
              <RNView style={styles.fillBlankResultContainer}>
                <Text style={styles.fillBlankResultTitle}>正确答案：</Text>
                {Array.isArray(exercise.correctAnswer) && exercise.correctAnswer.map((answer, index) => (
                  <Text key={index} style={styles.fillBlankResultText}>
                    空白{index + 1}: {answer}
                  </Text>
                ))}
              </RNView>
            )}
            
            {!isAnswered && blankAnswers.some(ans => ans !== '') && (
              <TouchableOpacity 
                style={styles.resetFillBlankButton}
                onPress={() => {
                  setBlankAnswers(Array(exercise.correctAnswer.length).fill(''));
                }}
              >
                <Text style={styles.resetFillBlankText}>清空所有答案</Text>
              </TouchableOpacity>
            )}
          </RNView>
        );
      
      case 'sort':
      case 'math':
        // 其他题型的临时提示
        return (
          <RNView style={styles.otherTypeContainer}>
            <Text style={styles.otherTypeText}>
              {exerciseType === 'sort' ? '排序题' : '数学计算题'} 
              - 请在应用更新后使用此功能
            </Text>
          </RNView>
        );
      
      default:
        return <Text style={styles.errorText}>未知题型: {exerciseType}</Text>;
    }
  };

  return (
    <RNView style={styles.exerciseContainer}>
      <Text style={styles.questionText}>{exercise.question}</Text>
      {renderExerciseContent()}
      {isAnswered && (
        <Text style={[styles.feedbackText, isCorrect ? styles.correctText : styles.incorrectText]}>
          {isCorrect ? "回答正确！" : "回答错误，请再试一次。"}
        </Text>
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
  onExit
}: {
  visible: boolean;
  correctCount: number;
  totalCount: number;
  onRetry: () => void;
  onExit: () => void;
}) => {
  // 计算完成率和星星数
  const completionRate = totalCount > 0 ? correctCount / totalCount : 0;
  const earnedStars = completionRate >= 1 ? 3 : (completionRate >= 0.7 ? 2 : (completionRate >= 0.3 ? 1 : 0));
  const isThreeStars = earnedStars === 3;

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
            <Text style={styles.summaryText}>
              本次练习总结：
            </Text>
            <Text style={styles.summaryDetail}>
              总题数：<Text style={styles.summaryHighlight}>{totalCount}</Text> 题
            </Text>
            <Text style={styles.summaryDetail}>
              答对：<Text style={styles.summaryHighlight}>{correctCount}</Text> 题
            </Text>
            <Text style={styles.summaryDetail}>
              答错：<Text style={styles.summaryHighlight}>{totalCount - correctCount}</Text> 题
            </Text>
            <Text style={styles.summaryDetail}>
              正确率：<Text style={styles.summaryHighlight}>{totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0}%</Text>
            </Text>
            
            <RNView style={styles.starsContainer}>
              {[...Array(3)].map((_, i) => (
                <FontAwesome5
                  key={i}
                  name="star"
                  size={30}
                  solid={i < earnedStars}
                  color={i < earnedStars ? "#FFD900" : "#E0E0E0"}
                  style={{ marginHorizontal: 8 }}
                />
              ))}
            </RNView>
            
            {isThreeStars && (
              <RNView style={styles.unlockMessage}>
                <Ionicons name="lock-open" size={20} color="#58CC02" />
                <Text style={styles.unlockText}>恭喜！您已完成三星挑战，下一关已解锁</Text>
              </RNView>
            )}
          </RNView>

          <Text style={styles.modalQuestion}>你想要：</Text>

          <RNView style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.retryButton]} onPress={onRetry}>
              <Text style={styles.modalButtonText}>重新做一遍</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalButton, styles.exitButton]} onPress={onExit}>
              <Text style={styles.modalButtonText}>退出本单元</Text>
            </TouchableOpacity>
          </RNView>
        </RNView>
      </RNView>
    </Modal>
  );
};

// 添加提示组件
const AllCompletedMessage = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <RNView style={styles.completedContainer}>
      <Text style={styles.congratsTitle}>恭喜你！</Text>
      <Text style={styles.congratsText}>
        你已完成本单元的所有练习题，并获得了三星评价！
      </Text>
      
      <RNView style={styles.starsRow}>
        {[...Array(3)].map((_, i) => (
          <FontAwesome5
            key={i}
            name="star"
            size={30}
            solid
            color="#FFD900"
            style={{ marginHorizontal: 6 }}
          />
        ))}
      </RNView>
      
      <Text style={styles.unlockText}>
        下一关卡已解锁，你可以继续学习新内容！
      </Text>
      
      <TouchableOpacity 
        style={styles.retryAllButton}
        onPress={onRetry}
      >
        <Text style={styles.retryAllButtonText}>再挑战一遍</Text>
      </TouchableOpacity>
    </RNView>
  );
};

export default function StudyScreen() {
  const params = useLocalSearchParams();
  const { id, unitTitle, color } = params;
  const exerciseIdParam = Array.isArray(params.exerciseId) ? params.exerciseId[0] : params.exerciseId;

  const router = useRouter();
  const [userAnswers, setUserAnswers] = useState<Record<string, number | number[] | string[]>>({});
  const [videoStatus, setVideoStatus] = useState<any>({});
  const screenWidth = Dimensions.get("window").width;
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 添加新的状态变量
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const allAnswered = useRef(false);

  // 检查是否所有题目都已回答
  const checkAllAnswered = (currentAnswers: Record<string, number | number[] | string[]>) => {
    if (allAnswered.current) return; // 如果已经显示过总结，不再重复显示

    const answeredCount = Object.keys(currentAnswers).length;
    if (answeredCount === exercises.length && exercises.length > 0) {
      // 计算正确答案数量
      let correct = 0;
      exercises.forEach(ex => {
        // 根据题型判断答案是否正确
        switch (ex.type || 'choice') {
          case 'choice':
            if (currentAnswers[ex.id] === ex.correctAnswer) {
              correct++;
            }
            break;
          case 'matching':
            if (
              Array.isArray(currentAnswers[ex.id]) && 
              Array.isArray(ex.correctAnswer) && 
              JSON.stringify(currentAnswers[ex.id]) === JSON.stringify(ex.correctAnswer)
            ) {
              correct++;
            }
            break;
          case 'drag_drop':
            if (
              Array.isArray(currentAnswers[ex.id]) && 
              Array.isArray(ex.correctAnswer) && 
              JSON.stringify(currentAnswers[ex.id]) === JSON.stringify(ex.correctAnswer)
            ) {
              correct++;
            }
            break;
          case 'fill_blank':
            if (
              Array.isArray(currentAnswers[ex.id]) && 
              Array.isArray(ex.correctAnswer) &&
              (currentAnswers[ex.id] as string[]).every(
                (answer, index) => answer.trim() === ex.correctAnswer[index]
              )
            ) {
              correct++;
            }
            break;
          case 'sort':
          case 'math':
            // 其他题型 - 暂时跳过计算
            console.log(`${ex.type}题型尚未完全支持，跳过正确率计算`);
            break;
          default:
            if (currentAnswers[ex.id] === ex.correctAnswer) {
              correct++;
            }
        }
      });

      setCorrectCount(correct);
      allAnswered.current = true;

      // 延迟显示总结弹窗，给用户一点时间看到最后一题的结果
      setTimeout(() => {
        setShowSummary(true);
      }, 1000);
    }
  };

  // 重新做题
  const handleRetry = () => {
    setShowSummary(false);
    setUserAnswers({});
    setCorrectCount(0);
    allAnswered.current = false;

    // 重新获取练习题
    fetchExercises();
  };

  // 退出本单元
  const handleExit = () => {
    setShowSummary(false);
    // 退出前强制刷新首页进度数据
    router.replace({
      pathname: "/(tabs)",
      params: {
        refresh: Date.now().toString() // 添加时间戳参数，强制组件刷新
      }
    });
  };

  const handleAnswer = async (exerciseId: string, optionIndex: number, matchingAnswers?: number[], fillBlankAnswers?: string[]) => {
    // 更新本地状态
    const newAnswers = {
      ...userAnswers,
      [exerciseId]: fillBlankAnswers || matchingAnswers || optionIndex,
    };

    setUserAnswers(newAnswers);

    // 获取当前练习题
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) return;

    // 判断答案是否正确 - 根据不同题型
    let isCorrect = false;
    
    switch (exercise.type || 'choice') {
      case 'choice':
        // 选择题 - 直接比较索引
        isCorrect = optionIndex === exercise.correctAnswer;
        break;
      case 'matching':
        // 匹配题 - 比较数组
        if (matchingAnswers && Array.isArray(exercise.correctAnswer)) {
          isCorrect = JSON.stringify(matchingAnswers) === JSON.stringify(exercise.correctAnswer);
        }
        break;
      case 'drag_drop':
        // 拖拽题 - 比较数组
        if (matchingAnswers && Array.isArray(exercise.correctAnswer)) {
          isCorrect = JSON.stringify(matchingAnswers) === JSON.stringify(exercise.correctAnswer);
        }
        break;
      case 'fill_blank':
        // 填空题 - 逐个比较填入的答案
        if (fillBlankAnswers && Array.isArray(exercise.correctAnswer)) {
          isCorrect = fillBlankAnswers.every(
            (answer, index) => answer.trim() === exercise.correctAnswer[index]
          );
        }
        break;
      case 'sort':
      case 'math':
        // 其他题型 - 暂时默认为不正确，因为前端尚未实现这些题型的完整交互
        // 在完整实现后需要更新此逻辑
        isCorrect = false;
        console.log(`${exercise.type}题型尚未完全支持，答案判断待实现`);
        break;
      default:
        isCorrect = optionIndex === exercise.correctAnswer;
    }

    // 检查是否所有题目都已回答
    checkAllAnswered(newAnswers);

    // 提交答题结果到服务器
    try {
      const apiUrl = `${API_BASE_URL}/users/${USER_ID}/submit`;
      console.log('提交答题结果:', { 
        exerciseId, 
        unitId: lessonId, 
        isCorrect,
        answerType: exercise.type || 'choice',
        answerValue: matchingAnswers || optionIndex
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
          const allCorrect = Object.keys(newAnswers).every(id => {
            const ex = exercises.find(e => e.id === id);
            if (!ex) return false;
            
            // 根据题型判断答案是否正确
            switch (ex.type || 'choice') {
              case 'choice':
                return newAnswers[id] === ex.correctAnswer;
              case 'matching':
                if (Array.isArray(newAnswers[id]) && Array.isArray(ex.correctAnswer)) {
                  return JSON.stringify(newAnswers[id]) === JSON.stringify(ex.correctAnswer);
                }
                return false;
              case 'drag_drop':
                if (Array.isArray(newAnswers[id]) && Array.isArray(ex.correctAnswer)) {
                  return JSON.stringify(newAnswers[id]) === JSON.stringify(ex.correctAnswer);
                }
                return false;
              case 'fill_blank':
                if (Array.isArray(newAnswers[id]) && Array.isArray(ex.correctAnswer)) {
                  return (newAnswers[id] as string[]).every(
                    (answer, index) => answer.trim() === ex.correctAnswer[index]
                  );
                }
                return false;
              case 'sort':
              case 'math':
                // 其他题型 - 尚未完整实现
                return false;
              default:
                return newAnswers[id] === ex.correctAnswer;
            }
          });
          
          if (allCorrect) {
            console.log("所有答案都正确，强制更新星星数量");
            // 额外API调用来强制更新进度
            try {
              const updateUrl = `${API_BASE_URL}/users/${USER_ID}/progress/${lessonId}/refresh`;
              console.log('刷新进度URL:', updateUrl);
              
              const refreshResponse = await fetch(updateUrl, { method: "POST" });
              if (!refreshResponse.ok) {
                console.error(`刷新进度失败: HTTP ${refreshResponse.status}`);
              } else {
                const refreshResult = await refreshResponse.json();
                console.log('进度刷新结果:', refreshResult);
              }
            } catch (updateErr) {
              console.error("更新进度失败:", updateErr);
            }
          }
        }
      }
    } catch (err) {
      console.error("提交答题结果出错:", err);
    }
  };

  const handleVideoStatusUpdate = (status: any) => {
    setVideoStatus(status);
  };

  // 确保 id 是单个字符串
  const lessonId = Array.isArray(id) ? id[0] : id || "1-1";
  const videoUrl =
    VIDEO_RESOURCES[lessonId as keyof typeof VIDEO_RESOURCES] ||
    "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4";

  // 从API获取练习题的函数
  const fetchExercises = async () => {
    try {
      setLoading(true);
      // 重置状态
      setUserAnswers({});
      allAnswered.current = false;

      console.log(`正在获取 ${lessonId} 的练习题...`);

      if (exerciseIdParam) {
        // 获取特定的练习题
        const apiUrl = `${API_BASE_URL}/exercises/${lessonId}/${exerciseIdParam}`;
        console.log('请求URL:', apiUrl);
        
        const response = await fetch(apiUrl);

        if (!response.ok) {
          console.error(`HTTP错误: ${response.status}`);
          throw new Error(`获取练习题失败 (HTTP ${response.status})`);
        }

        const result = await response.json();
        console.log('API响应:', result);

        if (result.success && result.data) {
          setExercises([result.data]);
        } else {
          throw new Error(result.message || "获取练习题失败: 服务器未返回数据");
        }
      } else {
        // 获取单元的所有练习题，过滤掉已完成的
        const apiUrl = `${API_BASE_URL}/exercises/${lessonId}?userId=${USER_ID}&filterCompleted=true`;
        console.log('请求URL:', apiUrl);
        
        const response = await fetch(apiUrl);

        // 处理正常响应
        if (response.ok) {
          const result = await response.json();
          console.log('API响应:', result);

          if (result.success) {
            // 检查是否所有题目都已完成
            if (result.allCompleted || (result.data && result.data.length === 0)) {
              console.log('所有题目已完成，显示完成状态');
              setExercises([]);
              setError(null);
            } else if (result.data) {
              setExercises(result.data);
            } else {
              throw new Error("获取练习题失败: 服务器未返回数据");
            }
            return;
          } else {
            throw new Error(result.message || "获取练习题失败: 服务器未返回数据");
          }
        }
        
        // 处理错误响应
        if (response.status === 404) {
          // 如果404错误，可能是所有题目都已完成或者单元不存在
          console.log('获取练习题返回404，检查进度...');
          try {
            // 获取进度确认是否真的完成了所有题目
            const progressUrl = `${API_BASE_URL}/users/${USER_ID}/progress/${lessonId}`;
            const progressResponse = await fetch(progressUrl);
            
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              console.log('进度数据:', progressData);
              
              if (progressData.success && progressData.data.stars === 3) {
                // 确认是全部完成了，显示完成信息
                setExercises([]);
                setError(null);
                return;
              }
            }
          } catch (progressErr) {
            console.error('获取进度信息失败:', progressErr);
          }
        }

        console.error(`HTTP错误: ${response.status}`);
        throw new Error(`获取练习题失败 (HTTP ${response.status})`);
      }
    } catch (err: any) {
      console.error("获取练习题出错:", err);
      setError(err.message || "获取练习题失败，请稍后再试");
      // 如果API请求失败，使用默认练习题
      setExercises([
        {
          id: "1",
          question: "解一元二次方程：x² - 5x + 6 = 0",
          options: ["x = 2 或 x = 3", "x = -2 或 x = -3", "x = 2 或 x = -3", "x = -2 或 x = 3"],
          correctAnswer: 0,
          type: "choice"
        },
        {
          id: "2",
          question: "已知三角形的两边长分别为3和4，且夹角为60°，求第三边的长度。",
          options: ["5", "√13", "√19", "7"],
          correctAnswer: 2,
          type: "choice"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 添加一个新函数，用于获取所有练习题（不过滤已完成的）
  const fetchAllExercisesWithoutFilter = async () => {
    try {
      setLoading(true);
      setUserAnswers({});
      allAnswered.current = false;
      
      console.log(`重新加载 ${lessonId} 的所有练习题...`);
      
      // 不过滤已完成的题目
      const apiUrl = `${API_BASE_URL}/exercises/${lessonId}`;
      console.log('请求URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error(`HTTP错误: ${response.status}`);
        throw new Error(`获取练习题失败 (HTTP ${response.status})`);
      }
      
      const result = await response.json();
      console.log('API响应:', result);
      
      if (result.success && result.data) {
        setExercises(result.data);
        setError(null);
      } else {
        throw new Error(result.message || "获取练习题失败: 服务器未返回数据");
      }
    } catch (err: any) {
      console.error("重新加载练习题出错:", err);
      setError(err.message || "重新加载练习题失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  // 初始加载练习题
  useEffect(() => {
    fetchExercises();

    // 异步获取积分，不阻塞其他功能
    getUserPoints(USER_ID).then(points => {
      console.log('学习页面获取到积分:', points);
      // 这里可以使用积分做一些UI更新
    }).catch(err => {
      console.error('学习页面获取积分出错:', err);
    });
  }, [lessonId, exerciseIdParam]);

  return (
    <View style={styles.container}>
      {/* 隐藏默认的导航栏 */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 状态栏设置为浅色 */}
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* 自定义header */}
      <RNView style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            // 使用 router.replace 替代 router.back，这样更可靠
            router.replace({
              pathname: "/(tabs)",
              params: {
                refresh: Date.now().toString() // 添加时间戳参数，强制组件刷新
              }
            });
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{unitTitle || "初三数学课程"}</Text>
        <RNView style={styles.placeholder} />
      </RNView>

      <ScrollView style={styles.scrollContent}>
        <RNView style={styles.videoContainer}>
          <Video
            source={{ uri: videoUrl }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            useNativeControls
            style={{
              width: screenWidth,
              height: 230,
            }}
            onPlaybackStatusUpdate={handleVideoStatusUpdate}
          />
        </RNView>

        <RNView style={styles.lessonContent}>
          <Text style={styles.sectionTitle}>内容简介</Text>
          <Text style={styles.descriptionText}>
            本节课将讲解初三数学的重要概念，包括一元二次方程的解法、三角函数、函数最值以及代数式的化简。通过观看视频和完成练习题，你将掌握这些关键知识点。
          </Text>

          <Text style={styles.sectionTitle}>课后练习</Text>

          {loading ? (
            <RNView style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5EC0DE" />
              <Text style={styles.loadingText}>加载练习题...</Text>
            </RNView>
          ) : error ? (
            <RNView style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="red" />
              <Text style={styles.errorText}>{error}</Text>
            </RNView>
          ) : exercises.length === 0 ? (
            <AllCompletedMessage onRetry={fetchAllExercisesWithoutFilter} />
          ) : (
            exercises.map((exercise) => (
              <Exercise key={exercise.id} exercise={exercise} onAnswer={handleAnswer} userAnswers={userAnswers} />
            ))
          )}
        </RNView>
      </ScrollView>

      {/* 总结弹窗 */}
      <SummaryModal
        visible={showSummary}
        correctCount={correctCount}
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
    paddingTop: 16, // 减少顶部padding
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
  scrollContent: {
    flex: 1,
  },
  videoContainer: {
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonContent: {
    padding: 16,
    backgroundColor: "white",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  exerciseContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 16,
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
    fontSize: 16,
    flex: 1,
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
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#ffeeee",
    borderRadius: 8,
    marginVertical: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  noExercisesText: {
    padding: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  // 总结弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
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
  correctCount: {
    fontWeight: "bold",
    color: "green",
  },
  incorrectCount: {
    fontWeight: "bold",
    color: "red",
  },
  modalQuestion: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
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
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  unlockMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 204, 2, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  unlockText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#58CC02",
  },
  completedContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  congratsIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  checkIcon: {
    marginLeft: 8,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  congratsText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  retryAllButton: {
    backgroundColor: "#5EC0DE",
    padding: 12,
    borderRadius: 8,
  },
  retryAllButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  matchingOuterContainer: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  matchingInstructions: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  matchingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchingColumn: {
    flex: 1,
  },
  columnHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  matchingItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
  },
  selectedMatchingItem: {
    borderColor: "#5EC0DE",
    borderWidth: 2,
  },
  matchedItem: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  matchingArrowsColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchingArrow: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  matchingText: {
    fontSize: 16,
  },
  matchingNumberBadge: {
    backgroundColor: "#5EC0DE",
    borderRadius: 12,
    padding: 4,
    marginLeft: 8,
  },
  matchingNumberText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  matchingPrompt: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  resetMatchingButton: {
    backgroundColor: "#5EC0DE",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  resetMatchingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  matchingResultContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  matchingResultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  matchingResultText: {
    fontSize: 16,
    marginBottom: 8,
  },
  fillBlankContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fillBlankText: {
    fontSize: 16,
    color: "#555",
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
  dragDropContainer: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  dragDropInstructions: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dragDropContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dragItemsContainer: {
    flex: 1,
  },
  dragDropSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  dragItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
  },
  selectedDragItem: {
    borderColor: "#5EC0DE",
    borderWidth: 2,
  },
  placedDragItem: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  dropTargetsContainer: {
    flex: 1,
  },
  dropTarget: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
  },
  filledDropTarget: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  dropTargetLabel: {
    fontSize: 16,
  },
  droppedItemContainer: {
    backgroundColor: "#5EC0DE",
    borderRadius: 4,
    padding: 4,
  },
  droppedItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  dragDropPrompt: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  resetDragDropButton: {
    backgroundColor: "#5EC0DE",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  resetDragDropText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dragDropResultContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  dragDropResultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  dragDropResultItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  dragItemText: {
    fontSize: 16,
  },
  fillBlankQuestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fillBlankPart: {
    flexDirection: "row",
    alignItems: "center",
  },
  fillBlankQuestion: {
    fontSize: 16,
    color: "#333",
  },
  fillBlankInput: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
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
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  fillBlankResultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  fillBlankResultText: {
    fontSize: 16,
    marginBottom: 8,
  },
  resetFillBlankButton: {
    backgroundColor: "#5EC0DE",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  resetFillBlankText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
