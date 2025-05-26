import { message } from 'antd';
import api from './api';

// 学生类型定义
export interface Student {
  id: number;
  studentId: string;
  name: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  grade?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  totalPoints: number;
  currentLevel: number;
  totalStudyTime: number;
  consecutiveDays: number;
  teacherId?: number;
  settings?: any;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  teacher?: {
    id: number;
    name: string;
    email: string;
  };
}

// 学生创建/更新数据类型
export interface StudentFormData {
  studentId: string;
  password?: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  grade?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string;
  teacherId?: number;
  status?: 'active' | 'inactive' | 'suspended';
  remarks?: string;
}

// API响应格式
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// 分页响应格式
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    students: T[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
}

// 课程进度类型
export interface CourseProgress {
  courseId: string;
  courseName: string;
  subjectName: string;
  totalUnits: number;
  completedUnits: number;
  totalStars: number;
  maxStars: number;
  totalTimeSpent: number;
  masteryLevel: number;
  progressPercentage: number;
  units: Array<{
    unitId: string;
    unitName: string;
    completed: boolean;
    stars: number;
    masteryLevel: number;
    totalTimeSpent: number;
    correctCount: number;
    incorrectCount: number;
  }>;
}

// 学生进度概览类型
export interface StudentProgressOverview {
  student: {
    id: number;
    studentId: string;
    name: string;
    email?: string;
    teacher?: {
      id: number;
      name: string;
      email: string;
    };
  };
  courseProgress: CourseProgress[];
}

// 错题统计类型
export interface WrongExerciseStats {
  Exercise: {
    id: string;
    question: string;
    type: string;
    options: any;
    correctAnswer: any;
  };
  Course: {
    id: string;
    title: string;
  };
  errorCount: number;
  averageResponseTime: number;
  lastErrorTime: string;
  errorTypes: string[];
  userAnswers: any[];
}

// 时间分析类型
export interface TimeAnalysis {
  dailyStats: Array<{
    date: string;
    studyTime: number;
    exerciseCount: number;
    correctRate: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    studyTime: number;
    exerciseCount: number;
    correctRate: number;
  }>;
  weeklyStats: Array<{
    weekday: number;
    weekdayName: string;
    studyTime: number;
    exerciseCount: number;
    correctRate: number;
  }>;
  totalStats: {
    totalStudyTime: number;
    totalExercises: number;
    averageCorrectRate: number;
    studyDays: number;
    averageDailyTime: number;
  };
}

/**
 * 获取所有学生列表
 */
