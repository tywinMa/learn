import { message } from 'antd';
import api from './api';

// 匹配题选项类型
export interface MatchingOptions {
  left: string[];
  right: string[];
}

// 匹配题答案类型
export interface MatchingAnswer {
  // 存储左侧索引到右侧索引的映射关系，例如 {"0": "2", "1": "0", "2": "3", "3": "1"} 表示左侧第一项匹配右侧第三项，左侧第二项匹配右侧第一项...
  [leftIndex: string]: string;
}

// 练习题选项类型
export interface ExerciseOption {
  id: string | number;
  content?: string;
  isCorrect?: boolean;
  leftContent?: string;
  rightContent?: string;
  allowPhoto?: boolean;
  hint?: string;
}

// 单个习题内容类型
export interface ExerciseContent {
  question: string;
  type: 'choice' | 'application' | 'fill_blank' | 'matching';
  options?: unknown;
  correctAnswer?: unknown;
  difficulty: '1' | '2' | '3' | 'easy' | 'medium' | 'hard';
  explanation?: string;
}

// 练习题类型定义
export interface Exercise {
  id: string | number;
  subject: string;
  title: string; // 习题标题
  question: string;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
  type: 'choice' | 'fill_blank' | 'application' | 'matching';
  difficulty: number;
  media?: any;
  hints?: any;
  knowledgePointIds?: string[];
  isAI?: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    subject: string;
  };
  subjectInfo?: {
    id: string;
    name: string;
    code: string;
  };
}

// 创建练习题请求参数类型
export interface CreateExerciseParams {
  subject: string;
  title: string; // 习题标题
  question: string;
  type: string;
  difficulty: number;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
  media?: any;
  hints?: any;
  knowledgePointIds?: string[];
  isAI?: boolean;
}

// 更新练习题请求参数类型
export interface UpdateExerciseParams {
  subject?: string;
  title?: string; // 习题标题
  question?: string;
  type?: string;
  difficulty?: number;
  options?: any;
  correctAnswer?: any;
  explanation?: string;
  media?: any;
  hints?: any;
  knowledgePointIds?: string[];
  isAI?: boolean;
}

/**
 * 获取所有练习题
 */
export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    const response = await api.get('/api/admin/exercises');
    return response as unknown as Exercise[];
  } catch (error) {
    console.error('获取所有习题失败:', error);
    message.error('获取习题列表失败');
    return [];
  }
};

/**
 * 获取课程的所有练习题
 * @param courseId 课程ID
 */
export const getExercisesByCourse = async (courseId: string): Promise<Exercise[]> => {
  try {
    const response = await api.get(`/api/admin/exercises/course/${courseId}`);
    return response as unknown as Exercise[];
  } catch (error) {
    console.error(`获取课程(ID:${courseId})的习题失败:`, error);
    message.error('获取课程习题列表失败');
    return [];
  }
};

/**
 * 获取学科的所有练习题
 * @param subject 学科代码
 */
export const getExercisesBySubject = async (subject: string): Promise<Exercise[]> => {
  try {
    const response = await api.get(`/api/admin/exercises/subject/${subject}`);
    return response as unknown as Exercise[];
  } catch (error) {
    console.error(`获取学科(${subject})的习题失败:`, error);
    message.error('获取学科习题列表失败');
    return [];
  }
};

/**
 * 获取单元的所有练习题
 * @param unitId 单元ID
 */
export const getExercisesByUnit = async (unitId: string): Promise<Exercise[]> => {
  try {
    const response = await api.get(`/api/admin/exercises/unit/${unitId}`);
    return response as unknown as Exercise[];
  } catch (error) {
    console.error(`获取单元(ID:${unitId})的习题失败:`, error);
    message.error('获取单元习题列表失败');
    return [];
  }
};

/**
 * 获取单个练习题详情
 * @param id 练习题ID
 */
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
  try {
    const response = await api.get(`/api/admin/exercises/${id}`);
    return response as unknown as Exercise;
  } catch (error) {
    console.error(`获取习题(ID:${id})详情失败:`, error);
    message.error('获取习题详情失败');
    return null;
  }
};

/**
 * 创建练习题
 * @param exerciseData 练习题数据
 */
export const createExercise = async (exerciseData: CreateExerciseParams): Promise<Exercise | null> => {
  try {
    const response = await api.post('/api/admin/exercises', exerciseData);
    message.success('习题创建成功');
    return response as unknown as Exercise;
  } catch (error) {
    console.error('创建习题失败:', error);
    return null;
  }
};

/**
 * 更新练习题
 * @param id 练习题ID
 * @param exerciseData 更新的练习题数据
 */
export const updateExercise = async (id: string, exerciseData: UpdateExerciseParams): Promise<Exercise | null> => {
  try {
    const response = await api.put(`/api/admin/exercises/${id}`, exerciseData);
    message.success('习题更新成功');
    return response as unknown as Exercise;
  } catch (error) {
    console.error(`更新习题(ID:${id})失败:`, error);
    message.error('更新习题失败');
    return null;
  }
};

/**
 * 删除练习题
 * @param id 练习题ID
 */
export const deleteExercise = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/admin/exercises/${id}`);
    message.success('习题删除成功');
    return true;
  } catch (error) {
    console.error(`删除习题(ID:${id})失败:`, error);
    message.error('删除习题失败');
    return false;
  }
}; 