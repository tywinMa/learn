// 用户进度服务
// 处理与用户进度相关的API请求

// API基础URL
const API_BASE_URL = "http://localhost:3000/api";

// 临时用户ID，实际应用中应该从认证系统获取
export const USER_ID = "user1";

// 获取用户在特定单元的完成情况
export async function getUserUnitProgress(unitId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${USER_ID}/progress/${unitId}`);

    if (!response.ok) {
      throw new Error("获取用户进度失败");
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "获取用户进度失败");
    }
  } catch (error) {
    console.error("获取用户进度出错:", error);
    // 返回默认值
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

// 获取多个单元的完成情况
export async function getMultipleUnitProgress(unitIds: string[]) {
  try {
    const progressPromises = unitIds.map((unitId) => getUserUnitProgress(unitId));
    const progressResults = await Promise.all(progressPromises);

    // 将结果转换为以unitId为键的对象
    const progressMap: Record<string, any> = {};
    progressResults.forEach((progress) => {
      progressMap[progress.unitId] = progress;
    });

    return progressMap;
  } catch (error) {
    console.error("获取多个单元进度出错:", error);
    return {};
  }
}
