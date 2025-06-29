import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/apiConfig';

// 学生信息接口
export interface Student {
  id: number;
  studentId: string;
  name: string;
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  grade?: string;
  school?: string;
  totalPoints: number;
  currentLevel: number;
  consecutiveDays: number;
}

// 登录请求接口
export interface LoginRequest {
  studentId: string;
  password: string;
}

// 注册请求接口
export interface RegisterRequest {
  studentId: string;
  password: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  grade?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string;
}

// API响应接口
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 登录响应接口
interface LoginResponse {
  token: string;
  student: Student;
}

// 存储键常量
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  STUDENT_INFO: 'student_info',
  STUDENT_ID: 'student_id'
};

/**
 * 学生登录
 */
export const studentLogin = async (loginData: LoginRequest): Promise<{
  success: boolean;
  message: string;
  student?: Student;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/students/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const result: ApiResponse<LoginResponse> = await response.json();

    if (result.success && result.data) {
      // 保存token和学生信息
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, result.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_INFO, JSON.stringify(result.data.student));
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_ID, result.data.student.id.toString());

      return {
        success: true,
        message: result.message,
        student: result.data.student
      };
    } else {
      return {
        success: false,
        message: result.message || '登录失败'
      };
    }
  } catch (error) {
    console.error('登录错误:', error);
    return {
      success: false,
      message: '网络错误，请检查网络连接'
    };
  }
};

/**
 * 学生注册
 */
export const studentRegister = async (registerData: RegisterRequest): Promise<{
  success: boolean;
  message: string;
  student?: Student;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/students/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const result: ApiResponse<LoginResponse> = await response.json();

    if (result.success && result.data) {
      // 保存token和学生信息
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, result.data.token);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_INFO, JSON.stringify(result.data.student));
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_ID, result.data.student.id.toString());

      return {
        success: true,
        message: result.message,
        student: result.data.student
      };
    } else {
      return {
        success: false,
        message: result.message || '注册失败'
      };
    }
  } catch (error) {
    console.error('注册错误:', error);
    return {
      success: false,
      message: '网络错误，请检查网络连接'
    };
  }
};

/**
 * 获取存储的token
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('获取token失败:', error);
    return null;
  }
};

/**
 * 获取存储的学生信息
 */
export const getStoredStudent = async (): Promise<Student | null> => {
  try {
    const studentInfo = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_INFO);
    return studentInfo ? JSON.parse(studentInfo) : null;
  } catch (error) {
    console.error('获取学生信息失败:', error);
    return null;
  }
};

/**
 * 获取当前学生ID
 */
export const getCurrentStudentId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_ID);
  } catch (error) {
    console.error('获取学生ID失败:', error);
    return null;
  }
};

/**
 * 获取当前用户ID（兼容现有代码）
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_ID);
  } catch (error) {
    console.error('获取用户ID失败:', error);
    return null;
  }
};

/**
 * 检查是否已登录
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await getStoredToken();
    const student = await getStoredStudent();
    return !!(token && student);
  } catch (error) {
    console.error('检查登录状态失败:', error);
    return false;
  }
};

/**
 * 获取学生个人信息（从服务器）
 */
export const fetchStudentProfile = async (): Promise<{
  success: boolean;
  message: string;
  student?: Student;
}> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return {
        success: false,
        message: '未登录，请先登录'
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/students/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result: ApiResponse<Student> = await response.json();

    if (result.success && result.data) {
      // 更新存储的学生信息
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_INFO, JSON.stringify(result.data));
      
      return {
        success: true,
        message: result.message,
        student: result.data
      };
    } else {
      return {
        success: false,
        message: result.message || '获取个人信息失败'
      };
    }
  } catch (error) {
    console.error('获取个人信息错误:', error);
    return {
      success: false,
      message: '网络错误，请检查网络连接'
    };
  }
};

/**
 * 更新学生个人信息
 */
export const updateStudentProfile = async (updateData: Partial<Student>): Promise<{
  success: boolean;
  message: string;
  student?: Student;
}> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return {
        success: false,
        message: '未登录，请先登录'
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/students/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const result: ApiResponse<Student> = await response.json();

    if (result.success && result.data) {
      // 更新存储的学生信息
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_INFO, JSON.stringify(result.data));
      
      return {
        success: true,
        message: result.message,
        student: result.data
      };
    } else {
      return {
        success: false,
        message: result.message || '更新个人信息失败'
      };
    }
  } catch (error) {
    console.error('更新个人信息错误:', error);
    return {
      success: false,
      message: '网络错误，请检查网络连接'
    };
  }
};

/**
 * 修改密码
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      return {
        success: false,
        message: '未登录，请先登录'
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/students/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      }),
    });

    const result: ApiResponse<any> = await response.json();

    return {
      success: result.success,
      message: result.message || (result.success ? '密码修改成功' : '密码修改失败')
    };
  } catch (error) {
    console.error('修改密码错误:', error);
    return {
      success: false,
      message: '网络错误，请检查网络连接'
    };
  }
};

/**
 * 清除所有本地用户相关数据的辅助函数
 */
export const clearAllLocalUserData = async (): Promise<void> => {
  try {
    // 获取所有AsyncStorage的键
    const allKeys = await AsyncStorage.getAllKeys();
    
    // 基础用户数据键
    const basicUserKeys = [
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.STUDENT_INFO,
      STORAGE_KEYS.STUDENT_ID,
      'currentSubject',
      'currentGrade',
      'user_preferences',
      'app_settings',
      'study_progress',
      'exercise_cache',
      'user_favorites',
      'practice_history'
    ];

    // 查找所有以用户相关前缀开头的键
    const userRelatedKeys = allKeys.filter(key => 
      key.startsWith('user_') ||
      key.startsWith('student_') ||
      key.startsWith('auth_') ||
      key.startsWith('login_') ||
      key.startsWith('study_') ||
      key.startsWith('exercise_') ||
      key.startsWith('practice_') ||
      key.startsWith('progress_') ||
      key.startsWith('cache_') ||
      basicUserKeys.includes(key)
    );

    // 批量删除所有用户相关数据
    await AsyncStorage.multiRemove(userRelatedKeys);
    
    console.log(`✅ 用户登出，已清除 ${userRelatedKeys.length} 个本地缓存项目`);
    console.log('清除的键:', userRelatedKeys);
  } catch (error) {
    console.error('清除本地数据失败:', error);
  }
};

/**
 * 登出
 */
export const logout = async (): Promise<void> => {
  try {
    // 调用 API 通知服务器登出（如果需要）
    const token = await getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/students/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (apiError) {
        console.warn('服务器登出API调用失败，但继续清除本地数据:', apiError);
      }
    }

    // 彻底清除所有本地用户数据
    await clearAllLocalUserData();
    
    console.log('✅ 退出登录成功，已清除所有本地用户数据');
  } catch (error) {
    console.error('登出失败:', error);
    // 即使出错也尝试清除基础数据
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.STUDENT_INFO,
        STORAGE_KEYS.STUDENT_ID,
      ]);
    } catch (fallbackError) {
      console.error('基础数据清除也失败:', fallbackError);
    }
  }
}; 