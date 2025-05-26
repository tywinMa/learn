import api from './api';
import { logApi, logError, logData } from '../utils/debugLogger';
import { getSubjects } from './subjectService';

// 课程接口
export interface Course {
  id: string;
  title: string;
  instructor: string; // 暂时用instructor字段存储关联习题ID
  category: string;
  students: number;
  createdAt: string;
  description?: string;
  content?: string;
  sources?: Array<{type: 'image' | 'video', url: string}>;
  courseCode?: string; // 改为courseCode以匹配后端
  coverImage?: string; // 兼容旧数据格式
  relatedExerciseId?: string; // 添加关联习题ID字段
  
  // 以下是后端API可能返回的字段名，用于类型兼容
  name?: string; // 对应title
  teacher?: { id: string; name: string; }; // 教师信息
  teacherName?: string; // 教师名称
  subject?: { id: string; name: string; code: string; }; // 学科信息
  course_code?: string; // 下划线格式的课程编号
  created_at?: string; // 下划线格式的创建时间
  relatedExercise?: { id: string | number; question: string; title?: string; exerciseCode?: string; }; // 关联习题 - 支持数字和字符串ID，添加exerciseCode和title字段
}

// 后端课程数据接口
interface BackendCourse {
  id: number;
  name: string;
  description?: string;
  content?: string;
  courseCode?: string;
  course_code?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  sources?: Array<{type: 'image' | 'video', url: string}>;
  subject?: { id: string; name: string; code: string; };
  teacher?: { id: string; name: string; };
  relatedExercise?: { id: string | number; question: string; exerciseCode?: string; title?: string; };
  relatedExerciseId?: string | null; // 添加直接的relatedExerciseId字段
  related_exercise_id?: string | null; // 添加下划线格式的字段
}

// API端点
const API_ENDPOINTS = {
  COURSES: '/api/admin/courses',
};

/**
 * 转换后端课程数据格式为前端格式
 */
const transformBackendCourse = (course: BackendCourse): Course => {
  console.log('transformBackendCourse - 输入数据:', course);
  
  if (!course || typeof course !== 'object') {
    console.error('transformBackendCourse - 输入数据无效:', course);
    throw new Error('Invalid course data');
  }
  
  if (!course.id) {
    console.error('transformBackendCourse - 缺少id字段:', course);
    throw new Error('Course data missing id field');
  }
  
  const result = {
    id: course.id.toString(),
    title: course.name || '',
    description: course.description || '',
    content: course.content || '',
    // 学科信息
    category: course.subject?.name || '未分类',
    // 教师信息
    instructor: course.teacher?.name || '未分配教师',
    // 课程编号
    courseCode: course.courseCode || course.course_code || '',
    // 创建日期
    createdAt: course.createdAt || course.created_at || course.updatedAt || new Date().toISOString(),
    // 媒体资源
    sources: course.sources || [],
    // 关联习题ID - 尝试多种可能的字段，确保转换为字符串
    relatedExerciseId: (course.relatedExercise?.id || course.relatedExerciseId || course.related_exercise_id || '').toString(),
    // 保留原始字段用于类型兼容
    subject: course.subject,
    teacher: course.teacher,
    relatedExercise: course.relatedExercise,
    students: 0 // 暂无学生数量字段
  };
  
  console.log('transformBackendCourse - 输出数据:', result);
  return result;
};

