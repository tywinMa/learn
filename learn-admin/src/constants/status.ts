// 状态值类型定义
export type StatusValue = 'draft' | 'pending' | 'published' | 'under_review' | 'rejected';

// 状态选项接口
export interface StatusOption {
  value: StatusValue;
  label: string;
  color: string;
}

// 状态标签映射
export const STATUS_LABELS: Record<StatusValue, string> = {
  draft: "草稿",
  pending: "待审核", 
  published: "已发布",
  under_review: "审核中",
  rejected: "已退回",
};

// 状态颜色映射
export const STATUS_COLORS: Record<StatusValue, string> = {
  draft: "default",
  pending: "blue", 
  published: "green",
  under_review: "orange",
  rejected: "red",
};

// 状态选项列表
export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'draft', label: STATUS_LABELS.draft, color: STATUS_COLORS.draft },
  { value: 'pending', label: STATUS_LABELS.pending, color: STATUS_COLORS.pending },
  { value: 'published', label: STATUS_LABELS.published, color: STATUS_COLORS.published },
  { value: 'under_review', label: STATUS_LABELS.under_review, color: STATUS_COLORS.under_review },
  { value: 'rejected', label: STATUS_LABELS.rejected, color: STATUS_COLORS.rejected },
];

// 获取状态标签
export const getStatusLabel = (status: StatusValue | string): string => {
  return STATUS_LABELS[status as StatusValue] || status;
};

// 获取状态颜色
export const getStatusColor = (status: StatusValue | string): string => {
  return STATUS_COLORS[status as StatusValue] || 'default';
};

// 获取状态选项
export const getStatusOptions = (): StatusOption[] => {
  return STATUS_OPTIONS;
};

// 根据状态值获取完整的状态选项
export const getStatusOption = (status: StatusValue | string): StatusOption | undefined => {
  return STATUS_OPTIONS.find(option => option.value === status);
}; 