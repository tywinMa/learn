import api from "./api";
import { message } from "antd";

// 习题组接口
export interface ExerciseGroup {
  id: string;
  name: string;
  description?: string;
  subject: string;
  exerciseIds: string[];
  isActive: boolean;
  exerciseCount?: number;
  createdAt: string;
  updatedAt: string;
  Subject?: {
    id: string;
    name: string;
    code: string;
  };
  exercises?: Array<{
    id: string;
    title: string;
    type: string;
    difficulty: number;
    subject: string;
  }>;
}

// 获取习题组列表
export const getExerciseGroups = async (params?: {
  page?: number;
  limit?: number;
  name?: string;
  subject?: string;
}): Promise<{
  exerciseGroups: ExerciseGroup[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    console.log('🌐 exerciseGroupService - 发送请求，参数:', params);
    const response = await api.get('/api/admin/exercise-groups', { params });
    console.log('🎯 exerciseGroupService - 原始响应:', response);
    // API拦截器已经处理过响应，直接返回
    return response as unknown as {
      exerciseGroups: ExerciseGroup[];
      total: number;
      totalPages: number;
      currentPage: number;
    };
  } catch (error) {
    console.error('❌ exerciseGroupService - 获取习题组列表失败:', error);
    message.error('获取习题组列表失败');
    return {
      exerciseGroups: [],
      total: 0,
      totalPages: 0,
      currentPage: 1
    };
  }
};

// 根据学科获取习题组列表
export const getExerciseGroupsBySubject = async (subjectCode: string): Promise<ExerciseGroup[]> => {
  try {
    const response = await api.get(`/api/admin/exercise-groups/subject/${subjectCode}`);
    return response.data;
  } catch (error) {
    console.error(`获取学科(${subjectCode})习题组列表失败:`, error);
    message.error('获取习题组列表失败');
    return [];
  }
};

// 获取习题组详情
export const getExerciseGroupById = async (id: string): Promise<ExerciseGroup | null> => {
  try {
    const response = await api.get(`/api/admin/exercise-groups/${id}`);
    return response.data;
  } catch (error) {
    console.error(`获取习题组(ID:${id})详情失败:`, error);
    message.error('获取习题组详情失败');
    return null;
  }
};

// 创建习题组
export const createExerciseGroup = async (data: Omit<ExerciseGroup, 'createdAt' | 'updatedAt' | 'exerciseCount' | 'Subject' | 'exercises'>): Promise<boolean> => {
  try {
    await api.post('/api/admin/exercise-groups', data);
    message.success('习题组创建成功');
    return true;
  } catch (error: any) {
    console.error('创建习题组失败:', error);
    const errorMsg = error.response?.data?.message || '创建习题组失败';
    message.error(errorMsg);
    return false;
  }
};

// 更新习题组
export const updateExerciseGroup = async (id: string, data: Partial<Omit<ExerciseGroup, 'id' | 'createdAt' | 'updatedAt' | 'exerciseCount' | 'Subject' | 'exercises'>>): Promise<boolean> => {
  try {
    await api.put(`/api/admin/exercise-groups/${id}`, data);
    message.success('习题组更新成功');
    return true;
  } catch (error: any) {
    console.error(`更新习题组(ID:${id})失败:`, error);
    const errorMsg = error.response?.data?.message || '更新习题组失败';
    message.error(errorMsg);
    return false;
  }
};

// 删除习题组
export const deleteExerciseGroup = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/admin/exercise-groups/${id}`);
    message.success('习题组删除成功');
    return true;
  } catch (error: any) {
    console.error(`删除习题组(ID:${id})失败:`, error);
    const errorMsg = error.response?.data?.message || '删除习题组失败';
    message.error(errorMsg);
    return false;
  }
}; 