import { create } from 'zustand';
import { getGrades, getGradeSubjects } from '../services/gradeService';
import type { Grade, SubjectGrade } from '../services/gradeService';

interface GradeStore {
  // 年级列表状态
  grades: Grade[];
  isLoading: boolean;
  error: string | null;

  // 学科年级关联状态
  subjectGrades: { [gradeId: number]: SubjectGrade[] };
  subjectGradeLoading: { [gradeId: number]: boolean };

  // 操作方法
  fetchGrades: (force?: boolean) => Promise<void>;
  fetchGradeSubjects: (gradeId: number, force?: boolean) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useGradeStore = create<GradeStore>((set, get) => ({
  // 初始状态
  grades: [],
  isLoading: false,
  error: null,
  subjectGrades: {},
  subjectGradeLoading: {},

  // 获取年级列表
  fetchGrades: async (force = false) => {
    const { grades, isLoading } = get();
    
    // 如果已有数据且不是强制刷新，则不重复请求
    if (grades.length > 0 && !force && !isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await getGrades();
      set({ 
        grades: data, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      console.error('获取年级列表失败:', error);
      set({ 
        isLoading: false,
        error: '获取年级列表失败' 
      });
    }
  },

  // 获取年级的学科关联
  fetchGradeSubjects: async (gradeId: number, force = false) => {
    const { subjectGrades, subjectGradeLoading } = get();
    
    // 如果已有数据且不是强制刷新，则不重复请求
    if (subjectGrades[gradeId] && !force && !subjectGradeLoading[gradeId]) {
      return;
    }

    set({ 
      subjectGradeLoading: { 
        ...subjectGradeLoading, 
        [gradeId]: true 
      } 
    });

    try {
      const data = await getGradeSubjects(gradeId);
      set({ 
        subjectGrades: { 
          ...subjectGrades, 
          [gradeId]: data 
        },
        subjectGradeLoading: { 
          ...subjectGradeLoading, 
          [gradeId]: false 
        }
      });
    } catch (error) {
      console.error(`获取年级${gradeId}的学科关联失败:`, error);
      set({ 
        subjectGradeLoading: { 
          ...subjectGradeLoading, 
          [gradeId]: false 
        }
      });
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },

  // 重置状态
  reset: () => {
    set({
      grades: [],
      isLoading: false,
      error: null,
      subjectGrades: {},
      subjectGradeLoading: {}
    });
  }
})); 