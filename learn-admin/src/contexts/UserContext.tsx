import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserInfo } from '../services/auth';

// 用户上下文的类型定义
interface UserContextType {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  isLoggedIn: boolean;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 上下文提供者组件
export const UserProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  
  // 从localStorage加载用户数据（如果有）
  useEffect(() => {
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        setUser(userInfo);
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
  }, []);

  // 计算登录状态
  const isLoggedIn = Boolean(user);

  return (
    <UserContext.Provider value={{ user, setUser, isLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
};

// 自定义钩子以便于使用
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser必须在UserProvider内部使用');
  }
  return context;
}; 