import { API_BASE_URL } from '@/constants/apiConfig';

// 年级接口定义
export interface Grade {
  id: number;
  code: string;
  name: string;
  level: 'primary' | 'middle' | 'high';
  levelNumber: number;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 用户年级学科偏好接口
export interface UserGradeSubjectPreference {
  id: number;
  studentId: number;
  subjectCode: string;
  gradeId: number;
  lastAccessTime: string;
  grade?: Grade;
  subject?: {
    code: string;
    name: string;
    color: string;
  };
}

/**
 * 获取学科的可用年级列表
 */
export const getSubjectAvailableGrades = async (subjectCode: string): Promise<Grade[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/subjects/${subjectCode}/grades`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || '获取年级列表失败');
    }
  } catch (error) {
    console.error('获取学科年级列表失败:', error);
    throw error;
  }
};

/**
 * 获取用户的年级学科偏好
 */
export const getUserPreferences = async (studentId: number): Promise<UserGradeSubjectPreference[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/preferences`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || '获取用户偏好失败');
    }
  } catch (error) {
    console.error('获取用户偏好失败:', error);
    throw error;
  }
};

/**
 * 获取用户特定学科的年级偏好
 */
export const getUserSubjectGradePreference = async (studentId: number, subjectCode: string): Promise<UserGradeSubjectPreference | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/preferences/${subjectCode}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      return null; // 没有找到偏好记录
    }
  } catch (error) {
    console.error('获取用户学科年级偏好失败:', error);
    return null;
  }
};

/**
 * 设置或更新用户的年级学科偏好
 */
export const setUserPreference = async (studentId: number, subjectCode: string, gradeId: number): Promise<UserGradeSubjectPreference> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId,
        subjectCode,
        gradeId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || '设置用户偏好失败');
    }
  } catch (error) {
    console.error('设置用户偏好失败:', error);
    throw error;
  }
};

/**
 * 删除用户的年级学科偏好
 */
export const deleteUserPreference = async (studentId: number, subjectCode: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/students/${studentId}/preferences/${subjectCode}`, {
      method: 'DELETE'
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '删除用户偏好失败');
    }
  } catch (error) {
    console.error('删除用户偏好失败:', error);
    throw error;
  }
}; 