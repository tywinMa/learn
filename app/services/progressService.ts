import { API_BASE_URL } from "@/constants/apiConfig";

// 临时用户ID，实际应用中应该从认证系统获取
export const USER_ID = "user1";

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
  // Add other fields if they exist based on actual API response
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

// 获取学科单元列表
export async function getSubjectUnits(subjectCode: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectCode}/units`);

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

// 获取用户在特定单元的完成情况
export async function getUserUnitProgress(unitId: string, timeoutMs: number = 5000): Promise<UnitProgress> {
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

        console.log(`获取用户 ${USER_ID} 在单元 ${unitId} 的进度`);
        const response = await fetch(`${API_BASE_URL}/api/users/${USER_ID}/progress/${unitId}`);

        if (!response.ok) {
          // 记录HTTP错误状态
          console.warn(`获取进度失败 (${response.status}): ${unitId}, 重试: ${retries}`);
          throw new Error(`获取用户进度失败 (HTTP ${response.status})`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          return result.data;
        } else {
          throw new Error(result.message || "获取用户进度失败：服务器未返回数据");
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
    console.error(`获取用户单元进度出错 (${unitId}):`, error);

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
    const fetchPromise = fetch(`${API_BASE_URL}/api/users/${USER_ID}/progress/batch`, {
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

// 根据学科获取用户的全部进度数据
export async function getUserProgressBySubject(subjectCode: string, userId: string = USER_ID) {
  try {
    // 先获取学科的所有单元
    const units = await getSubjectUnits(subjectCode);

    if (!units || units.length === 0) {
      console.log(`学科 ${subjectCode} 没有单元数据`);
      return {};
    }

    // 收集所有单元ID
    const unitIds = units.map((unit: any) => unit.code);

    // 获取这些单元的进度
    return await getMultipleUnitProgress(unitIds);
  } catch (error) {
    console.error(`获取学科 ${subjectCode} 的用户进度时发生错误:`, error);
    return {};
  }
}