export const getAllStudents = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  teacherId?: number;
}): Promise<{
  students: Student[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}> => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.teacherId) searchParams.append('teacherId', params.teacherId.toString());
    
    const url = `/api/admin/students${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await api.get<PaginatedResponse<Student>>(url);
    
    if (response.data.success) {
      return {
        students: response.data.data.students,
        pagination: response.data.data.pagination
      };
    } else {
      throw new Error('获取学生列表失败');
    }
  } catch (error: any) {
    console.error('获取学生列表失败:', error);
    message.error(error.message || '获取学生列表失败');
    return { students: [] };
  }
};

/**
 * 获取单个学生信息
 */
export const getStudentById = async (studentId: number): Promise<Student | null> => {
  try {
    const response = await api.get<ApiResponse<Student>>(`/api/admin/students/${studentId}`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取学生信息失败');
    }
  } catch (error: any) {
    console.error(`获取学生(ID:${studentId})信息失败:`, error);
    message.error(error.message || '获取学生信息失败');
    return null;
  }
};

/**
 * 创建学生
 */
export const createStudent = async (studentData: StudentFormData): Promise<Student | null> => {
  try {
    const response = await api.post<ApiResponse<Student>>('/api/admin/students', studentData);
    
    if (response.data.success) {
      message.success(response.data.message || '学生创建成功');
      return response.data.data;
    } else {
      throw new Error(response.data.message || '创建学生失败');
    }
  } catch (error: any) {
    console.error('创建学生失败:', error);
    message.error(error.message || '创建学生失败');
    return null;
  }
};

/**
 * 更新学生信息
 */
export const updateStudent = async (studentId: number, studentData: Partial<StudentFormData>): Promise<Student | null> => {
  try {
    const response = await api.put<ApiResponse<Student>>(`/api/admin/students/${studentId}`, studentData);
    
    if (response.data.success) {
      message.success(response.data.message || '学生信息更新成功');
      return response.data.data;
    } else {
      throw new Error(response.data.message || '更新学生信息失败');
    }
  } catch (error: any) {
    console.error(`更新学生(ID:${studentId})信息失败:`, error);
    message.error(error.message || '更新学生信息失败');
    return null;
  }
};

/**
 * 删除学生
 */
export const deleteStudent = async (studentId: number): Promise<boolean> => {
  try {
    const response = await api.delete<ApiResponse<any>>(`/api/admin/students/${studentId}`);
    
    if (response.data.success) {
      message.success(response.data.message || '学生删除成功');
      return true;
    } else {
      throw new Error(response.data.message || '删除学生失败');
    }
  } catch (error: any) {
    console.error(`删除学生(ID:${studentId})失败:`, error);
    message.error(error.message || '删除学生失败');
    return false;
  }
};

/**
 * 获取学生学习进度
 */
export const getStudentProgress = async (studentId: number): Promise<any> => {
  try {
    const response = await api.get<ApiResponse<any>>(`/api/admin/students/${studentId}/progress`);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取学生进度失败');
    }
  } catch (error: any) {
    console.error(`获取学生(ID:${studentId})进度失败:`, error);
    message.error(error.message || '获取学生进度失败');
    return null;
  }
};

/**
 * 获取学生错题记录
 */
export const getStudentWrongExercises = async (
  studentId: number,
  params?: {
    page?: number;
    pageSize?: number;
    subject?: string;
  }
): Promise<any> => {
  try {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params?.subject) searchParams.append('subject', params.subject);
    
    const url = `/api/admin/students/${studentId}/wrong-exercises${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await api.get<ApiResponse<any>>(url);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '获取学生错题记录失败');
    }
  } catch (error: any) {
    console.error(`获取学生(ID:${studentId})错题记录失败:`, error);
    message.error(error.message || '获取学生错题记录失败');
    return null;
  }
};

/**
 * 分配教师给学生
 */
export const assignTeacherToStudent = async (studentId: number, teacherId: number | null): Promise<boolean> => {
  try {
    const response = await api.put<ApiResponse<any>>(`/api/admin/students/${studentId}/assign-teacher`, {
      teacherId
    });
    
    if (response.data.success) {
      message.success(response.data.message || '教师分配成功');
      return true;
    } else {
      throw new Error(response.data.message || '分配教师失败');
    }
  } catch (error: any) {
    console.error(`分配教师给学生(ID:${studentId})失败:`, error);
    message.error(error.message || '分配教师失败');
    return false;
  }
};

/**
 * 批量导入学生
 */
export const batchImportStudents = async (students: StudentFormData[]): Promise<any> => {
  try {
    const response = await api.post<ApiResponse<any>>('/api/admin/students/batch-import', {
      students
    });
    
    if (response.data.success) {
      message.success(response.data.message || '批量导入完成');
      return response.data.data;
    } else {
      throw new Error(response.data.message || '批量导入失败');
    }
  } catch (error: any) {
    console.error('批量导入学生失败:', error);
    message.error(error.message || '批量导入失败');
    return null;
  }
};

// 保持向下兼容的旧API
export const getStudentProgressOverview = getStudentProgress;
export const getStudentTimeAnalysis = async (studentId: number): Promise<any> => {
  // 这个API可能需要在后端实现，暂时返回null
  console.warn('getStudentTimeAnalysis API 暂未实现');
  return null;
}; 