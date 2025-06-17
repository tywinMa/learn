import { API_BASE_URL } from '../app/constants/apiConfig';

export interface AIResponse {
  success: boolean;
  answer?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class AIService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * 上传图片并获取AI解题结果
   */
  async solveProblem(
    imageUri: string, 
    onProgress?: (progress: UploadProgress) => void,
    onStreamData?: (chunk: string) => void
  ): Promise<AIResponse> {
    try {
      // 构建FormData
      const formData = new FormData();
      
      // 处理图片文件
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      formData.append('image', blob, 'problem.jpg');

      // 发送请求
      const apiResponse = await fetch(`${this.baseURL}/ai/solve-problem`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'text/plain',
        },
      });

      if (!apiResponse.ok) {
        throw new Error('解题服务暂时不可用');
      }

      // 处理流式响应
      if (apiResponse.body && onStreamData) {
        const reader = apiResponse.body.getReader();
        const decoder = new TextDecoder();
        let answer = '';

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            answer += chunk;
            onStreamData(chunk);
          }

          return { success: true, answer };
        } catch (streamError) {
          console.error('流式读取错误:', streamError);
          // 如果流式读取失败，尝试读取完整响应
          const fullText = await apiResponse.text();
          return { success: true, answer: fullText };
        }
      } else {
        // 普通响应处理
        const answer = await apiResponse.text();
        return { success: true, answer };
      }

    } catch (error) {
      console.error('AI解题错误:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '解题失败' 
      };
    }
  }

  /**
   * 获取解题历史
   */
  async getSolutionHistory(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/ai/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取历史记录失败');
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('获取历史记录错误:', error);
      return [];
    }
  }

  /**
   * 预处理图片（可选功能）
   */
  async preprocessImage(imageUri: string, options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }): Promise<string> {
    // 这里可以添加图片预处理逻辑，比如压缩、裁剪等
    // 目前直接返回原图片URI
    return imageUri;
  }
}

export default new AIService(); 