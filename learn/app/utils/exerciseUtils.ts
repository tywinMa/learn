import { addToErrorBook as addToErrorBookApi } from "../services/errorBookService";

/**
 * 判断答案是否正确
 */
export const checkAnswerCorrect = (
  exercise: {
    id: string;
    type?: string;
    correctAnswer: any;
  },
  userAnswer: number | number[] | string[]
): boolean => {
  if (!exercise) return false;

  console.log("判断答案正确性:", exercise.id, 
    "用户答案:", userAnswer, 
    "正确答案:", exercise.correctAnswer,
    "类型:", typeof userAnswer, typeof exercise.correctAnswer,
    "严格相等:", userAnswer === exercise.correctAnswer
  );

  // 根据题型判断答案是否正确
  switch (exercise.type || "choice") {
    case "choice":
      // 选择题 - 直接比较索引，确保进行严格比较
      // 特殊处理：如果用户答案是负数，表示用户未选择，应该直接判定为错误
      if (typeof userAnswer === "number" && userAnswer < 0) {
        console.log(`选择题答案为负数 ${userAnswer}，用户未选择，判定为错误`);
        return false;
      }
      
      const isChoiceCorrect = userAnswer === exercise.correctAnswer;
      console.log(`选择题答案比较: ${userAnswer} === ${exercise.correctAnswer} => ${isChoiceCorrect}`);
      return isChoiceCorrect;

    case "matching":
      // 匹配题 - 比较对象格式答案
      if (Array.isArray(userAnswer) && typeof exercise.correctAnswer === 'object' && !Array.isArray(exercise.correctAnswer)) {
        // 将用户的数组答案转换为对象格式
        const userAnswerObj: Record<string, string> = {};
        (userAnswer as number[]).forEach((rightIndex: number, leftIndex: number) => {
          if (rightIndex !== -1) { // 只记录有效匹配
            userAnswerObj[leftIndex.toString()] = rightIndex.toString();
          }
        });
        
        // 比较对象
        const userAnswerStr = JSON.stringify(userAnswerObj);
        const correctAnswerStr = JSON.stringify(exercise.correctAnswer);
        const isMatchingCorrect = userAnswerStr === correctAnswerStr;
        
        console.log(`匹配题答案比较:`, {
          用户答案数组: userAnswer,
          用户答案对象: userAnswerObj,
          正确答案对象: exercise.correctAnswer,
          用户答案字符串: userAnswerStr,
          正确答案字符串: correctAnswerStr,
          匹配结果: isMatchingCorrect
        });
        
        return isMatchingCorrect;
      }
    
      return false;

    case "application":
      // 应用题 - 需要老师批改，默认为待批改状态
      return false; // 应用题需要老师批改，自动判断为待批改

    case "fill_blank":
      // 填空题 - 逐个比较填入的答案
      if (Array.isArray(userAnswer) && Array.isArray(exercise.correctAnswer)) {
        const result = (userAnswer as string[]).every((answer, index) => {
          // 规范化比较：去除首尾空格，转为小写
          const normalizedUserAnswer = answer.trim();
          const normalizedCorrectAnswer = exercise.correctAnswer[index].trim();
          const isMatch = normalizedUserAnswer === normalizedCorrectAnswer;
          
          console.log(`填空题第${index+1}空比较:`, {
            用户答案: normalizedUserAnswer,
            正确答案: normalizedCorrectAnswer,
            匹配结果: isMatch
          });
          
          return isMatch;
        });
        
        console.log(`填空题整体结果: ${result ? '正确' : '错误'}`);
        return result;
      }
      return false;

    case "sort":
    case "math":
      // 其他题型暂未完全实现，默认返回false
      console.log(`${exercise.type}题型尚未完全支持，答案判断待实现`);
      return false;

    default:
      // 默认情况
      return userAnswer === exercise.correctAnswer;
  }
};

/**
 * 一站式处理答题，减少重复判断
 * - 判断答案正确性
 * - 错题加入错题本
 * - 返回判断结果
 */
export const processAnswer = async (
  exerciseId: string,
  lessonId: string,
  exercise: {
    id: string;
    question: string;
    options: any;
    correctAnswer: any;
    type?: string;
  },
  userAnswer: number | number[] | string[]
): Promise<boolean> => {
  // 应用题特殊处理 - 返回待批改状态
  if (exercise.type === "application") {
    console.log("应用题提交成功，等待批改");
    return false; // 返回false表示未通过，但前端可特殊处理
  }

  // 检查正确答案是否存在
  if (exercise.correctAnswer === null || exercise.correctAnswer === undefined) {
    console.warn(`${exercise.type}题的正确答案为空，可能是数据配置问题`);
    return false;
  }

  // 只在这一个地方判断答案正确性
  const isCorrect = checkAnswerCorrect(exercise, userAnswer);

  // 如果答错，添加到错题集
  if (!isCorrect) {
    await addToErrorBook(exerciseId, lessonId, exercise, userAnswer);
  }

  return isCorrect;
};

/**
 * 将错题添加到错题集
 */
export const addToErrorBook = async (
  exerciseId: string,
  lessonId: string,
  exercise: {
    question: string;
    options: any;
    correctAnswer: any;
    type?: string;
  },
  userAnswer: number | number[] | string[]
): Promise<void> => {
  try {
    // 不同题型的处理逻辑
    const exerciseType = exercise.type || "choice";

    console.log(`${exerciseType}题答错，添加到错题集`);
    await addToErrorBookApi(
      exerciseId,
      lessonId,
      exercise.question,
      exercise.options,
      exercise.correctAnswer,
      userAnswer,
      exerciseType
    );
  } catch (error) {
    console.error("添加错题失败:", error);
  }
};

/**
 * 提交答题结果后的正确率计算
 */
export const calculateCorrectCount = (
  exercises: Array<{
    id: string;
    type?: string;
    correctAnswer: any;
  }>,
  userAnswers: Record<string, number | number[] | string[] | boolean>
): number => {
  let correct = 0;

  exercises.forEach((exercise) => {
    // 如果该题已回答
    if (userAnswers.hasOwnProperty(exercise.id)) {
      // 如果答案状态直接是布尔值
      if (typeof userAnswers[exercise.id] === "boolean") {
        if (userAnswers[exercise.id] === true) {
          correct++;
        }
      } else {
        // 否则需要通过工具函数判断答案是否正确
        const isCorrect = checkAnswerCorrect(exercise, userAnswers[exercise.id] as number | number[] | string[]);
        if (isCorrect) {
          correct++;
        }
      }
    }
  });

  return correct;
};
