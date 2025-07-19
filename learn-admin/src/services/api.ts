import axios from 'axios';
import { message as antMessage } from 'antd';
import { getToken, logout } from './auth';

// API路径常量
const API_PATHS = {
  LOGIN: '/api/admin/auth/login',
  LOGOUT: '/api/admin/auth/logout'
};

// 自定义错误类型
interface ApiError extends Error {
  response?: unknown;
  request?: unknown;
  config?: unknown;
  errorMessage?: string;
}

// 后端响应格式接口
interface BackendResponse<T = unknown> {
  err_no: number;
  message?: string;
  data: T;
}

// 创建axios实例
const api = axios.create({
  baseURL: '', // 使用相对路径，依赖Vite的代理配置
  timeout: 30000, // 增加超时时间，允许传输大型内容
  maxContentLength: 50 * 1024 * 1024 as number, // 50MB
  maxBodyLength: 50 * 1024 * 1024 as number, // 50MB
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 获取当前请求的URL
    const requestUrl = config?.url || '';
    
    console.log(`=== API请求拦截器 ===`);
    console.log(`请求URL: ${requestUrl}`);
    console.log(`请求方法: ${config.method}`);
    
    // 调试日志：请求大小
    if (config.data && typeof config.data === 'object') {
      const dataSize = JSON.stringify(config.data).length;
      console.log(`API请求: ${requestUrl}, 数据大小: ${(dataSize / 1024).toFixed(2)}KB`);
      
      // 如果数据包含content字段，记录其长度和内容样本
      if (config.data.content) {
        console.log(`API请求: ${requestUrl}, content字段长度: ${config.data.content.length}`);
      }
    }
    
    // 对于登录接口，不添加任何认证头
    if (requestUrl.includes(API_PATHS.LOGIN)) {
      console.log(`登录接口，跳过token检查`);
      return config;
    }
    
    // 对于其他接口，添加token到header
    const token = getToken();
    console.log(`当前token状态: ${token ? '存在' : '不存在'}`);
    if (token) {
      console.log(`Token前10位: ${token.substring(0, 10)}...`);
      // 只使用标准Authorization头格式
      config.headers['Authorization'] = `Bearer ${token}`;
      // 移除冗余的x-auth-token
      // config.headers['x-auth-token'] = token;
    } else {
      console.warn(`⚠️ 没有token但尝试访问需要认证的接口: ${requestUrl}`);
    }
    
    console.log(`=== API请求拦截器结束 ===`);
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    // 处理后端统一的响应格式 { err_no: 0, data: ... } 或 { success: true, data: ... }
    if (response.data && typeof response.data === 'object') {
      // 处理 err_no 格式
      if ('err_no' in response.data) {
        const backendResponse = response.data as BackendResponse;
        if (backendResponse.err_no === 0) {
          // 成功响应，返回data字段
          return backendResponse.data;
        } else {
          // 业务错误，抛出异常
          const error = new Error(backendResponse.message || '请求失败') as ApiError;
          error.response = response;
          throw error;
        }
      }
      // 处理 success 格式
      else if ('success' in response.data) {
        const successResponse = response.data as { success: boolean; data: any; message?: string };
        if (successResponse.success) {
          // 成功响应，返回data字段
          return successResponse.data;
        } else {
          // 业务错误，抛出异常
          const error = new Error(successResponse.message || '请求失败') as ApiError;
          error.response = response;
          throw error;
        }
      }
    }
    // 对于不符合标准格式的响应，直接返回data
    return response.data;
  },
  error => {
    // 屏蔽默认的浏览器错误提示
    // 阻止错误信息传播到全局的window.onerror事件
    error.preventDefault = () => {};

    console.log('=== API响应错误拦截器 ===');
    console.log('错误对象:', error);
    
    const { response, config } = error;
    
    // 获取当前请求的URL
    const requestUrl = config?.url || '';
    const isLoginRequest = requestUrl.includes(API_PATHS.LOGIN);
    
    console.log(`错误请求URL: ${requestUrl}`);
    console.log(`是否登录请求: ${isLoginRequest}`);
    console.log(`响应状态: ${response?.status || '无响应'}`);
    
    // 尝试获取后端返回的具体错误信息
    let errorMessage = '请求失败';
    
    if (response && response.data) {
      console.log('响应数据:', response.data);
      // 尝试从响应数据中提取错误消息
      if (response.data.message) {
        errorMessage = response.data.message;
      } else if (response.data.error && response.data.error.message) {
        errorMessage = response.data.error.message;
      } else if (typeof response.data === 'string') {
        errorMessage = response.data;
      }
    } else if (!response) {
      // 网络错误等导致无响应
      errorMessage = '网络连接错误，请检查您的网络';
      console.log('网络错误，无响应');
    }
    
    // 401错误特殊处理：如果不是登录接口，则触发登出流程
    if (response && response.status === 401 && !isLoginRequest) {
      console.log('🚨 检测到401错误，非登录接口');
      console.log(`当前token状态: ${getToken() ? '存在' : '不存在'}`);
      
      // 防止多次重定向，添加一个标志位到localStorage
      if (!localStorage.getItem('redirecting_to_login')) {
        console.log('💡 设置重定向标志并清除token');
        localStorage.setItem('redirecting_to_login', 'true');
        
        // 清除token并重定向到登录页
        logout();
        
        // 添加定时器清除标志位
        setTimeout(() => {
          localStorage.removeItem('redirecting_to_login');
          console.log('🔄 清除重定向标志');
        }, 3000);
      } else {
        console.log('⚠️ 已有重定向标志，跳过重复处理');
      }
      
      errorMessage = '登录已过期，请重新登录';
    }
    
    // 为了避免显示两种错误提示，我们自己控制错误消息的显示
    // 非登录接口才自动显示错误消息，登录接口由登录页面自行处理
    if (!isLoginRequest) {
      antMessage.error(errorMessage);
    }
    
    console.log(`最终错误消息: ${errorMessage}`);
    console.log('=== API响应错误拦截器结束 ===');
    
    // 自定义错误对象，确保它包含我们提取的错误消息
    const customError = new Error(errorMessage) as ApiError;
    customError.errorMessage = errorMessage;
    
    // 保留原始错误的有用信息
    customError.response = response;
    customError.request = error.request;
    customError.config = error.config;
    
    // 使用我们的自定义错误对象
    return Promise.reject(customError);
  }
);

export default api;
export { API_PATHS }; 