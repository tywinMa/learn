// 用户进度服务
// 处理与用户进度相关的API请求

// 根据环境选择不同的API基础URL
const isDevelopment = process.env.NODE_ENV === 'development';
// API基础URL - 本地开发使用IP地址，生产环境使用相对路径
const API_BASE_URL = isDevelopment 
  ? "http://localhost:3000/api"  // 开发环境
  : "/api";  // 生产环境，使用相对路径

// 临时用户ID，实际应用中应该从认证系统获取
export const USER_ID = "user1";

// 添加超时处理函数
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      console.warn(`请求超时(${timeoutMs}ms)`);
      // 不抛出错误，而是返回fallback值
      reject(new Error('请求超时'));
    }, timeoutMs);
  });

  return Promise.race([
    promise.then(result => {
      clearTimeout(timeoutHandle);
      return result;
    }),
    timeoutPromise
  ]).catch(() => {
    clearTimeout(timeoutHandle);
    return fallback;
  });
};

// 获取用户在特定单元的完成情况
export async function getUserUnitProgress(unitId: string, timeoutMs: number = 5000) {
  try {
    // 添加重试逻辑
    const MAX_RETRIES = 2;
    let retries = 0;
    let error;

    while (retries <= MAX_RETRIES) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${USER_ID}/progress/${unitId}`);

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
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
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

// 获取多个单元的完成情况，增加超时和优先级功能
export async function getMultipleUnitProgress(
  unitIds: string[], 
  options: { timeout?: number } = {}
) {
  try {
    // 设置默认超时时间
    const timeout = options.timeout || 5000;
    
    // 默认返回值对象
    const defaultProgress = (unitId: string) => ({
      unitId,
      totalExercises: 0,
      completedExercises: 0,
      completionRate: 0,
      stars: 0,
      unlockNext: false,
    });
    
    // 并行获取所有进度，但添加错误处理和超时控制
    const progressPromises = unitIds.map(unitId => 
      withTimeout(
        getUserUnitProgress(unitId), 
        timeout,
        defaultProgress(unitId)
      ).catch(err => {
        console.error(`获取单元 ${unitId} 进度失败:`, err);
        return defaultProgress(unitId);
      })
    );
    
    const progressResults = await Promise.all(progressPromises);

    // 将结果转换为以unitId为键的对象
    const progressMap: Record<string, any> = {};
    progressResults.forEach((progress) => {
      progressMap[progress.unitId] = progress;
    });

    return progressMap;
  } catch (error) {
    console.error("获取多个单元进度时发生错误:", error);
    return {};
  }
}
