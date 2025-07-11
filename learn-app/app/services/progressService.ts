import { API_BASE_URL } from "@/constants/apiConfig";
import { getCurrentStudentId } from "./authService";

// 临时学生ID，实际应用中应该从认证系统获取
export const TEMP_STUDENT_ID = "student1";

// 获取当前学生ID，优先使用认证系统的学生ID
export const getCurrentStudentIdForProgress = async (): Promise<string> => {
  try {
    const authStudentId = await getCurrentStudentId();
    return authStudentId || TEMP_STUDENT_ID;
  } catch (error) {
    console.warn('获取认证学生ID失败，使用默认学生ID:', error);
    return TEMP_STUDENT_ID;
  }
};

// Define and export UnitProgress type
export interface UnitProgress {
  unitId: string;
  totalExercises: number;
  completedExercises: number;
  completionRate: number;
  stars: number;
  unlockNext: boolean; // This field might be part of it
  completed?: boolean; // Add completed field, make it optional for now to ensure compatibility
  studyCount?: number; // 用户学习该单元的次数
  practiceCount?: number; // 用户练习该单元的次数
  // 新增字段
  correctCount?: number; // 用户在该单元正确回答的题目数量
  incorrectCount?: number; // 用户在该单元错误回答的题目数量
  totalAnswerCount?: number; // 用户在该单元总共回答的题目数量
  totalTimeSpent?: number; // 用户在该单元花费的总时间（秒）
  lastStudyTime?: string; // 用户最后一次学习该单元的时间
  lastPracticeTime?: string; // 用户最后一次练习该单元的时间
  averageResponseTime?: number; // 用户回答问题的平均反应时间（秒）
  masteryLevel?: number; // 用户对该单元的掌握程度（0-1之间的浮点数）
  source?: string; // 数据来源
}

// Helper function for promise timeout, ensuring it resolves with expected type or rejects
const withTimeout = <T, E extends Error>(promise: Promise<T>, ms: number, timeoutErrorInstance: E): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(timeoutErrorInstance);
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error); // Pass through original error if promise rejects before timeout
      });
  });
};

// 获取学科单元列表 - 必须传递年级ID
export async function getSubjectUnits(subjectCode: string, gradeId: number) {
  try {
    const apiUrl = `${API_BASE_URL}/api/subjects/${subjectCode}/${gradeId}/units`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`获取学科单元列表失败 (HTTP ${response.status})`);
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "获取学科单元列表失败：服务器未返回数据");
    }
  } catch (error) {
    console.error(`获取学科单元列表出错 (${subjectCode}):`, error);
    throw error;
  }
}

