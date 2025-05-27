import api from './api';

// 用户角色常量
export const UserRole = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// API接口路径
const API_ENDPOINTS = {
  LOGIN: '/api/admin/auth/login',
  ADMIN_PROFILE: '/api/admin/profile',
  REGISTER: '/api/admin/users', // 使用创建用户接口作为注册入口
  UPDATE_PROFILE: '/api/admin/users', // 用户更新接口
  LOGOUT: '/api/admin/auth/logout'
};

// 认证服务常量
const TOKEN_KEY = 'auth_token';
const USER_INFO = 'user_info';

// API响应基础接口
interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

// 角色接口
export interface Role {
  id: number;
  name: string;
  code: string;
}

// 用户信息接口 (基于API返回格式调整)
export interface UserInfo {
  id: string | number;
  username: string;
  name: string;
  avatar?: string;
  email?: string;
  mobile?: string; // API中使用mobile而不是phone
  status?: number;
  lastLoginTime?: string;
  roles?: Role[];
  // 额外字段 (仅前端使用)
  role?: UserRole;
  permissions?: string[];
  subject?: string; // 教师教授科目
  grade?: string;   // 学生年级
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  user: UserInfo;
}

// 登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
}

// 自定义服务器登录响应类型
interface ApiLoginResponse {
  err_no: number;
  message: string;
  data?: {
    token: string;
    user: UserInfo;
  };
  token?: string;
  user?: UserInfo;
}

// 注册请求参数接口 (发送到API的格式)
interface RegisterApiRequest {
  username: string;
  password: string;
  name: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  status?: number;
  roleIds?: number[];
}

// 注册请求接口 (前端表单的格式)
export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword?: string;
  name: string; // API中使用name对应前端的fullName
  email?: string;
  mobile?: string; // API中使用mobile对应前端的phone
  avatar?: string;
  status?: number;
  roleIds?: number[]; // API中使用roleIds来设置用户角色
  // 额外字段 (仅前端使用，不发送到API)
  fullName?: string;
  phone?: string;
  role?: UserRole;
  subject?: string;
  grade?: string;
}

// 登录
export const login = async (username: string, password: string, setUser?: (user: UserInfo) => void) => {
  try {
    // 实际API调用 - axios拦截器已经将response.data作为返回值
    const response = await api.post(API_ENDPOINTS.LOGIN, { 
      username, 
      password 
    }) as ApiLoginResponse; // 类型断言，这里response是服务器响应的数据
    
    // 调试：打印API响应
    console.log('登录API响应:', JSON.stringify(response, null, 2));
    
    // 服务器返回格式可能是 { data: { token, user } } 或 { token, user }
    // 检查response.data存在情况
    if (response.data && response.data.token && response.data.user) {
      // 嵌套结构的情况：{ data: { token, user } }
      // 保存token和用户信息到localStorage
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_INFO, JSON.stringify(response.data.user));
      
      // 使用setUser函数更新全局状态(如果提供)
      if (setUser && response.data.user) {
        setUser(response.data.user);
      }
      
      return {
        success: true,
        data: { 
          token: response.data.token, 
          user: response.data.user 
        }
      };
    } else if (response && response.token && response.user) {
      // 直接结构的情况：{ token, user }
      // 保存token和用户信息到localStorage
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_INFO, JSON.stringify(response.user));
      
      // 使用setUser函数更新全局状态(如果提供)
      if (setUser && response.user) {
        setUser(response.user);
      }
      
      return {
        success: true,
        data: { 
          token: response.token, 
          user: response.user 
        }
      };
    } else {
      // 调试：打印登录失败原因
      console.warn('登录失败原因:', {
        response,
        hasToken: response?.token ? true : false,
        hasUser: response?.user ? true : false,
        hasDataToken: response?.data?.token ? true : false,
        hasDataUser: response?.data?.user ? true : false
      });
      
      // 如果服务器返回了消息，使用服务器返回的消息
      const errorMessage = (response && 'message' in response && response.message) 
        ? response.message 
        : (response && 'data' in response && response.data && 'message' in response.data && response.data.message)
          ? response.data.message
          : '登录失败：无效的用户名或密码';
          
      return {
        success: false,
        message: errorMessage
      };
    }
  } catch (error) {
    console.error('登录错误:', error);
    
    // 这里直接返回错误信息，无需重新抛出异常
    return {
      success: false,
      message: '网络错误，请检查网络连接后重试'
    };
  }
};

