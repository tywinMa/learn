import { API_BASE_URL } from "@/constants/apiConfig";
import { getCurrentStudentIdForProgress } from "./progressService";

// 获取学生积分
export const getStudentPoints = async (studentId?: string): Promise<number> => {
  try {
    const currentStudentId = studentId || await getCurrentStudentIdForProgress();
    const response = await fetch(`${API_BASE_URL}/api/students/${currentStudentId}/points`);

    if (!response.ok) {
      throw new Error("获取学生积分失败");
    }

    const result = await response.json();

    if (result.success) {
      return result.data.points;
    } else {
      throw new Error(result.message || "获取学生积分失败");
    }
  } catch (error) {
    console.error("获取学生积分出错:", error);
    return 0; // 出错时返回0积分
  }
};

// 兑换商品（扣除积分）
export const exchangeItem = async (points: number, studentId?: string): Promise<boolean> => {
  try {
    const currentStudentId = studentId || await getCurrentStudentIdForProgress();
    const response = await fetch(`${API_BASE_URL}/api/students/${currentStudentId}/points/deduct`, {
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

// 向后兼容的函数
export const getUserPoints = getStudentPoints;
