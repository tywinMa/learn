/**
 * 格式化工具函数集合
 */

/**
 * 移除HTML标签，返回纯文本
 * @param htmlString 包含HTML标签的字符串
 * @returns 去除HTML标签后的纯文本
 */
export const stripHtml = (htmlString: string): string => {
  if (!htmlString) return '';
  return htmlString.replace(/<[^>]*>/g, '');
};

/**
 * 格式化习题标题，去除HTML标签并截断过长文本
 * @param question 习题问题文本
 * @param maxLength 最大显示长度
 * @returns 格式化后的习题标题
 */
export const formatExerciseTitle = (question: string, maxLength: number = 40): string => {
  const plainText = stripHtml(question);
  if (plainText.length <= maxLength) {
    return plainText;
  }
  return plainText.substring(0, maxLength) + '...';
};

/**
 * 格式化时间戳为易读格式
 * @param timestamp 时间戳或日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (timestamp: string | number | Date): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}; 