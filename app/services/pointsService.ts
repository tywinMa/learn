// API基础URL
const API_BASE_URL = "http://localhost:3000/api";

// 获取用户积分
export const getUserPoints = async (userId: string): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/points`);
    
    if (!response.ok) {
      throw new Error('获取用户积分失败');
    }
    
    const result = await response.json();
    
    if (result.success) {
      return result.data.points;
    } else {
      throw new Error(result.message || '获取用户积分失败');
    }
  } catch (error) {
    console.error('获取用户积分出错:', error);
    return 0; // 出错时返回0积分
  }
};

// 兑换商品（扣除积分）
export const exchangeItem = async (userId: string, points: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/points/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ points })
    });
    
    if (!response.ok) {
      throw new Error('兑换商品失败');
    }
    
    const result = await response.json();
    
    return result.success;
  } catch (error) {
    console.error('兑换商品出错:', error);
    return false;
  }
};
