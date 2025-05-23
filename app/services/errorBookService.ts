import { API_BASE_URL } from "@/constants/apiConfig";
import { USER_ID } from "./progressService";

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
 * 获取用户错题集
 */
export const getErrorBook = async (): Promise<ErrorBookItem[]> => {
  try {
    const apiUrl = `${API_BASE_URL}/api/answer-records/${USER_ID}/wrong-exercises`;
    const response = await fetch(apiUrl);

    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        console.log("从服务器获取错题集成功");
        // 将后端返回的数据格式转换为前端期望的格式
        return result.data.map((item: any) => ({
          id: `${item.exerciseData.id}_${item.timestamp}`,
          exerciseId: item.exerciseData.id,
          unitId: item.unitId,
          question: item.exerciseData.question,
          options: item.exerciseData.options,
          correctAnswer: item.exerciseData.correctAnswer,
          userAnswer: item.userAnswer || null,
          type: item.exerciseData.type || "choice",
          addedAt: item.timestamp,
          reviewCount: item.attempts || 0,
        }));
      }
    }
    
    console.warn("从服务器获取错题集失败");
    return [];
  } catch (error) {
    console.error("获取错题集失败:", error);
    return [];
  }
};

/**
 * 从错题集中移除题目
 */
export const removeFromErrorBook = async (errorItemId: string): Promise<boolean> => {
  try {
    // 从错题ID提取exerciseId
    const exerciseId = errorItemId.split("_")[0];

    const apiUrl = `${API_BASE_URL}/api/answer-records/${USER_ID}/wrong-exercises/${exerciseId}`;
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
