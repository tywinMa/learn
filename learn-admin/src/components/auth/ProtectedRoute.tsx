import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../services/auth';

/**
 * 受保护路由组件
 * 如果用户已登录，则渲染子路由；否则重定向到登录页
 */
const ProtectedRoute: React.FC = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute; 