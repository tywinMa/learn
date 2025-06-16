import { message } from 'antd';
import api from './api';

// 单元类型定义
export interface Unit {
  id: string;
  subjectGradeId: number; // 改为关联SubjectGrade的ID
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  color?: string;
  secondaryColor?: string;
  courseIds?: string[]; // 关联的课程ID列表（Course的id是字符串类型）
  createdAt?: string;
  updatedAt?: string;
  // 关联信息
  subjectGrade?: {
    id: number;
    subjectCode: string;
    gradeId: number;
    subject?: {
      id: string;
      code: string;
      name: string;
      color: string;
    };
    grade?: {
      id: number;
      code: string;
      name: string;
      level: 'primary' | 'middle' | 'high';
      levelNumber: number;
    };
  };
}

// 创建单元请求参数类型
export interface CreateUnitParams {
  id: string;
  subjectGradeId: number; // 改为关联SubjectGrade的ID
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
  subjectGradeId?: number; // 改为关联SubjectGrade的ID
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
 * 获取学科的所有单元 (兼容旧接口)
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
 * 获取学科年级的所有单元
 * @param subjectGradeId 学科年级关联ID
 */
export const getUnitsBySubjectGrade = async (subjectGradeId: number): Promise<Unit[]> => {
  try {
    const response = await api({
      url: `/api/admin/units/subject-grade/${subjectGradeId}`,
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
    console.error(`获取学科年级(${subjectGradeId})的单元失败:`, error);
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
 * 批量删除指定学科的所有单元 (兼容旧接口)
 * @param subject 学科代码
 */
export const deleteUnitsBySubject = async (subject: string): Promise<boolean> => {
  try {
    const response = await api({
      url: `/api/admin/units/subject/${subject}`,
      method: 'DELETE'
    });
    
    // API拦截器已经处理了err_no检查，直接判断响应
    if (response !== undefined) {
      console.log(`学科${subject}的所有单元删除成功`);
      message.success('单元删除成功');
      return true;
    } else {
      console.error('API响应数据为空:', response);
      message.error('删除单元失败');
      return false;
    }
  } catch (error) {
    console.error(`删除学科${subject}的单元失败:`, error);
    message.error('删除单元失败');
    return false;
  }
};

/**
 * 批量删除指定学科年级的所有单元
 * @param subjectGradeId 学科年级关联ID
 */
export const deleteUnitsBySubjectGrade = async (subjectGradeId: number): Promise<boolean> => {
  try {
    const response = await api({
      url: `/api/admin/units/subject-grade/${subjectGradeId}`,
      method: 'DELETE'
    });
    
    // API拦截器已经处理了err_no检查，直接判断响应
    if (response !== undefined) {
      console.log(`学科年级${subjectGradeId}的所有单元删除成功`);
      message.success('单元删除成功');
      return true;
    } else {
      console.error('API响应数据为空:', response);
      message.error('删除单元失败');
      return false;
    }
  } catch (error) {
    console.error(`删除学科年级${subjectGradeId}的单元失败:`, error);
    message.error('删除单元失败');
    return false;
  }
}; 