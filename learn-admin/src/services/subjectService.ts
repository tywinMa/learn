import api from './api';

// 学科接口
export interface Subject {
  id: string;
  name: string;
  code: string;
  color?: string;
}

// 后端返回的学科数据接口
interface SubjectApiResponse {
  id: number;
  name: string;
  code: string;
  color?: string;
}

/**
 * 获取学科列表
 */
export const getSubjects = async (): Promise<Subject[]> => {
  try {
    console.log('获取学科列表 - 调用后端API');
    const response = await api({
      url: '/api/admin/subjects',
      method: 'GET'
    });
    
    // API拦截器已经提取了data字段，所以response就是数据数组
    if (response && Array.isArray(response)) {
      console.log('学科数据获取成功:', response);
      return response.map((subject: SubjectApiResponse) => ({
        id: subject.id.toString(),
        name: subject.name,
        code: subject.code || '',
        color: subject.color || '#1677ff'
      }));
    } else {
      console.warn('API返回数据格式错误, response:', response);
      return [];
    }
  } catch (error) {
    console.error('获取学科列表失败:', error);
    return [];
  }
};

/**
 * 根据学科代码获取学科信息
 */
export const getSubjectByCode = async (code: string): Promise<Subject | undefined> => {
  try {
    console.log(`获取学科信息 - 代码: ${code}`);
    
    // 先尝试从学科列表中查找
    const subjects = await getSubjects();
    const subject = subjects.find(s => s.code === code);
    
    if (subject) {
      return subject;
    }
    
    console.warn(`未找到学科代码: ${code}`);
    return undefined;
  } catch (error) {
    console.error(`获取学科(${code})信息失败:`, error);
    return undefined;
  }
};

/**
 * 根据学科名称获取颜色
 */
export const getSubjectColor = (subjectName: string): string => {
  // 如果没有提供学科名称或为空，返回默认颜色
  if (!subjectName || subjectName === '未分类') {
    return '#bfbfbf'; // 灰色
  }
  
  // 使用固定的颜色映射
  const colorMap: Record<string, string> = {
    '语文': '#1677ff',
    '数学': '#52c41a',
    '英语': '#722ed1',
    '物理': '#eb2f96',
    '化学': '#fa8c16',
    '生物': '#13c2c2',
    '历史': '#faad14',
    '地理': '#cf1322',
    '政治': '#2f54eb',
    '信息技术': '#08979c',
    '计算机': '#08979c'
  };
  
  // 检查固定映射中是否有匹配项
  if (colorMap[subjectName]) {
    return colorMap[subjectName];
  }
  
  // 为未知学科生成一个基于名称的哈希颜色
  const hash = subjectName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // 将哈希转换为颜色
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}; 