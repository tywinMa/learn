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
    console.log('=== UserContext 初始化开始 ===');
    const userInfoStr = localStorage.getItem('user_info');
    console.log('localStorage中的user_info:', userInfoStr ? '存在' : '不存在');
    
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        console.log('解析的用户信息:', { id: userInfo.id, username: userInfo.username, role: userInfo.role });
        setUser(userInfo);
        console.log('✅ 用户状态已设置');
      } catch (error) {
        console.error('❌ 解析用户信息失败:', error);
        localStorage.removeItem('user_info'); // 清除无效数据
      }
    } else {
      console.log('📭 localStorage中没有用户信息');
    }
    console.log('=== UserContext 初始化结束 ===');
  }, []);

  // 监控user状态变化
  useEffect(() => {
    console.log('👤 UserContext - 用户状态变化:', user ? { id: user.id, username: user.username, role: user.role } : '无用户');
  }, [user]);

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