// 获取学生在特定单元的完成情况
export async function getStudentUnitProgress(unitId: string, timeoutMs: number = 5000): Promise<UnitProgress> {
  try {
    // 添加重试逻辑
    const MAX_RETRIES = 2;
    let retries = 0;
    let error;

    while (retries <= MAX_RETRIES) {
      try {
        // 检测简短单元ID格式，匹配所有可能的单元格式
        if (unitId.match(/^\d+-\d+$/)) {
          console.log(`检测到简短单元ID格式: ${unitId}，尝试匹配所有可能的单元格式`);
        }

        const studentId = await getCurrentStudentIdForProgress();
        console.log(`获取学生 ${studentId} 在单元 ${unitId} 的进度`);
        // 使用新的AnswerRecord API端点
        const response = await fetch(`${API_BASE_URL}/api/answer-records/${studentId}/progress/${unitId}`);

        if (!response.ok) {
          // 记录HTTP错误状态
          console.warn(`获取进度失败 (${response.status}): ${unitId}, 重试: ${retries}`);
          throw new Error(`获取用户进度失败 (HTTP ${response.status})`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          return result.data;
        } else {
          throw new Error(result.message || "获取学生进度失败：服务器未返回数据");
        }
      } catch (e) {
        error = e;
        retries++;

        // 如果还有重试次数，等待一段时间后重试
        if (retries <= MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
        }
      }
    }

    // 所有重试都失败了，抛出最后一个错误
    throw error;
  } catch (error) {
    console.error(`获取学生单元进度出错 (${unitId}):`, error);

    // 返回默认值，确保UI不会崩溃
    return {
      unitId,
      totalExercises: 0,
      completedExercises: 0,
      completionRate: 0,
      stars: 0,
      unlockNext: false,
    };
  }
}

// 获取多个单元的完成情况，使用新的批量API
export async function getMultipleUnitProgress(
  unitIds: string[],
  options: { timeout?: number } = {}
): Promise<Record<string, UnitProgress>> {
  if (!unitIds || unitIds.length === 0) {
    console.log("[getMultipleUnitProgress] No unitIds provided, returning empty map.");
    return {};
  }

  const timeout = options.timeout || 20000;
  const defaultProgressFallback = (unitId: string): UnitProgress => ({
    unitId,
    totalExercises: 0,
    completedExercises: 0,
    completionRate: 0,
    stars: 0,
    unlockNext: false,
    completed: false,
  });

  try {
    console.log(`[getMultipleUnitProgress] Fetching progress for ${unitIds.length} units via batch API.`);
    const studentId = await getCurrentStudentIdForProgress();
    // 使用新的AnswerRecord API端点
    const fetchPromise = fetch(`${API_BASE_URL}/api/answer-records/${studentId}/progress/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitIds }),
    });

    // The promise from withTimeout will either resolve with a Response or reject with an Error (either timeout or fetch error)
    const response = await withTimeout(fetchPromise, timeout, new Error(`批量获取单元进度请求超时 (${timeout}ms)`));

    // If we reach here, 'response' is guaranteed to be a Response object because errors would be caught by the catch block.
    // However, the linter might not infer this perfectly across await boundaries with generic helpers.
    // To be absolutely explicit for the linter and type safety:
    if (response instanceof Error) {
      // This block should ideally not be reached if withTimeout rejects on error as intended
      console.error(
        "[getMultipleUnitProgress] withTimeout resolved with an Error object, this is unexpected.",
        response
      );
      throw response;
    }

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        /* ignore parsing error */
      }
      console.error(
        `[getMultipleUnitProgress] Batch API request failed (HTTP ${response.status})`,
        response.statusText,
        errorBody
      );
      throw new Error(
        `批量获取进度失败 (HTTP ${response.status}${errorBody?.message ? ": " + errorBody.message : ""})`
      );
    }

    const result = await response.json();

    if (result.success && result.data) {
      const progressMap: Record<string, UnitProgress> = {};
      for (const unitId of unitIds) {
        if (result.data[unitId] && !result.data[unitId].error) {
          progressMap[unitId] = result.data[unitId];
        } else {
          if (result.data[unitId] && result.data[unitId].error) {
            console.warn(
              `[getMultipleUnitProgress] Error for unit ${unitId} in batch response: ${result.data[unitId].error}`
            );
          }
          progressMap[unitId] = defaultProgressFallback(unitId);
        }
      }
      console.log(
        `[getMultipleUnitProgress] Successfully processed batch response for ${Object.keys(progressMap).length} units.`
      );
      return progressMap;
    } else {
      console.error("[getMultipleUnitProgress] Batch API call was not successful or data is missing:", result.message);
      throw new Error(result.message || "批量获取进度失败：服务器返回了非成功状态或无效数据");
    }
  } catch (error: any) {
    console.error("[getMultipleUnitProgress] Error during batch progress fetch:", error.message);
    const errorProgressMap: Record<string, UnitProgress> = {};
    unitIds.forEach((unitId) => {
      errorProgressMap[unitId] = defaultProgressFallback(unitId);
    });
    return errorProgressMap;
  }
}

// 根据学科和年级获取学生的进度数据 - 必须传递年级ID
export async function getStudentProgressBySubject(subjectCode: string, gradeId: number, studentId?: string) {
  try {
    const currentStudentId = studentId || await getCurrentStudentIdForProgress();
    console.log(`获取学生 ${currentStudentId} 在学科 ${subjectCode} 年级 ${gradeId} 的进度`);
    
    const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectCode}/${gradeId}/units`);
    
    if (!response.ok) {
      throw new Error(`获取学科单元列表失败 (HTTP ${response.status})`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      const units = result.data;
      const unitIds = units.map((unit: any) => unit.id); // 直接使用单元的完整ID
      
      // 批量获取这些单元的进度
      const progressMap = await getMultipleUnitProgress(unitIds);
      
      return units.map((unit: any) => {
        const progress = progressMap[unit.id] || {
          unitId: unit.id,
          totalExercises: 0,
          completedExercises: 0,
          completionRate: 0,
          stars: 0,
          unlockNext: false,
        };
        
        return {
          ...unit,
          progress,
        };
      });
    } else {
      throw new Error(result.message || "获取学科单元列表失败：服务器未返回数据");
    }
  } catch (error) {
    console.error(`获取学科进度出错 (${subjectCode}, 年级 ${gradeId}):`, error);
    throw error;
  }
}

// 向后兼容的别名
export const getUserUnitProgress = getStudentUnitProgress;
export const getUserProgressBySubject = getStudentProgressBySubject;
