import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission, isAuthenticated } from '../../services/auth';

interface PermissionGuardProps {
  permissionKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * 权限守卫组件
 * @param permissionKey 权限标识
 * @param children 有权限时显示的内容
 * @param fallback 可选，无权限时显示的内容，默认重定向到Dashboard
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissionKey,
  children,
  fallback
}) => {
  // 检查是否已登录
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  // 检查是否有权限
  if (!hasPermission(permissionKey)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default PermissionGuard; 