import api from './api';

// 用户角色常量
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

// 强制使用模拟数据（本地开发时非常有用）
const USE_MOCK_DATA = false;

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
    // 如果使用模拟数据
    if (USE_MOCK_DATA) {
      return mockLogin(username, password, setUser);
    }
    
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
    
    // 如果是开发环境，返回模拟数据
    if (USE_MOCK_DATA) {
      return mockLogin(username, password, setUser);
    }
    
    // 这里直接返回错误信息，无需重新抛出异常
    return {
      success: false,
      message: error instanceof Error ? error.message : '登录失败，请稍后再试'
    };
  }
};

// 模拟登录（开发环境使用）
const mockLogin = (username: string, password: string, setUser?: (user: UserInfo) => void) => {
  const mockUsers = [
    { 
      id: '1', 
      username: 'admin', 
      name: '管理员', 
      email: 'admin@example.com',
      mobile: '13800000000',
      avatar: 'https://example.com/avatar/admin.png',
      status: 1,
      lastLoginTime: new Date().toISOString(),
      roles: [
        {
          id: 1,
          name: '超级管理员',
          code: 'admin'
        }
      ],
      role: UserRole.ADMIN,
      permissions: ['dashboard', 'courses', 'students', 'settings'],
    },
    { 
      id: '2', 
      username: 'teacher', 
      name: '教师用户', 
      email: 'teacher@example.com',
      mobile: '13800000001',
      avatar: 'https://example.com/avatar/teacher.png',
      status: 1,
      lastLoginTime: new Date().toISOString(),
      roles: [
        {
          id: 2,
          name: '教师',
          code: 'teacher'
        }
      ],
      role: UserRole.TEACHER,
      subject: '数学',
      permissions: ['dashboard', 'courses'],
    },
    { 
      id: '3', 
      username: 'student', 
      name: '学生用户', 
      email: 'student@example.com',
      mobile: '13800000002',
      avatar: 'https://example.com/avatar/student.png',
      status: 1,
      lastLoginTime: new Date().toISOString(),
      roles: [
        {
          id: 3,
          name: '学生',
          code: 'student'
        }
      ],
      role: UserRole.STUDENT,
      grade: '高一',
      permissions: ['dashboard'],
    }
  ];
  
  // 简单的用户验证
  const user = mockUsers.find(u => u.username === username);
  
  if (user && (password === '123456' || password === 'admin123')) { // 简化的密码验证
    // 假设返回了token和用户信息
    const mockResponse = {
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({userId: user.id.toString(), time: Date.now()}))}`,
      user
    };
    
    // 保存token和用户信息到localStorage
    localStorage.setItem(TOKEN_KEY, mockResponse.token);
    localStorage.setItem(USER_INFO, JSON.stringify(mockResponse.user));
    
    // 使用setUser函数更新全局状态(如果提供)
    if (setUser && user) {
      setUser(user);
    }
    
    return {
      success: true,
      data: mockResponse
    };
  } else {
    return {
      success: false,
      message: '用户名或密码错误'
    };
  }
};

// 注册新用户
export const register = async (userData: RegisterRequest) => {
  try {
    // 准备发送到API的数据
    const apiData: RegisterApiRequest = {
      username: userData.username,
      password: userData.password,
      name: userData.fullName || userData.name || '', // 使用fullName或name
      email: userData.email,
      mobile: userData.phone || userData.mobile, // 使用phone或mobile
      status: userData.status || 1, // 默认为启用状态
      avatar: userData.avatar
    };
    
    // 根据角色添加角色ID
    if (userData.role) {
      // 映射角色到roleIds
      // 这个映射关系应该根据实际的API来确定
      const roleMap: Record<UserRole, number> = {
        [UserRole.ADMIN]: 1,
        [UserRole.TEACHER]: 2,
        [UserRole.STUDENT]: 3
      };
      
      apiData.roleIds = [roleMap[userData.role]];
    }
    
    // 如果使用模拟数据
    if (USE_MOCK_DATA) {
      // 模拟注册成功
      return { 
        success: true, 
        message: '注册成功（模拟）', 
        data: { 
          id: Math.floor(Math.random() * 1000) + 10,
          username: userData.username,
          name: userData.fullName || userData.name || ''
        } 
      };
    }
    
    // 实际API调用
    const response = await api.post<ApiResponse>(API_ENDPOINTS.REGISTER, apiData);
    
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        message: response.data.message || '注册成功',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || '注册失败'
      };
    }
  } catch (error) {
    console.error('注册错误:', error);
    
    // 在开发环境也返回成功
    if (USE_MOCK_DATA) {
      return { 
        success: true, 
        message: '注册成功（模拟）', 
        data: { 
          id: Math.floor(Math.random() * 1000) + 10,
          username: userData.username,
          name: userData.fullName || userData.name || ''
        } 
      };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '注册失败，请稍后再试'
    };
  }
};

// 获取当前用户信息
export const fetchCurrentUser = async () => {
  try {
    if (USE_MOCK_DATA) {
      // 从localStorage获取用户信息
      const user = getCurrentUser();
      return user ? { success: true, data: user } : { success: false, message: '未登录' };
    }
    
    // 实际API调用
    const response = await api.get<ApiResponse<UserInfo>>(API_ENDPOINTS.ADMIN_PROFILE);
    
    if (response.data && response.data.status === 'success' && response.data.data) {
      // 更新localStorage中的用户信息
      localStorage.setItem(USER_INFO, JSON.stringify(response.data.data));
      
      // 将API返回的用户信息转换为应用所需的格式
      const userData = response.data.data;
      
      // 确定用户角色 (前端使用)
      if (userData.roles && userData.roles.length > 0) {
        const roleCode = userData.roles[0].code;
        if (roleCode === 'admin') {
          userData.role = UserRole.ADMIN;
        } else if (roleCode === 'teacher') {
          userData.role = UserRole.TEACHER;
        } else if (roleCode === 'student') {
          userData.role = UserRole.STUDENT;
        }
      }
      
      return { success: true, data: userData };
    } else {
      return { success: false, message: response.data?.message || '获取用户信息失败' };
    }
  } catch (error) {
    console.error('获取用户信息错误:', error);
    
    if (USE_MOCK_DATA) {
      // 从localStorage获取用户信息
      const user = getCurrentUser();
      return user ? { success: true, data: user } : { success: false, message: '未登录' };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '获取用户信息失败，请稍后再试'
    };
  }
};

// 退出登录
export const logout = async (clearUser?: () => void) => {
  try {
    // 实际环境中调用登出API
    if (!USE_MOCK_DATA) {
      await api.post(API_ENDPOINTS.LOGOUT);
    }
    
    // 清除本地存储的认证信息
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO);
    
    // 清除全局用户状态
    if (clearUser) {
      clearUser();
    }
    
    // 重定向到登录页
    window.location.href = '/login';
    
    return { success: true };
  } catch (error) {
    console.error('退出登录错误:', error);
    
    // 即使API调用失败，也清除本地存储并重定向
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO);
    
    // 清除全局用户状态
    if (clearUser) {
      clearUser();
    }
    
    window.location.href = '/login';
    
    return { success: true };
  }
};

// 获取token
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// 获取当前用户信息
export const getCurrentUser = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem(USER_INFO);
  if (!userInfoStr) return null;
  
  try {
    return JSON.parse(userInfoStr);
  } catch {
    return null;
  }
};

// 检查是否已登录
export const isAuthenticated = () => {
  return !!getToken() && !!getCurrentUser();
};

// 检查是否有权限
export const hasPermission = (/* permissionKey: string */): boolean => {
  // 临时取消权限检查，始终返回true
  return true;
  
  // 原代码逻辑（已注释）
  /*
  const user = getCurrentUser();
  if (!user) return false;
  
  // 优先检查permissions数组
  if (user.permissions && user.permissions.includes(permissionKey)) {
    return true;
  }
  
  // 如果没有permissions数组，则根据角色判断
  if (user.role === UserRole.ADMIN) {
    // 管理员拥有所有权限
    return true;
  } else if (user.role === UserRole.TEACHER) {
    // 教师拥有课程和仪表盘权限
    return ['dashboard', 'courses'].includes(permissionKey);
  } else if (user.role === UserRole.STUDENT) {
    // 学生仅拥有仪表盘权限
    return permissionKey === 'dashboard';
  }
  
  return false;
  */
};

// 获取用户角色
export const getUserRole = (): UserRole | null => {
  const user = getCurrentUser();
  return user ? user.role || null : null;
};

// 更新用户个人信息
export const updateUserProfile = async (userData: Partial<UserInfo>) => {
  try {
    // 准备发送到API的数据
    const apiData = {
      name: userData.name,
      email: userData.email,
      mobile: userData.mobile,
      avatar: userData.avatar
    };
    
    // 如果使用模拟数据
    if (USE_MOCK_DATA) {
      // 更新本地存储的用户信息
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem(USER_INFO, JSON.stringify(updatedUser));
      }
      
      return { success: true, message: '用户信息更新成功（模拟）' };
    }
    
    // 实际API调用
    const userId = String(userData.id); // 确保ID为字符串
    const response = await api.put<ApiResponse>(`${API_ENDPOINTS.UPDATE_PROFILE}/${userId}`, apiData);
    
    if (response.data && response.data.status === 'success') {
      // 更新成功后，重新获取用户信息
      await fetchCurrentUser();
      
      return {
        success: true,
        message: response.data.message || '更新成功',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || '更新失败'
      };
    }
  } catch (error) {
    console.error('更新用户信息错误:', error);
    
    // 在开发环境中模拟成功
    if (USE_MOCK_DATA) {
      // 更新本地存储的用户信息
      const currentUser = getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem(USER_INFO, JSON.stringify(updatedUser));
      }
      
      return { success: true, message: '用户信息更新成功（模拟）' };
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '更新失败，请稍后再试'
    };
  }
}; 