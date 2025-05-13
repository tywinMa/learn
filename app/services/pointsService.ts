// 根据环境选择不同的API基础URL
// 本地开发时使用绝对URL，生产环境使用相对URL
const isDevelopment = process.env.NODE_ENV === "development";
// API基础URL - 本地开发使用IP地址，生产环境使用相对路径
const API_BASE_URL = "http://101.126.135.102:3000"; // 使用固定URL

// 获取用户积分
export const getUserPoints = async (userId: string): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/points`);

    if (!response.ok) {
      throw new Error("获取用户积分失败");
    }

    const result = await response.json();

    if (result.success) {
      return result.data.points;
    } else {
      throw new Error(result.message || "获取用户积分失败");
    }
  } catch (error) {
    console.error("获取用户积分出错:", error);
    return 0; // 出错时返回0积分
  }
};

// 兑换商品（扣除积分）
export const exchangeItem = async (userId: string, points: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/points/deduct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ points }),
    });

    if (!response.ok) {
      throw new Error("兑换商品失败");
    }

    const result = await response.json();

    return result.success;
  } catch (error) {
    console.error("兑换商品出错:", error);
    return false;
  }
};