// 模拟课程数据（在实际API连接前使用）
const mockCourses: Course[] = [
  // 语文课程
  {
    id: '1001',
    title: '语文基础知识与语言表达',
    instructor: '王老师',
    category: '语文',
    students: 45,
    createdAt: '2024-01-15',
    description: '掌握语文基础知识，提升语言表达能力',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/gradient-ui-ux-background_23-2149052117.jpg'}
    ],
    courseCode: 'CN1001',
  },
  {
    id: '1002',
    title: '现代文阅读与赏析',
    instructor: '王老师',
    category: '语文',
    students: 42,
    createdAt: '2024-01-16',
    description: '提升现代文阅读理解和文学赏析能力',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/gradient-ui-ux-background_23-2149052117.jpg'}
    ],
    courseCode: 'CN1002',
  },
  {
    id: '1003',
    title: '古代诗文鉴赏',
    instructor: '李老师',
    category: '语文',
    students: 38,
    createdAt: '2024-01-17',
    description: '学习古代诗词文章，培养文学素养',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/gradient-ui-ux-background_23-2149052117.jpg'}
    ],
    courseCode: 'CN1003',
  },
  {
    id: '1004',
    title: '写作技巧与应用',
    instructor: '张老师',
    category: '语文',
    students: 40,
    createdAt: '2024-01-18',
    description: '掌握各类文体写作技巧和方法',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/gradient-ui-ux-background_23-2149052117.jpg'}
    ],
    courseCode: 'CN1004',
  },
  {
    id: '1005',
    title: '名著导读与研究',
    instructor: '刘老师',
    category: '语文',
    students: 35,
    createdAt: '2024-01-19',
    description: '深入解读中外名著，提升文学素养',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/gradient-ui-ux-background_23-2149052117.jpg'}
    ],
    courseCode: 'CN1005',
  },

  // 数学课程
  {
    id: '2001',
    title: '函数与导数',
    instructor: '张老师',
    category: '数学',
    students: 48,
    createdAt: '2024-01-15',
    description: '掌握函数概念和导数的运算与应用',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/dark-gradient-background-with-copy-space_53876-99548.jpg'}
    ],
    courseCode: 'MATH2001',
  },
  {
    id: '2002',
    title: '立体几何',
    instructor: '李老师',
    category: '数学',
    students: 42,
    createdAt: '2024-01-16',
    description: '研究空间几何体的性质和计算',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/dark-gradient-background-with-copy-space_53876-99548.jpg'}
    ],
    courseCode: 'MATH2002',
  },
  {
    id: '2003',
    title: '概率与统计',
    instructor: '王老师',
    category: '数学',
    students: 45,
    createdAt: '2024-01-17',
    description: '学习概率论基础和统计方法',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/dark-gradient-background-with-copy-space_53876-99548.jpg'}
    ],
    courseCode: 'MATH2003',
  },
  {
    id: '2004',
    title: '三角函数',
    instructor: '赵老师',
    category: '数学',
    students: 40,
    createdAt: '2024-01-18',
    description: '深入学习三角函数的性质和应用',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/dark-gradient-background-with-copy-space_53876-99548.jpg'}
    ],
    courseCode: 'MATH2004',
  },
  {
    id: '2005',
    title: '数列与极限',
    instructor: '钱老师',
    category: '数学',
    students: 38,
    createdAt: '2024-01-19',
    description: '掌握数列概念和极限理论',
    sources: [
      {type: 'image', url: 'https://img.freepik.com/free-vector/dark-gradient-background-with-copy-space_53876-99548.jpg'}
    ],
    courseCode: 'MATH2005',
  },

  // 英语课程
  {
    id: '3001',
    title: '英语听力训练',
    instructor: 'David',
    category: '英语',
    students: 50,
    createdAt: '2024-01-15',
    description: '提升英语听力理解能力',
    coverImage: 'https://img.freepik.com/free-vector/gradient-network-connection-background_23-2149011025.jpg',
    courseCode: 'ENG3001',
  },
  {
    id: '3002',
    title: '英语阅读理解',
    instructor: 'Sarah',
    category: '英语',
    students: 45,
    createdAt: '2024-01-16',
    description: '提高英语阅读速度和理解能力',
    coverImage: 'https://img.freepik.com/free-vector/gradient-network-connection-background_23-2149011025.jpg',
    courseCode: 'ENG3002',
  },
  {
    id: '3003',
    title: '英语写作进阶',
    instructor: 'Michael',
    category: '英语',
    students: 42,
    createdAt: '2024-01-17',
    description: '掌握英语写作技巧和方法',
    coverImage: 'https://img.freepik.com/free-vector/gradient-network-connection-background_23-2149011025.jpg',
    courseCode: 'ENG3003',
  },
  {
    id: '3004',
    title: '英语口语表达',
    instructor: 'Emma',
    category: '英语',
    students: 38,
    createdAt: '2024-01-18',
    description: '提升英语口语交际能力',
    coverImage: 'https://img.freepik.com/free-vector/gradient-network-connection-background_23-2149011025.jpg',
    courseCode: 'ENG3004',
  },
  {
    id: '3005',
    title: '英语语法强化',
    instructor: 'John',
    category: '英语',
    students: 44,
    createdAt: '2024-01-19',
    description: '系统学习英语语法知识',
    coverImage: 'https://img.freepik.com/free-vector/gradient-network-connection-background_23-2149011025.jpg',
    courseCode: 'ENG3005',
  },

  // 物理课程
  {
    id: '4001',
    title: '力学基础',
    instructor: '赵老师',
    category: '物理',
    students: 45,
    createdAt: '2024-01-15',
    description: '学习牛顿力学和运动学基础',
    coverImage: 'https://img.freepik.com/free-vector/realistic-3d-geometric-background_79603-1685.jpg',
    courseCode: 'PHY4001',
  },
  {
    id: '4002',
    title: '电磁学',
    instructor: '钱老师',
    category: '物理',
    students: 42,
    createdAt: '2024-01-16',
    description: '研究电场、磁场及其相互作用',
    coverImage: 'https://img.freepik.com/free-vector/realistic-3d-geometric-background_79603-1685.jpg',
    courseCode: 'PHY4002',
  },
  {
    id: '4003',
    title: '热学',
    instructor: '孙老师',
    category: '物理',
    students: 40,
    createdAt: '2024-01-17',
    description: '学习热力学基本定律和应用',
    coverImage: 'https://img.freepik.com/free-vector/realistic-3d-geometric-background_79603-1685.jpg',
    courseCode: 'PHY4003',
  },
  {
    id: '4004',
    title: '光学',
    instructor: '李老师',
    category: '物理',
    students: 38,
    createdAt: '2024-01-18',
    description: '研究光的传播、反射和折射',
    coverImage: 'https://img.freepik.com/free-vector/realistic-3d-geometric-background_79603-1685.jpg',
    courseCode: 'PHY4004',
  },
  {
    id: '4005',
    title: '原子物理',
    instructor: '周老师',
    category: '物理',
    students: 35,
    createdAt: '2024-01-19',
    description: '探索原子结构和量子现象',
    coverImage: 'https://img.freepik.com/free-vector/realistic-3d-geometric-background_79603-1685.jpg',
    courseCode: 'PHY4005',
  },

  // 化学课程
  {
    id: '5001',
    title: '化学反应原理',
    instructor: '刘老师',
    category: '化学',
    students: 42,
    createdAt: '2024-01-15',
    description: '学习化学反应基本原理和类型',
    coverImage: 'https://img.freepik.com/free-vector/colorful-wavy-background_23-2148466334.jpg',
    courseCode: 'CHEM5001',
  },
  {
    id: '5002',
    title: '有机化学基础',
    instructor: '张老师',
    category: '化学',
    students: 40,
    createdAt: '2024-01-16',
    description: '研究有机化合物的结构与性质',
    coverImage: 'https://img.freepik.com/free-vector/colorful-wavy-background_23-2148466334.jpg',
    courseCode: 'CHEM5002',
  },
  {
    id: '5003',
    title: '化学实验技能',
    instructor: '王老师',
    category: '化学',
    students: 35,
    createdAt: '2024-01-17',
    description: '培养化学实验操作技能',
    coverImage: 'https://img.freepik.com/free-vector/colorful-wavy-background_23-2148466334.jpg',
    courseCode: 'CHEM5003',
  },
  {
    id: '5004',
    title: '物质结构与性质',
    instructor: '李老师',
    category: '化学',
    students: 38,
    createdAt: '2024-01-18',
    description: '探究物质微观结构与宏观性质',
    coverImage: 'https://img.freepik.com/free-vector/colorful-wavy-background_23-2148466334.jpg',
    courseCode: 'CHEM5004',
  },
  {
    id: '5005',
    title: '化学与生活',
    instructor: '赵老师',
    category: '化学',
    students: 45,
    createdAt: '2024-01-19',
    description: '了解化学在日常生活中的应用',
    coverImage: 'https://img.freepik.com/free-vector/colorful-wavy-background_23-2148466334.jpg',
    courseCode: 'CHEM5005',
  },

  // 生物课程
  {
    id: '6001',
    title: '分子与细胞',
    instructor: '陈老师',
    category: '生物',
    students: 40,
    createdAt: '2024-01-15',
    description: '研究生命的基本单位-细胞',
    coverImage: 'https://img.freepik.com/free-vector/abstract-white-shapes-background_79603-1362.jpg',
    courseCode: 'BIO6001',
  },
  {
    id: '6002',
    title: '遗传与进化',
    instructor: '李老师',
    category: '生物',
    students: 38,
    createdAt: '2024-01-16',
    description: '学习遗传规律和生物进化理论',
    coverImage: 'https://img.freepik.com/free-vector/abstract-white-shapes-background_79603-1362.jpg',
    courseCode: 'BIO6002',
  },
  {
    id: '6003',
    title: '生态与环境',
    instructor: '王老师',
    category: '生物',
    students: 42,
    createdAt: '2024-01-17',
    description: '探索生物与环境的关系',
    coverImage: 'https://img.freepik.com/free-vector/abstract-white-shapes-background_79603-1362.jpg',
    courseCode: 'BIO6003',
  },
  {
    id: '6004',
    title: '人体健康与医学',
    instructor: '张老师',
    category: '生物',
    students: 45,
    createdAt: '2024-01-18',
    description: '了解人体结构和健康知识',
    coverImage: 'https://img.freepik.com/free-vector/abstract-white-shapes-background_79603-1362.jpg',
    courseCode: 'BIO6004',
  },
  {
    id: '6005',
    title: '生物技术应用',
    instructor: '刘老师',
    category: '生物',
    students: 36,
    createdAt: '2024-01-19',
    description: '学习现代生物技术及其应用',
    coverImage: 'https://img.freepik.com/free-vector/abstract-white-shapes-background_79603-1362.jpg',
    courseCode: 'BIO6005',
  },

  // 历史课程
  {
    id: '7001',
    title: '中国古代史',
    instructor: '吴老师',
    category: '历史',
    students: 42,
    createdAt: '2024-01-15',
    description: '探索中国古代历史发展脉络',
    coverImage: 'https://img.freepik.com/free-vector/abstract-background-with-squares_23-2148995948.jpg',
    courseCode: 'HIS7001',
  },
  {
    id: '7002',
    title: '中国近现代史',
    instructor: '郑老师',
    category: '历史',
    students: 45,
    createdAt: '2024-01-16',
    description: '研究中国近现代重要历史事件',
    coverImage: 'https://img.freepik.com/free-vector/abstract-background-with-squares_23-2148995948.jpg',
    courseCode: 'HIS7002',
  },
  {
    id: '7003',
    title: '世界古代史',
    instructor: '王老师',
    category: '历史',
    students: 38,
    createdAt: '2024-01-17',
    description: '了解世界古代文明的发展',
    coverImage: 'https://img.freepik.com/free-vector/abstract-background-with-squares_23-2148995948.jpg',
    courseCode: 'HIS7003',
  },
  {
    id: '7004',
    title: '世界近现代史',
    instructor: '李老师',
    category: '历史',
    students: 40,
    createdAt: '2024-01-18',
    description: '学习世界近现代重要历史进程',
    coverImage: 'https://img.freepik.com/free-vector/abstract-background-with-squares_23-2148995948.jpg',
    courseCode: 'HIS7004',
  },
  {
    id: '7005',
    title: '历史研究方法',
    instructor: '张老师',
    category: '历史',
    students: 35,
    createdAt: '2024-01-19',
    description: '掌握历史研究的基本方法',
    coverImage: 'https://img.freepik.com/free-vector/abstract-background-with-squares_23-2148995948.jpg',
    courseCode: 'HIS7005',
  },

  // 地理课程
  {
    id: '8001',
    title: '自然地理基础',
    instructor: '林老师',
    category: '地理',
    students: 40,
    createdAt: '2024-01-15',
    description: '学习地球表层环境要素',
    coverImage: 'https://img.freepik.com/free-vector/gradient-geometric-background_52683-62677.jpg',
    courseCode: 'GEO8001',
  },
  {
    id: '8002',
    title: '人文地理概论',
    instructor: '王老师',
    category: '地理',
    students: 42,
    createdAt: '2024-01-16',
    description: '研究人类活动与地理环境的关系',
    coverImage: 'https://img.freepik.com/free-vector/gradient-geometric-background_52683-62677.jpg',
    courseCode: 'GEO8002',
  },
  {
    id: '8003',
    title: '区域地理研究',
    instructor: '张老师',
    category: '地理',
    students: 38,
    createdAt: '2024-01-17',
    description: '探索不同地区的地理特征',
    coverImage: 'https://img.freepik.com/free-vector/gradient-geometric-background_52683-62677.jpg',
    courseCode: 'GEO8003',
  },
  {
    id: '8004',
    title: '地理信息技术',
    instructor: '李老师',
    category: '地理',
    students: 35,
    createdAt: '2024-01-18',
    description: '学习GIS等现代地理技术',
    coverImage: 'https://img.freepik.com/free-vector/gradient-geometric-background_52683-62677.jpg',
    courseCode: 'GEO8004',
  },
  {
    id: '8005',
    title: '环境与可持续发展',
    instructor: '赵老师',
    category: '地理',
    students: 44,
    createdAt: '2024-01-19',
    description: '研究地理环境与可持续发展',
    coverImage: 'https://img.freepik.com/free-vector/gradient-geometric-background_52683-62677.jpg',
    courseCode: 'GEO8005',
  },

  // 政治课程
  {
    id: '9001',
    title: '政治常识与理论',
    instructor: '黄老师',
    category: '政治',
    students: 45,
    createdAt: '2024-01-15',
    description: '学习基本政治理论知识',
    coverImage: 'https://img.freepik.com/free-vector/gradient-grainy-gradient-texture_79603-1712.jpg',
    courseCode: 'POL9001',
  },
  {
    id: '9002',
    title: '经济学基础',
    instructor: '李老师',
    category: '政治',
    students: 42,
    createdAt: '2024-01-16',
    description: '了解基本经济学原理',
    coverImage: 'https://img.freepik.com/free-vector/gradient-grainy-gradient-texture_79603-1712.jpg',
    courseCode: 'POL9002',
  },
  {
    id: '9003',
    title: '哲学思维',
    instructor: '王老师',
    category: '政治',
    students: 38,
    createdAt: '2024-01-17',
    description: '培养哲学思维方式',
    coverImage: 'https://img.freepik.com/free-vector/gradient-grainy-gradient-texture_79603-1712.jpg',
    courseCode: 'POL9003',
  },
  {
    id: '9004',
    title: '时事政治',
    instructor: '张老师',
    category: '政治',
    students: 40,
    createdAt: '2024-01-18',
    description: '分析当前政治热点问题',
    coverImage: 'https://img.freepik.com/free-vector/gradient-grainy-gradient-texture_79603-1712.jpg',
    courseCode: 'POL9004',
  },
  {
    id: '9005',
    title: '法律基础',
    instructor: '刘老师',
    category: '政治',
    students: 36,
    createdAt: '2024-01-19',
    description: '学习基本法律知识',
    coverImage: 'https://img.freepik.com/free-vector/gradient-grainy-gradient-texture_79603-1712.jpg',
    courseCode: 'POL9005',
  }
];

