import api from "./api";

// 任务状态类型
export type TaskStatus = "pending" | "running" | "success" | "failed";

// 任务类型
export type TaskType = "ai_generate_exercise_group";

// 任务接口
export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  status: TaskStatus;
  params?: any;
  result?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 任务列表响应
export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 任务统计
export interface TaskStats {
  pending: number;
  running: number;
  success: number;
  failed: number;
  total: number;
}

/**
 * 获取任务列表
 */
export const getTasks = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string | string[];
  type?: string;
}): Promise<TaskListResponse> => {
  const response = await api.get("/api/admin/tasks", { params });
  return response.data;
};

/**
 * 获取任务详情
 */
export const getTask = async (id: string): Promise<Task> => {
  const response = await api.get(`/api/admin/tasks/${id}`);
  return response.data;
};

/**
 * 删除任务
 */
export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/tasks/${id}`);
};

/**
 * 获取任务统计
 */
export const getTaskStats = async (): Promise<TaskStats> => {
  const response = await api.get("/api/admin/tasks/stats");
  return response.data;
};

/**
 * 创建AI生成习题组任务
 */
export const createAIGenerateExerciseGroupTask = async (params: {
  groupName: string;
  subject: string;
  type: string;
  courseId?: string;
  relevance?: string;
  difficulty?: number;
  questionCount: number;
}): Promise<Task> => {
  const response = await api.post("/api/admin/tasks/ai-generate-exercise-group", params);
  return response.data;
};

/**
 * 清理旧任务
 */
export const cleanupOldTasks = async (days: number = 30): Promise<{ deletedCount: number }> => {
  const response = await api.post("/api/admin/tasks/cleanup", { days });
  return response.data;
};

/**
 * 获取任务状态颜色
 */
export const getTaskStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "pending":
      return "#faad14"; // 橙色
    case "running":
      return "#1890ff"; // 蓝色
    case "success":
      return "#52c41a"; // 绿色
    case "failed":
      return "#ff4d4f"; // 红色
    default:
      return "#d9d9d9"; // 灰色
  }
};

/**
 * 获取任务状态文本
 */
export const getTaskStatusText = (status: TaskStatus): string => {
  switch (status) {
    case "pending":
      return "等待中";
    case "running":
      return "运行中";
    case "success":
      return "成功";
    case "failed":
      return "失败";
    default:
      return "未知";
  }
};

/**
 * 获取任务类型文本
 */
export const getTaskTypeText = (type: TaskType): string => {
  switch (type) {
    case "ai_generate_exercise_group":
      return "AI生成习题组";
    default:
      return "未知任务";
  }
}; 