import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserInfo } from '../services/auth';

// 用户状态接口
interface UserState {
  // 状态
  user: UserInfo | null;
  isLoggedIn: boolean;
  
  // 操作
  setUser: (user: UserInfo | null) => void;
  clearUser: () => void;
}

// 创建用户状态存储
export const useUserStore = create<UserState>()(
  // 使用persist中间件持久化到localStorage
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      
      // 设置用户信息
      setUser: (user) => set({ 
        user, 
        isLoggedIn: Boolean(user) 
      }),
      
      // 清除用户信息
      clearUser: () => set({ 
        user: null, 
        isLoggedIn: false 
      }),
    }),
    {
      name: 'user-storage', // localStorage的键名
      storage: createJSONStorage(() => localStorage),
    }
  )
); 