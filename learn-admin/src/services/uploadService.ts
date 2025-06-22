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

    const response: any = await api({
      url: '/api/admin/upload/image',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 添加详细日志调试
    console.log('上传图片响应:', JSON.stringify(response, null, 2));

    // 处理多级嵌套的响应结构
    if (response && response.err_no === 0 && response.data) {
      return response.data.url;
    } else if (response && response.data && response.data.data) {
      // 处理可能的data嵌套
      return response.data.data.url;
    }
    return null;
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

    const response: any = await api({
      url: '/api/admin/upload/video',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 添加详细日志调试
    console.log('上传视频响应:', JSON.stringify(response, null, 2));

    // 处理多级嵌套的响应结构
    if (response && response.err_no === 0 && response.data) {
      return response.data.url;
    } else if (response && response.data && response.data.data) {
      // 处理可能的data嵌套
      return response.data.data.url;
    }
    return null;
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
    console.log('开始上传课程封面:', file.name, file.type, file.size);
    const formData = new FormData();
    formData.append('cover', file);

    const response: any = await api({
      url: '/api/admin/upload/course/cover',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 添加详细日志调试
    console.log('上传课程封面完整响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应键:', response ? Object.keys(response) : 'null');

    // 处理多级嵌套的响应结构
    if (response && response.err_no === 0 && response.data && response.data.url) {
      console.log('找到URL:', response.data.url);
      return response.data.url;
    } else if (response && response.data && response.data.data && response.data.data.url) {
      // 处理可能的data嵌套
      console.log('在嵌套data中找到URL:', response.data.data.url);
      return response.data.data.url;
    } else if (response && response.url) {
      // 直接在响应根目录查找URL
      console.log('在响应根目录找到URL:', response.url);
      return response.url;
    }
    
    console.error('无法在响应中找到有效的URL:', response);
    return null;
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
    console.log('开始上传课程视频:', file.name, file.type, file.size);
    const formData = new FormData();
    formData.append('video', file);

    const response: any = await api({
      url: '/api/admin/upload/course/video',
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // 添加详细日志调试
    console.log('上传课程视频完整响应:', response);
    console.log('响应类型:', typeof response);
    console.log('响应键:', response ? Object.keys(response) : 'null');

    // 处理多级嵌套的响应结构
    if (response && response.err_no === 0 && response.data && response.data.url) {
      console.log('找到URL:', response.data.url);
      return response.data.url;
    } else if (response && response.data && response.data.data && response.data.data.url) {
      // 处理可能的data嵌套
      console.log('在嵌套data中找到URL:', response.data.data.url);
      return response.data.data.url;
    } else if (response && response.url) {
      // 直接在响应根目录查找URL
      console.log('在响应根目录找到URL:', response.url);
      return response.url;
    }
    
    console.error('无法在响应中找到有效的URL:', response);
    return null;
  } catch (error) {
    console.error('上传课程视频失败:', error);
    message.error('上传课程视频失败，请重试');
    return null;
  }
}; 