// 是否使用模拟数据
const USE_MOCK_DATA = false;

// 初始化标志，确保日志只打印一次
let isInitialized = false;

// 简单的内存缓存，用于模拟数据的持久化
let mockCoursesCache = [...mockCourses];

// 立即执行的初始化函数
(() => {
  if (!isInitialized) {
    logApi('课程服务初始化', {
      useMock: USE_MOCK_DATA,
      cacheSize: mockCoursesCache.length
    });
    isInitialized = true;
  }
})();

/**
 * 获取课程列表
 */
export const getCourses = async (): Promise<Course[]> => {
  logApi('调用 getCourses API');
  console.log('courseService - 开始获取课程列表');
  
  try {
    if (USE_MOCK_DATA) {
      // 模拟API请求延迟
      console.log('courseService - 使用模拟数据');
      return new Promise((resolve) => {
        logData('获取课程列表，当前缓存', { count: mockCoursesCache.length });
        setTimeout(() => {
          logApi('getCourses 请求完成', { count: mockCoursesCache.length });
          resolve([...mockCoursesCache]); // 返回缓存的深拷贝
        }, 800);
      });
    }
    
    // 实际API调用
    console.log('courseService - 执行实际API调用:', API_ENDPOINTS.COURSES);
    logApi('执行实际 getCourses API 调用');
    
    // 发送API请求
    // 注意: api.ts的响应拦截器已经提取了data字段，所以apiResponse现在是 { total, courses, ... }
    const apiResponse = await api.get(API_ENDPOINTS.COURSES) as unknown as {
      courses: BackendCourse[];
      total: number;
      currentPage?: number;
      totalPages?: number;
    };
    console.log('courseService - API响应结构:', typeof apiResponse, apiResponse ? Object.keys(apiResponse) : 'null');
    
    // 完整打印响应内容供调试
    try {
      console.log('courseService - API响应详情:', JSON.stringify(apiResponse, null, 2));
    } catch(e) {
      console.log('courseService - 无法序列化完整响应:', e);
    }
    
    // 拦截器已经提取了data字段，所以apiResponse现在直接是 { courses: [], total: X, ... }
    if (apiResponse && apiResponse.courses && Array.isArray(apiResponse.courses)) {
      const { courses, total } = apiResponse;
      console.log(`courseService - 找到courses数组, 共${courses.length}项, API返回总数${total}`);
      
      // 转换后端数据格式为前端格式
      const mappedCourses = courses.map((course: BackendCourse) => ({
        id: course.id.toString(),
        title: course.name,
        description: course.description || '',
        content: course.content || '',
        // 学科信息
        category: course.subject?.name || '未分类',
        // 教师信息
        instructor: course.teacher?.name || '未分配教师',
        // 课程编号
        courseCode: course.courseCode || course.course_code || '',
        // 创建日期
        createdAt: course.createdAt || course.created_at || course.updatedAt || new Date().toISOString(),
        // 媒体资源
        sources: course.sources || [],
        // 关联习题ID - 尝试多种可能的字段，确保转换为字符串
        relatedExerciseId: (course.relatedExercise?.id || course.relatedExerciseId || course.related_exercise_id || '').toString(),
        // 保留原始字段用于类型兼容
        subject: course.subject,
        teacher: course.teacher,
        relatedExercise: course.relatedExercise,
        students: 0 // 暂无学生数量字段
      }));
      
      console.log('courseService - 数据映射完成, 处理后课程数量:', mappedCourses.length);
      if (mappedCourses.length > 0) {
        console.log('courseService - 处理后第一条数据示例:', {
          ...mappedCourses[0],
          content: mappedCourses[0].content ? `${mappedCourses[0].content.substring(0, 100)}...` : '无内容'
        });
      }
      return mappedCourses;
    }
    
    // 兜底：尝试从其他可能的数据结构中解析
    console.log('courseService - 尝试其他可能的数据结构');
    
    // 1. 检查apiResponse本身是否为数组(直接返回课程列表)
    if (Array.isArray(apiResponse)) {
      console.log('courseService - apiResponse本身是数组，直接返回');
      return apiResponse;
    }
    
    console.error('courseService - 无法解析API响应，返回空数组');
    console.error('courseService - 响应格式:', apiResponse);
    return [];
  } catch (error) {
    console.error('courseService - 获取课程列表失败，错误详情:', error);
    logError('获取课程列表失败', error);
    // 发生错误时返回空数组
    return [];
  }
};

