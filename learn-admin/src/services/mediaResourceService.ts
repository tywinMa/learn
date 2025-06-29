import api from './api';

// 年级信息接口
export interface Grade {
  id: number;
  name: string;
  displayOrder?: number;
}

// 学科信息接口
export interface Subject {
  code: string;
  name: string;
  description?: string;
}

// 单元信息接口
export interface Unit {
  id: string; // 修改为string类型，与后端Unit模型保持一致
  title: string;
  displayOrder?: number;
  courseIds?: string[]; // 包含的课程ID数组
  subjectGrade?: {
    id: number;
    grade: Grade;
    subject: Subject;
  };
}

// 课程信息接口
export interface Course {
  id: string;
  title: string;
  subject: string;
  gradeId?: number;
  grade?: Grade;
  subjectInfo?: Subject;
  CourseMediaResource?: {
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
  };
}

// 媒体资源类型定义
export interface MediaResource {
  id: number;
  type: 'course_explanation' | 'course_media' | 'example_media';
  resourceUrl: string;
  resourceType: 'image' | 'video';
  title: string;
  description?: string;
  uploadUserId: number;
  viewCount: number;
  clickCount: number;
  status: 'draft' | 'pending' | 'published' | 'under_review' | 'rejected';
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: number;
    username: string;
    name?: string;
  };
  courses?: Course[];
}

export interface CourseMediaResource {
  id: number;
  courseId: string;
  mediaResourceId: number;
  displayOrder: number;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  mediaResource?: MediaResource;
  course?: {
    id: string;
    title: string;
  };
  creator?: {
    id: number;
    username: string;
    name?: string;
  };
}

export interface MediaResourceListParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  resourceType?: string;
  search?: string;
  uploadUserId?: number;
}

export interface MediaResourceStats {
  totalCount: number;
  draftCount: number;
  publishedCount: number;
  pendingCount: number;
  underReviewCount: number;
  rejectedCount: number;
  typeStats: Record<string, number>;
  resourceTypeStats: Record<string, number>;
}

export interface CreateMediaResourceData {
  type: 'course_explanation' | 'course_media' | 'example_media';
  resourceUrl: string;
  resourceType: 'image' | 'video';
  title: string;
  description?: string;
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface UpdateMediaResourceData extends Partial<CreateMediaResourceData> {
  status?: 'draft' | 'pending' | 'published' | 'under_review' | 'rejected';
}

// 媒体资源管理服务
export const mediaResourceService = {
  // 获取媒体资源列表
  async getMediaResources(params: MediaResourceListParams = {}) {
    const response = await api.get('/api/admin/media-resources', { params });
    return response;
  },

  // 获取媒体资源详情
  async getMediaResource(id: number) {
    const response = await api.get(`/api/admin/media-resources/${id}`);
    return response;
  },

  // 创建媒体资源
  async createMediaResource(data: CreateMediaResourceData) {
    const response = await api.post('/api/admin/media-resources', data);
    return response;
  },

  // 更新媒体资源
  async updateMediaResource(id: number, data: UpdateMediaResourceData) {
    const response = await api.put(`/api/admin/media-resources/${id}`, data);
    return response;
  },

  // 提交审核
  async submitForReview(id: number) {
    const response = await api.post(`/api/admin/media-resources/${id}/submit`);
    return response;
  },

  // 删除媒体资源
  async deleteMediaResource(id: number) {
    const response = await api.delete(`/api/admin/media-resources/${id}`);
    return response;
  },

  // 批量更新状态
  async batchUpdateStatus(ids: number[], status: string) {
    const response = await api.post('/api/admin/media-resources/batch-status', { ids, status });
    return response;
  },

  // 增加点击量
  async incrementClickCount(id: number) {
    const response = await api.post(`/api/admin/media-resources/${id}/click`);
    return response;
  },

  // 获取媒体资源统计
  async getMediaResourceStats() {
    const response = await api.get('/api/admin/media-resources/stats');
    return response;
  }
};

// 课程-媒体资源关联管理服务
export const courseMediaResourceService = {
  // 获取课程的媒体资源列表
  async getCourseMediaResources(courseId: string, params: { type?: string; isActive?: boolean } = {}) {
    const response = await api.get(`/api/admin/media-resources/course/${courseId}/media-resources`, { params });
    return response;
  },

  // 获取媒体资源关联的课程列表
  async getMediaResourceCourses(mediaResourceId: number) {
    const response = await api.get(`/api/admin/media-resources/${mediaResourceId}/courses`);
    return response;
  },

  // 创建课程-媒体资源关联
  async createCourseMediaResource(data: {
    courseId: string;
    mediaResourceId: number;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    const response = await api.post('/api/admin/media-resources/course-media-resource', data);
    return response;
  },

  // 更新课程-媒体资源关联
  async updateCourseMediaResource(id: number, data: {
    displayOrder?: number;
    isActive?: boolean;
  }) {
    const response = await api.put(`/api/admin/media-resources/course-media-resource/${id}`, data);
    return response;
  },

  // 删除课程-媒体资源关联
  async deleteCourseMediaResource(id: number) {
    const response = await api.delete(`/api/admin/media-resources/course-media-resource/${id}`);
    return response;
  },

  // 删除媒体资源的所有课程关联
  async deleteAllCourseMediaResourcesByMediaId(mediaResourceId: number) {
    const response = await api.delete(`/api/admin/media-resources/${mediaResourceId}/course-relations`);
    return response;
  },

  // 批量关联媒体资源到课程
  async batchCreateCourseMediaResources(data: {
    courseId: string;
    mediaResourceIds: number[];
  }) {
    const response = await api.post('/api/admin/media-resources/course-media-resource/batch-create', data);
    return response;
  },

  // 批量更新关联顺序
  async batchUpdateDisplayOrder(updates: Array<{ id: number; displayOrder: number }>) {
    const response = await api.post('/api/admin/media-resources/course-media-resource/batch-order', { updates });
    return response;
  }
}; 