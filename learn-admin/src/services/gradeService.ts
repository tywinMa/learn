import api from './api';

// 年级数据接口
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

// 学科年级关联接口
export interface SubjectGrade {
  id: number;
  subjectCode: string;
  gradeId: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    code: string;
    name: string;
    color: string;
  };
  grade?: Grade;
}

// 创建年级数据接口
export interface CreateGradeData {
  code: string;
  name: string;
  level: 'primary' | 'middle' | 'high';
  levelNumber: number;
  description?: string;
  order?: number;
}

// 更新年级数据接口
export interface UpdateGradeData extends Partial<CreateGradeData> {
  isActive?: boolean;
}

// 添加学科年级关联数据接口
export interface AddSubjectGradeData {
  gradeId: number;
  subjectCode: string;
  order?: number;
}

/**
 * 获取所有年级列表
 */
export const getGrades = async (): Promise<Grade[]> => {
  const response = await api({
    url: '/api/admin/grades',
    method: 'GET'
  });
  return response.data;
};

/**
 * 根据ID获取年级详情
 */
export const getGradeById = async (id: number): Promise<Grade> => {
  const response = await api({
    url: `/api/admin/grades/${id}`,
    method: 'GET'
  });
  return response.data;
};

/**
 * 创建年级
 */
export const createGrade = async (data: CreateGradeData): Promise<Grade> => {
  const response = await api({
    url: '/api/admin/grades',
    method: 'POST',
    data
  });
  return response.data;
};

/**
 * 更新年级
 */
export const updateGrade = async (id: number, data: UpdateGradeData): Promise<Grade> => {
  const response = await api({
    url: `/api/admin/grades/${id}`,
    method: 'PUT',
    data
  });
  return response.data;
};

/**
 * 删除年级
 */
export const deleteGrade = async (id: number): Promise<void> => {
  await api({
    url: `/api/admin/grades/${id}`,
    method: 'DELETE'
  });
};

/**
 * 获取年级的学科关联
 */
export const getGradeSubjects = async (gradeId: number): Promise<SubjectGrade[]> => {
  const response = await api({
    url: `/api/admin/grades/${gradeId}/subjects`,
    method: 'GET'
  });
  return response.data;
};

/**
 * 添加年级学科关联
 */
export const addGradeSubject = async (data: AddSubjectGradeData): Promise<SubjectGrade> => {
  const response = await api({
    url: '/api/admin/grade-subjects',
    method: 'POST',
    data
  });
  return response.data;
};

/**
 * 删除年级学科关联
 */
export const removeGradeSubject = async (id: number): Promise<void> => {
  await api({
    url: `/api/admin/grade-subjects/${id}`,
    method: 'DELETE'
  });
}; 