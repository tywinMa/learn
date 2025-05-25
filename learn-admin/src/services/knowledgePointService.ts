import api from './api';

// 知识点接口定义
export interface KnowledgePoint {
  id: number;
  title: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  subject: string;
  difficulty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subjectInfo?: {
    id: string;
    name: string;
    code: string;
  };
}

// 知识点列表响应接口
export interface KnowledgePointListResponse {
  knowledgePoints: KnowledgePoint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 查询参数接口
export interface KnowledgePointQueryParams {
  page?: number;
  limit?: number;
  subject?: string;
  type?: 'text' | 'image' | 'video';
  search?: string;
}

// 创建知识点参数接口
export interface CreateKnowledgePointData {
  title: string;
  content: string;
  type?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  subject: string;
  difficulty?: number;
}

// 更新知识点参数接口
export interface UpdateKnowledgePointData {
  title?: string;
  content?: string;
  type?: 'text' | 'image' | 'video';
  mediaUrl?: string;
  subject?: string;
  difficulty?: number;
  isActive?: boolean;
}

// 获取所有知识点
export const getKnowledgePoints = async (params: KnowledgePointQueryParams = {}): Promise<KnowledgePointListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.subject) queryParams.append('subject', params.subject);
  if (params.type) queryParams.append('type', params.type);
  if (params.search) queryParams.append('search', params.search);

  const url = `/api/admin/knowledge-points?${queryParams.toString()}`;
  return await api.get(url);
};

// 根据ID获取知识点
export const getKnowledgePointById = async (id: number): Promise<KnowledgePoint> => {
  return await api.get(`/api/admin/knowledge-points/${id}`);
};

// 创建知识点
export const createKnowledgePoint = async (data: CreateKnowledgePointData): Promise<KnowledgePoint> => {
  return await api.post('/api/admin/knowledge-points', data);
};

// 更新知识点
export const updateKnowledgePoint = async (id: number, data: UpdateKnowledgePointData): Promise<KnowledgePoint> => {
  return await api.put(`/api/admin/knowledge-points/${id}`, data);
};

// 删除知识点
export const deleteKnowledgePoint = async (id: number): Promise<void> => {
  return await api.delete(`/api/admin/knowledge-points/${id}`);
};

// 获取简化的知识点列表（用于选择器）
export const getKnowledgePointsForSelect = async (subject?: string): Promise<{ id: number; title: string; subject: string }[]> => {
  const response = await getKnowledgePoints({ 
    limit: 1000, // 获取足够多的知识点用于选择
    subject
  });
  
  return response.knowledgePoints.map(kp => ({
    id: kp.id,
    title: kp.title,
    subject: kp.subject
  }));
}; 