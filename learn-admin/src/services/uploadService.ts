import { message } from 'antd';
import api from './api';

/**
 * 上传响应接口
 */
export interface UploadResponse {
  url: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
}

/**
 * 上传图片
 * @param file 图片文件
 * @returns 上传成功后的图片URL
 */
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response: UploadResponse = await api({
      url: '/api/admin/upload/image',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // API拦截器已经处理了后端响应格式，直接返回URL
    return response?.url || null;
  } catch (error) {
    console.error('上传图片失败:', error);
    message.error('上传图片失败，请重试');
    return null;
  }
};

/**
 * 上传视频
 * @param file 视频文件
 * @returns 上传成功后的视频URL
 */
export const uploadVideo = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    const response: UploadResponse = await api({
      url: '/api/admin/upload/video',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // API拦截器已经处理了后端响应格式，直接返回URL
    return response?.url || null;
  } catch (error) {
    console.error('上传视频失败:', error);
    message.error('上传视频失败，请重试');
    return null;
  }
};

/**
 * 上传课程封面图片
 * @param file 图片文件
 * @returns 上传成功后的图片URL
 */
export const uploadCourseCover = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('cover', file);

    const response: UploadResponse = await api({
      url: '/api/admin/upload/course/cover',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // API拦截器已经处理了后端响应格式，直接返回URL
    return response?.url || null;
  } catch (error) {
    console.error('上传课程封面失败:', error);
    message.error('上传课程封面失败，请重试');
    return null;
  }
};

/**
 * 上传课程视频
 * @param file 视频文件
 * @returns 上传成功后的视频URL
 */
export const uploadCourseVideo = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('video', file);

    const response: UploadResponse = await api({
      url: '/api/admin/upload/course/video',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // API拦截器已经处理了后端响应格式，直接返回URL
    return response?.url || null;
  } catch (error) {
    console.error('上传课程视频失败:', error);
    message.error('上传课程视频失败，请重试');
    return null;
  }
}; 