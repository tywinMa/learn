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

  console.log("判断答案正确性:", exercise.id, userAnswer);

  // 根据题型判断答案是否正确
  switch (exercise.type || "choice") {
    case "choice":
      // 选择题 - 直接比较索引
      return userAnswer === exercise.correctAnswer;

    case "matching":
      // 匹配题 - 比较数组
      if (Array.isArray(userAnswer) && Array.isArray(exercise.correctAnswer)) {
        return JSON.stringify(userAnswer) === JSON.stringify(exercise.correctAnswer);
      }
      return false;

    case "drag_drop":
      // 拖拽题 - 比较数组
      if (Array.isArray(userAnswer) && Array.isArray(exercise.correctAnswer)) {
        return JSON.stringify(userAnswer) === JSON.stringify(exercise.correctAnswer);
      }
      return false;

    case "fill_blank":
      // 填空题 - 逐个比较填入的答案
      if (Array.isArray(userAnswer) && Array.isArray(exercise.correctAnswer)) {
        return (userAnswer as string[]).every((answer, index) => answer.trim() === exercise.correctAnswer[index]);
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
