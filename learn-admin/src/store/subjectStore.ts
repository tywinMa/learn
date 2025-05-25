import { create } from 'zustand';
import { getSubjects } from '../services/subjectService';
import type { Subject } from '../services/subjectService';

// 学科状态接口
interface SubjectState {
  // 状态
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;
  selectedSubject: string | undefined;
  
  // 操作
  fetchSubjects: (force?: boolean) => Promise<void>;
  setSelectedSubject: (subjectName: string | undefined) => void;
  clearSelectedSubject: () => void;
}

// 创建学科状态存储
export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  isLoading: false,
  error: null,
  selectedSubject: undefined,
  
  // 获取所有学科数据
  fetchSubjects: async (force = false) => {
    // 如果已经有数据且不是强制刷新，则不再重复获取
    if (!force && get().subjects.length > 0 && !get().isLoading) {
      console.log('subjectStore - 已有学科数据，跳过获取', get().subjects.length);
      return;
    }
    
    console.log('subjectStore - 开始获取学科数据');
    set({ isLoading: true, error: null });
    
    try {
      console.log('subjectStore - 调用API获取学科数据');
      const subjects = await getSubjects();
      console.log('subjectStore - 学科数据获取成功', subjects);
      set({ subjects, isLoading: false });
    } catch (error) {
      console.error('subjectStore - 获取学科数据失败:', error);
      set({ 
        error: error instanceof Error ? error.message : '获取学科数据失败', 
        isLoading: false 
      });
    }
  },
  
  // 设置选中的学科
  setSelectedSubject: (subjectName) => set({ selectedSubject: subjectName }),
  
  // 清除选中的学科
  clearSelectedSubject: () => set({ selectedSubject: undefined }),
})); 