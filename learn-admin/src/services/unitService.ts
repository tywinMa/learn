import { message } from 'antd';
import api from './api';

// 单元类型定义
export interface Unit {
  id: string;
  subject: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  color?: string;
  secondaryColor?: string;
  courseIds?: string[]; // 关联的课程ID列表（Course的id是字符串类型）
  createdAt?: string;
  updatedAt?: string;
}

// 创建单元请求参数类型
export interface CreateUnitParams {
  id: string;
  subject: string;
  title: string;
  description?: string;
  order?: number;
  isPublished?: boolean;
  color?: string;
  secondaryColor?: string;
  courseIds?: string[]; // 关联的课程ID列表（Course的id是字符串类型）
}

// 更新单元请求参数类型
export interface UpdateUnitParams {
  subject?: string;
  title?: string;
  description?: string;
  order?: number;
  isPublished?: boolean;
  color?: string;
  secondaryColor?: string;
  courseIds?: string[]; // 关联的课程ID列表（Course的id是字符串类型）
}

// API响应类型
interface ApiResponse<T> {
  err_no: number;
  message?: string;
  data: T;
}

/**
 * 获取所有单元
 */
export const getAllUnits = async (): Promise<Unit[]> => {
  try {
    const response = await api({
      url: '/api/admin/units',
      method: 'GET'
    });
    
    // API拦截器已经处理了err_no检查，直接返回data
    if (Array.isArray(response)) {
      return response as Unit[];
    } else {
      console.error('API响应格式错误:', response);
      return [];
    }
  } catch (error) {
    console.error('获取所有单元失败:', error);
    message.error('获取单元列表失败');
    return [];
  }
};

/**
 * 获取学科的所有单元
 * @param subject 学科代码
 */
export const getUnitsBySubject = async (subject: string): Promise<Unit[]> => {
  try {
    const response = await api({
      url: `/api/admin/units/subject/${subject}`,
      method: 'GET'
    });
    
    // API拦截器已经处理了err_no检查，直接返回data
    if (Array.isArray(response)) {
      return response as Unit[];
    } else {
      console.error('API响应格式错误:', response);
      return [];
    }
  } catch (error) {
    console.error(`获取学科(${subject})的单元失败:`, error);
    message.error('获取单元列表失败');
    return [];
  }
};

/**
 * 获取单个单元详情
 * @param id 单元ID
 */
export const getUnitById = async (id: string): Promise<Unit | null> => {
  try {
    const response = await api({
      url: `/api/admin/units/${id}`,
      method: 'GET'
    });
    
    // API拦截器已经处理了err_no检查，直接返回data
    if (response) {
      return response as unknown as Unit;
    } else {
      console.error('API响应数据为空:', response);
      return null;
    }
  } catch (error) {
    console.error(`获取单元(ID:${id})详情失败:`, error);
    message.error('获取单元详情失败');
    return null;
  }
};

/**
 * 创建单元
 * @param unitData 单元数据
 */
export const createUnit = async (unitData: CreateUnitParams): Promise<Unit | null> => {
  try {
    const response = await api({
      url: '/api/admin/units',
      method: 'POST',
      data: unitData
    });
    
    // API拦截器已经处理了err_no检查，直接返回data
    if (response) {
      message.success('单元创建成功');
      return response as unknown as Unit;
    } else {
      console.error('API响应数据为空:', response);
      message.error('创建单元失败');
      return null;
    }
  } catch (error) {
    console.error('创建单元失败:', error);
    message.error('创建单元失败');
    return null;
  }
};

/**
 * 更新单元
 * @param id 单元ID
 * @param unitData 更新的单元数据
 */
export const updateUnit = async (id: string, unitData: UpdateUnitParams): Promise<Unit | null> => {
  try {
    const response = await api({
      url: `/api/admin/units/${id}`,
      method: 'PUT',
      data: unitData
    });
    
    // API拦截器已经处理了err_no检查，直接返回data
    if (response) {
      message.success('单元更新成功');
      return response as unknown as Unit;
    } else {
      console.error('API响应数据为空:', response);
      message.error('更新单元失败');
      return null;
    }
  } catch (error) {
    console.error(`更新单元(ID:${id})失败:`, error);
    message.error('更新单元失败');
    return null;
  }
};

/**
 * 删除单元
 * @param id 单元ID
 */
export const deleteUnit = async (id: string): Promise<boolean> => {
  try {
    const response = await api({
      url: `/api/admin/units/${id}`,
      method: 'DELETE'
    });
    
    // API拦截器已经处理了err_no检查，直接判断响应
    if (response !== undefined) {
      console.log(`单元${id}删除成功`);
      return true;
    } else {
      console.error('API响应数据为空:', response);
      message.error('删除单元失败');
      return false;
    }
  } catch (error) {
    console.error(`删除单元(ID:${id})失败:`, error);
    message.error('删除单元失败');
    return false;
  }
};

/**
 * 删除指定学科的所有单元（使用批量删除接口）
 * @param subject 学科代码
 */
export const deleteUnitsBySubject = async (subject: string): Promise<boolean> => {
  try {
    console.log(`开始批量删除学科${subject}的所有单元`);
    
    const response = await api({
      url: `/api/admin/units/subject/${subject}`,
      method: 'DELETE'
    });
    
    // API拦截器已经处理了err_no检查，直接判断响应
    if (response && typeof response === 'object') {
      const { deletedCount } = response as unknown as { deletedCount: number; subject: string };
      console.log(`学科${subject}批量删除成功，删除了${deletedCount}个单元`);
      message.success(`成功删除${deletedCount}个单元`);
      return true;
    } else {
      console.error('API响应格式错误:', response);
      message.error('批量删除失败');
      return false;
    }
  } catch (error) {
    console.error(`批量删除学科${subject}的单元失败:`, error);
    message.error(`删除学科${subject}的单元失败`);
    return false;
  }
}; 