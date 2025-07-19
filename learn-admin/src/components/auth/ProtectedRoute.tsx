import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, getToken } from '../../services/auth';

/**
 * 受保护路由组件
 * 如果用户已登录，则渲染子路由；否则重定向到登录页
 */
const ProtectedRoute: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // 添加短暂延迟，确保所有状态都已初始化
    const checkAuth = () => {
      console.log('=== ProtectedRoute 检查开始 ===');
      
      const authenticated = isAuthenticated();
      const currentUser = getCurrentUser();
      const token = getToken();
      
      console.log('Token存在:', !!token);
      console.log('Token前10位:', token ? token.substring(0, 10) + '...' : '无');
      console.log('用户信息存在:', !!currentUser);
      console.log('用户信息:', currentUser ? { id: currentUser.id, username: currentUser.username, role: currentUser.role } : '无');
      console.log('isAuthenticated()结果:', authenticated);
      
      if (!authenticated) {
        console.log('❌ 认证失败，准备重定向到登录页');
        setShouldRedirect(true);
      } else {
        console.log('✅ 认证成功');
        setShouldRedirect(false);
      }
      
      setIsChecking(false);
      console.log('=== ProtectedRoute 检查结束 ===');
    };

    // 小延迟确保localStorage和Context都已初始化
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 仍在检查中，显示加载状态
  if (isChecking) {
    return <div>Loading...</div>;
  }

  // 检查完成后决定是否重定向
  if (shouldRedirect) {
    console.log('🔄 执行重定向到登录页');
    return <Navigate to="/login" replace />;
  }

  console.log('📋 渲染受保护的内容');
  return <Outlet />;
};

export default ProtectedRoute; 