/**
 * 获取单个课程详情
 */
export const getCourseById = async (id: string): Promise<Course | null> => {
  logApi(`调用 getCourseById API, id=${id}`);
  
  try {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const course = mockCoursesCache.find(c => c.id === id);
          logData(`获取课程(ID:${id})`, course || '未找到');
          resolve(course || null);
        }, 500);
      });
    }
    
    // 实际API调用
    logApi(`执行实际 getCourseById API 调用, id=${id}`);
    console.log(`getCourseById - 请求URL: ${API_ENDPOINTS.COURSES}/${id}`);
    
    const response = await api.get(`${API_ENDPOINTS.COURSES}/${id}`);
    
    // API拦截器已经提取了data字段，所以response直接是课程数据
    console.log('getCourseById - API响应类型:', typeof response);
    console.log('getCourseById - API响应内容:', response);
    
    // 尝试序列化响应以便调试
    try {
      console.log('getCourseById - API响应JSON:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('getCourseById - 无法序列化响应:', e);
    }
    
    if (response && typeof response === 'object') {
      console.log('getCourseById - 响应对象的键:', Object.keys(response));
      
      const course = transformBackendCourse(response as unknown as BackendCourse);
      logData(`获取课程(ID:${id})`, course);
      return course;
    } else {
      console.error('getCourseById - 响应数据格式不正确:', response);
      return null;
    }
  } catch (error) {
    console.error(`getCourseById - 获取课程(ID:${id})失败:`, error);
    logError(`获取课程(ID:${id})失败`, error);
    return null;
  }
};

