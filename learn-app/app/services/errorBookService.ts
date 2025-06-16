import { API_BASE_URL } from "@/constants/apiConfig";
import { getCurrentStudentIdForProgress } from "./progressService";

// 错题结构类型
export interface ErrorBookItem {
  id: string; // 题目ID
  exerciseId: string; // 练习ID
  unitId: string; // 单元ID
  question: string; // 题目问题
  options?: any; // 题目选项
  correctAnswer: any; // 正确答案
  userAnswer: any; // 用户答案
  type: string; // 题目类型
  addedAt: number; // 添加时间戳
  reviewCount: number; // 复习次数
}

// 答题记录接口
export interface AnswerRecord {
  id: string;
  attemptNumber: number;
  wrongAnswerType: string;
  submitTime: string;
  responseTime: number;
}

// 练习题接口
export interface ExerciseData {
  id: string;
  title: string;
  type: string;
  question: string;
  options?: any;
  correctAnswer: any;
  explanation?: string;
  difficulty?: number;
}

// 错题数据接口
export interface WrongExercise {
  exerciseData: ExerciseData;
  answerRecord: AnswerRecord;
  unitId: string;
  attempts: number;
  timestamp: number;
}

// 错题筛选参数接口
export interface WrongExerciseFilters {
  subject?: string;
  unitId?: string;
  exerciseType?: string;
  difficulty?: number;
  timeRange?: number; // 天数
}

/**
 * 将题目添加到错题集
 * 注意：错题会在答题提交时自动添加到后端，此函数主要用于兼容性
 */
export const addToErrorBook = async (
  exerciseId: string,
  unitId: string,
  question: string,
  options: any,
  correctAnswer: any,
  userAnswer: any,
  type: string = "choice"
): Promise<boolean> => {
  try {
    // 错题已在答题提交时自动添加到后端
    console.log(`错题 ${exerciseId} 已被自动添加到后端错题集`);
    return true;
  } catch (error) {
    console.error("添加错题失败:", error);
    return false;
  }
};

/**
 * 获取用户的错题列表
 */
export const getStudentWrongExercises = async (
  filters?: WrongExerciseFilters
): Promise<WrongExercise[]> => {
  try {
    const studentId = await getCurrentStudentIdForProgress();
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (filters?.subject) queryParams.append('subject', filters.subject);
    if (filters?.unitId) queryParams.append('unitId', filters.unitId);
    if (filters?.exerciseType) queryParams.append('exerciseType', filters.exerciseType);
    if (filters?.difficulty) queryParams.append('difficulty', filters.difficulty.toString());
    if (filters?.timeRange) queryParams.append('timeRange', filters.timeRange.toString());

    const apiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/wrong-exercises`;
    const url = queryParams.toString() ? `${apiUrl}?${queryParams.toString()}` : apiUrl;

    console.log('获取错题列表 URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`获取错题列表失败 (HTTP ${response.status})`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "获取错题列表失败：服务器未返回数据");
    }
  } catch (error) {
    console.error("获取错题列表出错:", error);
    throw error;
  }
};

/**
 * 标记错题为已掌握（重新答对）
 */
export const markWrongExerciseAsMastered = async (exerciseId: string): Promise<boolean> => {
  try {
    const studentId = await getCurrentStudentIdForProgress();
    const apiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/wrong-exercises/${exerciseId}`;

    console.log('标记错题为已掌握 URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`标记错题为已掌握失败 (HTTP ${response.status})`);
    }

    const result = await response.json();

    if (result.success) {
      console.log(`错题 ${exerciseId} 已标记为掌握`);
      return true;
    } else {
      throw new Error(result.message || "标记错题为已掌握失败");
    }
  } catch (error) {
    console.error("标记错题为已掌握出错:", error);
    return false;
  }
};

/**
 * 从错题集中移除题目
 */
export const removeFromErrorBook = async (errorItemId: string): Promise<boolean> => {
  try {
    // 从错题ID提取exerciseId
    const exerciseId = errorItemId.split("_")[0];

    const studentId = await getCurrentStudentIdForProgress();
    const apiUrl = `${API_BASE_URL}/api/answer-records/${studentId}/wrong-exercises/${exerciseId}`;
    const response = await fetch(apiUrl, {
      method: "DELETE",
    });

    if (response.ok) {
      console.log("从服务器错题集删除成功");
      return true;
    }
    
    console.warn("从服务器删除错题失败");
    return false;
  } catch (error) {
    console.error("删除错题失败:", error);
    return false;
  }
};

/**
 * 标记错题已复习
 * 注意：当前后端不支持此功能，可以在未来扩展
 */
export const markErrorItemReviewed = async (errorItemId: string): Promise<boolean> => {
  try {
    // TODO: 实现后端API支持错题复习标记
    console.log("标记错题复习功能暂未实现");
    return false;
  } catch (error) {
    console.error("更新错题复习状态失败:", error);
    return false;
  }
};

// 向后兼容的函数
export const getErrorBook = async (): Promise<ErrorBookItem[]> => {
  try {
    const wrongExercises = await getStudentWrongExercises();
    return wrongExercises.map((item) => ({
      id: `${item.exerciseData.id}_${item.timestamp}`,
      exerciseId: item.exerciseData.id,
      unitId: item.unitId,
      question: item.exerciseData.question,
      options: item.exerciseData.options,
      correctAnswer: item.exerciseData.correctAnswer,
      userAnswer: null, // 在新数据结构中暂不提供
      type: item.exerciseData.type || "choice",
      addedAt: item.timestamp,
      reviewCount: item.attempts || 0,
    }));
  } catch (error) {
    console.error("获取错题集失败:", error);
    return [];
  }
};
