import { USER_ID } from "./progressService";

// API基础URL - 根据环境选择不同的URL
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = "http://localhost:3000";  // 使用固定URL

// 本地存储的键名
const ERROR_BOOK_STORAGE_KEY = 'user_error_book';

// 错题结构类型
export interface ErrorBookItem {
  id: string;           // 题目ID
  exerciseId: string;   // 练习ID
  unitId: string;       // 单元ID
  question: string;     // 题目问题
  options?: any;        // 题目选项
  correctAnswer: any;   // 正确答案
  userAnswer: any;      // 用户答案
  type: string;         // 题目类型
  addedAt: number;      // 添加时间戳
  reviewCount: number;  // 复习次数
}

/**
 * 将题目添加到错题集
 */
export const addToErrorBook = async (
  exerciseId: string,
  unitId: string,
  question: string,
  options: any,
  correctAnswer: any,
  userAnswer: any,
  type: string = 'choice'
): Promise<boolean> => {
  try {
    // 创建错题项
    const errorItem: ErrorBookItem = {
      id: `${exerciseId}_${Date.now()}`,
      exerciseId,
      unitId,
      question,
      options,
      correctAnswer,
      userAnswer,
      type,
      addedAt: Date.now(),
      reviewCount: 0
    };

    // 错题已被自动添加到后端，因为我们在提交答案时，后端会自动处理
    // 不再需要额外的API调用来添加错题
    console.log(`错题 ${exerciseId} 已被自动添加到后端错题集`);

    // 如果需要本地缓存，保留此部分逻辑
    let errorBook: ErrorBookItem[] = [];
    const storedErrorBook = localStorage.getItem(ERROR_BOOK_STORAGE_KEY);
    if (storedErrorBook) {
      try {
        errorBook = JSON.parse(storedErrorBook);
      } catch (e) {
        console.error("解析本地错题集失败:", e);
      }
    }

    // 检查是否已存在相同题目
    const existingIndex = errorBook.findIndex(item => item.exerciseId === exerciseId);
    if (existingIndex !== -1) {
      // 更新已存在的错题
      errorBook[existingIndex] = {
        ...errorBook[existingIndex],
        userAnswer,
        addedAt: Date.now()
      };
    } else {
      // 添加新错题
      errorBook.push(errorItem);
    }

    // 保存回本地存储
    localStorage.setItem(ERROR_BOOK_STORAGE_KEY, JSON.stringify(errorBook));
    console.log("错题已添加到本地错题集");
    
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
    // 从后端获取错题集
    try {
      const apiUrl = `${API_BASE_URL}/api/users/${USER_ID}/wrong-exercises`;
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
            userAnswer: null, // 后端目前不存储用户答案
            type: item.exerciseData.type || 'choice',
            addedAt: item.timestamp,
            reviewCount: item.attempts || 0
          }));
        }
      }
      console.warn("从服务器获取错题集失败，将使用本地存储");
    } catch (serverError) {
      console.warn("服务器错题集API调用失败:", serverError);
    }

    // 如果服务器获取失败，使用本地存储
    const storedErrorBook = localStorage.getItem(ERROR_BOOK_STORAGE_KEY);
    if (storedErrorBook) {
      try {
        const errorBook = JSON.parse(storedErrorBook);
        if (Array.isArray(errorBook)) {
          return errorBook;
        }
      } catch (e) {
        console.error("解析本地错题集失败:", e);
      }
    }
    
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
    const exerciseId = errorItemId.split('_')[0];
    
    // 从后端删除错题
    try {
      const apiUrl = `${API_BASE_URL}/api/users/${USER_ID}/wrong-exercises/${exerciseId}`;
      const response = await fetch(apiUrl, {
        method: "DELETE"
      });
      
      if (response.ok) {
        console.log("从服务器错题集删除成功");
        return true;
      }
      console.warn("从服务器删除错题失败，将使用本地存储");
    } catch (serverError) {
      console.warn("服务器错题删除API调用失败:", serverError);
    }

    // 如果服务器删除失败，使用本地存储
    const storedErrorBook = localStorage.getItem(ERROR_BOOK_STORAGE_KEY);
    if (storedErrorBook) {
      try {
        let errorBook = JSON.parse(storedErrorBook);
        if (Array.isArray(errorBook)) {
          errorBook = errorBook.filter(item => item.id !== errorItemId);
          localStorage.setItem(ERROR_BOOK_STORAGE_KEY, JSON.stringify(errorBook));
          console.log("从本地错题集删除成功");
          return true;
        }
      } catch (e) {
        console.error("处理本地错题集失败:", e);
      }
    }
    
    return false;
  } catch (error) {
    console.error("删除错题失败:", error);
    return false;
  }
};

/**
 * 标记错题已复习
 */
export const markErrorItemReviewed = async (errorItemId: string): Promise<boolean> => {
  try {
    // 目前后端不支持这个功能，仅在本地存储中实现
    const storedErrorBook = localStorage.getItem(ERROR_BOOK_STORAGE_KEY);
    if (storedErrorBook) {
      try {
        let errorBook = JSON.parse(storedErrorBook);
        if (Array.isArray(errorBook)) {
          const updatedErrorBook = errorBook.map(item => {
            if (item.id === errorItemId) {
              return {
                ...item,
                reviewCount: (item.reviewCount || 0) + 1
              };
            }
            return item;
          });
          
          localStorage.setItem(ERROR_BOOK_STORAGE_KEY, JSON.stringify(updatedErrorBook));
          console.log("本地更新错题复习状态成功");
          return true;
        }
      } catch (e) {
        console.error("处理本地错题集失败:", e);
      }
    }
    
    return false;
  } catch (error) {
    console.error("更新错题复习状态失败:", error);
    return false;
  }
}; 