/**
 * 根据学科代码获取课程列表
 * @param subjectCode 学科代码（如：MATH, CN, ENG）
 */
export const getCoursesBySubject = async (subjectCode: string): Promise<Course[]> => {
  logApi(`调用 getCoursesBySubject API, subjectCode=${subjectCode}`);
  
  try {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          // 根据学科代码筛选课程
          let categoryFilter = '';
          switch(subjectCode.toUpperCase()) {
            case 'MATH':
              categoryFilter = '数学';
              break;
            case 'CN':
              categoryFilter = '语文';
              break;
            case 'ENG':
              categoryFilter = '英语';
              break;
            default:
              categoryFilter = subjectCode;
          }
          
          const subjectCourses = mockCoursesCache.filter(course => 
            course.category === categoryFilter
          );
          logData(`获取学科(${subjectCode})的课程`, subjectCourses);
          resolve(subjectCourses);
        }, 500);
      });
    }
    
    // 实际API调用 - 根据学科代码获取课程
    logApi(`执行实际 getCoursesBySubject API 调用, subjectCode=${subjectCode}`);
    const response = await api.get(`${API_ENDPOINTS.COURSES}/subject/${subjectCode}`);
    
    console.log('getCoursesBySubject API响应:', response);
    
    let courses: Course[] = [];
    // API拦截器已经提取了data字段，所以response现在直接是课程数组
    if (Array.isArray(response)) {
      courses = response.map(transformBackendCourse);
      console.log(`转换后的课程数据(${subjectCode}):`, courses);
    } else {
      console.warn('getCoursesBySubject: API响应格式不正确:', response);
    }
    
    logData(`获取学科(${subjectCode})的课程`, courses);
    return courses;
  } catch (error) {
    logError(`获取学科(${subjectCode})的课程失败`, error);
    return [];
  }
};