// 注册用户
export const register = async (userData: RegisterRequest) => {
  try {
    console.log('注册用户API调用 - 参数检查:', userData);
    
    // 准备API请求数据 (转换前端字段到后端字段)
    const apiData: RegisterApiRequest = {
      username: userData.username,
      password: userData.password,
      name: userData.fullName || userData.name, // 使用fullName作为用户姓名
      email: userData.email,
      mobile: userData.phone || userData.mobile, // 使用phone作为手机号
      avatar: userData.avatar,
      status: userData.status ?? 1, // 默认状态为启用(1)
      roleIds: userData.roleIds || [] // 默认无角色分配
    };
    
    console.log('注册API请求数据:', apiData);
    
    // 实际API调用
    const response = await api.post(API_ENDPOINTS.REGISTER, apiData) as ApiResponse<UserInfo>;
    
    console.log('注册API响应:', response);
    
    // 检查响应格式
    if (response && response.data) {
      // 注册成功的响应通常包含用户信息
      return {
        success: true,
        data: response.data,
        message: '注册成功'
      };
    } else if (response) {
      // 直接返回用户数据的情况
      return {
        success: true,
        data: response,
        message: '注册成功'
      };
    } else {
      return {
        success: false,
        message: '注册失败：服务器响应异常'
      };
    }
  } catch (error) {
    console.error('注册用户失败:', error);
    return {
      success: false,
      message: '注册失败：网络错误或服务器异常'
    };
  }
};

// 获取当前用户信息
export const fetchCurrentUser = async () => {
  try {
    // 实际API调用
    const response = await api.get(API_ENDPOINTS.ADMIN_PROFILE) as UserInfo;
    
    console.log('获取用户信息API响应:', response);
    
    // 检查响应数据
    if (response && (response.id || response.username)) {
      // 更新localStorage中的用户信息
      localStorage.setItem(USER_INFO, JSON.stringify(response));
      
      return {
        success: true,
        data: response
      };
    } else {
      console.warn('获取用户信息失败: 响应数据格式不正确', response);
      return {
        success: false,
        message: '获取用户信息失败'
      };
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error);
    return {
      success: false,
      message: '获取用户信息失败：网络错误'
    };
  }
};

// 退出登录
export const logout = async (clearUser?: () => void) => {
  try {
    // 实际API调用
    await api.post(API_ENDPOINTS.LOGOUT);
    
    // 清除本地存储
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO);
    
    // 清除全局用户状态(如果提供了回调函数)
    if (clearUser) {
      clearUser();
    }
    
    console.log('退出登录成功');
    return { success: true };
  } catch (error) {
    // 即使API调用失败，也要清除本地存储
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO);
    
    if (clearUser) {
      clearUser();
    }
    
    console.error('退出登录API调用失败，但已清除本地数据:', error);
    return { success: true }; // 仍然返回成功，因为本地已清除
  }
};

// 获取Token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// 获取当前用户
export const getCurrentUser = (): UserInfo | null => {
  try {
    const userStr = localStorage.getItem(USER_INFO);
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error('解析用户信息失败:', error);
    return null;
  }
};

// 检查是否已登录
export const isAuthenticated = () => {
  return !!getToken();
};

// 检查权限（基础实现，可根据实际需求扩展）
export const hasPermission = (permissionKey?: string): boolean => {
  // 如果没有登录，返回false
  if (!isAuthenticated()) {
    return false;
  }
  
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  
  // 简单的权限检查逻辑
  // 管理员拥有所有权限
  if (user.role === UserRole.ADMIN || 
      (user.roles && user.roles.some(role => role.code === 'admin'))) {
    return true;
  }
  
  // 教师和学生的具体权限需要根据业务逻辑实现
  // 这里暂时返回true（允许访问）
  return true;
};

// 获取用户角色
export const getUserRole = (): UserRole | null => {
  const user = getCurrentUser();
  if (user?.role) {
    return user.role;
  }
  
  // 尝试从roles数组中推断角色
  if (user?.roles && user.roles.length > 0) {
    const roleCode = user.roles[0].code;
    return roleCode as UserRole;
  }
  
  return null;
};

// 更新用户信息
export const updateUserProfile = async (userData: Partial<UserInfo>) => {
  try {
    console.log('更新用户信息 - 请求参数:', userData);
    
    // 获取当前用户ID
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      throw new Error('无法获取当前用户信息');
    }
    
    // 实际API调用
    const response = await api.put(`${API_ENDPOINTS.UPDATE_PROFILE}/${currentUser.id}`, userData) as UserInfo;
    
    console.log('更新用户信息API响应:', response);
    
    // 检查响应数据
    if (response && (response.id || response.username)) {
      // 更新localStorage中的用户信息
      const updatedUser = { ...currentUser, ...response };
      localStorage.setItem(USER_INFO, JSON.stringify(updatedUser));
      
      return {
        success: true,
        data: updatedUser,
        message: '更新成功'
      };
    } else {
      return {
        success: false,
        message: '更新失败：服务器响应异常'
      };
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      message: '更新失败：网络错误或服务器异常'
    };
  }
}; 