/**
 * 创建新课程
 */
export const createCourse = async (courseData: Omit<Course, 'id'>): Promise<Course | null> => {
  logApi('调用 createCourse API', { title: courseData.title });
  console.log('创建课程数据:', {
    ...courseData,
    content: courseData.content ? `${courseData.content.substring(0, 100)}...` : '无内容'
  });
  
  try {
    if (USE_MOCK_DATA) {
      // 模拟创建新课程
      const newCourse: Course = {
        ...courseData,
        id: `${Date.now()}`, // 使用时间戳作为临时ID
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      return new Promise((resolve) => {
        setTimeout(() => {
          // 添加到缓存
          mockCoursesCache.push(newCourse);
          logApi('创建课程成功', { 
            id: newCourse.id, 
            cacheSize: mockCoursesCache.length 
          });
          // 返回新创建课程的深拷贝
          resolve({...newCourse});
        }, 800);
      });
    }
    
    // 实际API调用
    logApi('执行实际 createCourse API 调用');
    console.log('准备向后端发送POST请求:', API_ENDPOINTS.COURSES);
    
    // 获取学科数据，将学科名称转换为学科代码
    const subjects = await getSubjects();
    const subject = subjects.find(s => s.name === courseData.category);
    
    if (!subject) {
      throw new Error(`找不到学科: ${courseData.category}`);
    }
    
    // 转换字段名，将前端的字段映射到后端的字段
    const apiData = {
      id: courseData.courseCode || `C${Date.now().toString().substring(7, 12)}`, // 使用courseCode作为ID，或自动生成
      title: courseData.title, // 后端期望title字段，不是name
      description: courseData.description,
      content: courseData.content, // 确保将content字段包含在API请求中
      subject: subject.code, // 后端期望学科代码，不是学科ID
      media: courseData.sources || [], // 后端期望media字段，不是sources
      relatedExerciseId: courseData.relatedExerciseId || '', // 修复：使用正确的relatedExerciseId字段
      teacherId: null, // 暂不设置教师
      coverImage: courseData.coverImage
    };
    
    console.log('转换后的API请求数据:', {
      ...apiData,
      content: apiData.content ? `${apiData.content.substring(0, 100)}...` : '无内容'
    });
    
    const response = await api.post(API_ENDPOINTS.COURSES, apiData) as unknown as Course;
    
    logApi('实际 API 返回', { data: response });
    console.log('API响应:', JSON.stringify(response, null, 2));
    
    // API拦截器已经提取了data字段，所以response直接是课程数据
    return response || null;
  } catch (error) {
    logError('创建课程失败', error);
    console.error('创建课程API错误:', error);
    return null;
  }
};

/**
 * 更新课程
 */
export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<Course | null> => {
  console.log(`调用 updateCourse API, id=${id}`, { 
    title: courseData.title,
    fields: Object.keys(courseData)
  });
  
  console.log('更新课程数据:', {
    ...courseData,
    content: courseData.content ? `${courseData.content.substring(0, 100)}...` : '无内容'
  });
  
  try {
    if (USE_MOCK_DATA) {
      // 模拟更新课程
      const courseIndex = mockCoursesCache.findIndex(c => c.id === id);
      if (courseIndex === -1) {
        console.error(`更新课程失败：未找到ID为${id}的课程`);
        return null;
      }
      
      const updatedCourse = {
        ...mockCoursesCache[courseIndex],
        ...courseData
      };
      
      return new Promise((resolve) => {
        setTimeout(() => {
          // 更新缓存
          mockCoursesCache[courseIndex] = updatedCourse;
          console.log(`更新课程(ID:${id})成功`, { title: updatedCourse.title });
          // 返回更新后课程的深拷贝
          resolve({...updatedCourse});
        }, 800);
      });
    }
    
    // 实际API调用
    console.log(`执行实际 updateCourse API 调用, id=${id}`);
    
    // 准备API数据
    const apiData: Record<string, unknown> = {
      // 直接从courseData中映射所有需要的字段
      title: courseData.title, // 后端期望title字段，不是name
      description: courseData.description,
      content: courseData.content,
      media: courseData.sources, // 后端期望media字段，不是sources
      relatedExerciseId: courseData.relatedExerciseId
    };
    
    // 如果有学科分类，获取对应的学科ID
    if (courseData.category) {
      try {
        const subjects = await getSubjects();
        console.log('获取到学科列表:', subjects.map(s => s.name));
        
        // 尝试精确匹配
        let subject = subjects.find(s => s.name === courseData.category);
        
        // 如果精确匹配失败，尝试模糊匹配（不区分大小写）
        if (!subject) {
          console.log(`精确匹配未找到学科: ${courseData.category}，尝试模糊匹配`);
          const categoryLower = courseData.category.toLowerCase();
          subject = subjects.find(s => s.name.toLowerCase() === categoryLower);
        }
        
        // 如果模糊匹配也失败，尝试部分匹配
        if (!subject && subjects.length > 0) {
          console.log(`模糊匹配未找到学科: ${courseData.category}，尝试部分匹配`);
          const categoryLower = courseData.category.toLowerCase();
          subject = subjects.find(s => s.name.toLowerCase().includes(categoryLower) || 
                                   categoryLower.includes(s.name.toLowerCase()));
        }
        
        if (subject) {
          console.log(`找到匹配的学科: ${subject.name}, 代码: ${subject.code}`);
          apiData.subject = subject.code; // 后端期望学科代码，不是学科ID
        } else {
          console.warn(`未找到匹配的学科: ${courseData.category}, 将使用第一个可用学科`);
          
          // 如果实在找不到匹配的学科，使用第一个可用学科
          if (subjects.length > 0) {
            const firstSubject = subjects[0];
            apiData.subject = firstSubject.code; // 后端期望学科代码，不是学科ID
            console.log(`使用默认学科: ${firstSubject.name}, 代码: ${firstSubject.code}`);
          } else {
            console.error('没有可用的学科数据');
          }
        }
      } catch (error) {
        console.error('获取学科数据失败:', error);
        // 继续处理，让后端返回更具体的错误
      }
    }
    
    // 打印relatedExerciseId的值，确认是否存在
    console.log('更新课程 - relatedExerciseId值:', courseData.relatedExerciseId);
    
    // 调试：显示完整的URL和请求数据
    console.log(`发送PUT请求到: ${API_ENDPOINTS.COURSES}/${id}`);
    console.log('请求数据:', JSON.stringify(apiData, null, 2));
    
    // 发送API请求
    try {
      const response = await api.put(`${API_ENDPOINTS.COURSES}/${id}`, apiData) as unknown as Course;
      console.log('更新课程成功:', response);
      
      // API拦截器已经提取了data字段，所以response直接是课程数据
      return response || null;
    } catch (apiError) {
      console.error('API错误:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error(`更新课程(ID:${id})失败:`, error);
    // 抛出错误，让调用者处理
    throw error;
  }
};

/**
 * 删除课程
 */
export const deleteCourse = async (id: string): Promise<boolean> => {
  logApi(`调用 deleteCourse API, id=${id}`);
  
  try {
    if (USE_MOCK_DATA) {
      // 模拟删除课程
      return new Promise((resolve) => {
        setTimeout(() => {
          // 从缓存中删除
          const initialLength = mockCoursesCache.length;
          mockCoursesCache = mockCoursesCache.filter(c => c.id !== id);
          const deleted = initialLength > mockCoursesCache.length;
          
          logApi(`删除课程(ID:${id})${deleted ? '成功' : '失败'}`, { 
            success: deleted,
            cacheSize: mockCoursesCache.length 
          });
          
          resolve(deleted);
        }, 800);
      });
    }
    
    // 实际API调用
    logApi(`执行实际 deleteCourse API 调用, id=${id}`);
    await api.delete(`${API_ENDPOINTS.COURSES}/${id}`);
    logApi(`删除课程(ID:${id})成功`);
    return true;
  } catch (error) {
    logError(`删除课程(ID:${id})失败`, error);
    return false;
  }
}; 