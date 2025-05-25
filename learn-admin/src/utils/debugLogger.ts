/**
 * 调试日志工具
 * 
 * 用于在控制台输出带有时间戳的调试信息，
 * 并且可以按照模块分组，方便查看。
 */

// 是否启用调试日志
const DEBUG_ENABLED = true;

// 颜色映射
const COLORS = {
  api: '#2f54eb',     // 蓝色：API调用
  router: '#722ed1',  // 紫色：路由相关
  render: '#13c2c2',  // 青色：渲染相关
  state: '#eb2f96',   // 粉色：状态变更
  data: '#52c41a',    // 绿色：数据处理
  error: '#f5222d',   // 红色：错误信息
  warning: '#faad14', // 橙色：警告信息
  info: '#595959'     // 灰色：一般信息
};

// 默认样式
const defaultStyle = `
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 3px;
`;

/**
 * 记录调试日志
 * @param module 模块名称
 * @param type 日志类型
 * @param message 日志消息
 * @param data 额外数据
 */
export const logDebug = (
  module: string,
  type: keyof typeof COLORS,
  message: string,
  data?: any
) => {
  if (!DEBUG_ENABLED) return;

  const timestamp = new Date().toLocaleTimeString('zh-CN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
  
  const color = COLORS[type] || COLORS.info;
  const style = `${defaultStyle} background-color: ${color}; color: white;`;
  
  // 使用带样式的控制台输出
  console.groupCollapsed(
    `%c ${module} %c ${timestamp} %c ${message}`,
    style,
    'background-color: #f0f0f0; color: #888; font-weight: normal; padding: 2px 5px; border-radius: 3px;',
    'font-weight: normal;'
  );
  
  if (data !== undefined) {
    console.log('数据:', data);
  }
  
  // 输出调用栈（仅在非生产环境）
  if (process.env.NODE_ENV !== 'production') {
    console.groupCollapsed('调用栈');
    console.trace();
    console.groupEnd();
  }
  
  console.groupEnd();
};

/**
 * API调用日志
 */
export const logApi = (message: string, data?: any) => {
  logDebug('API', 'api', message, data);
};

/**
 * 路由变化日志
 */
export const logRouter = (message: string, data?: any) => {
  logDebug('路由', 'router', message, data);
};

/**
 * 组件渲染日志
 */
export const logRender = (message: string, data?: any) => {
  logDebug('渲染', 'render', message, data);
};

/**
 * 状态变更日志
 */
export const logState = (message: string, data?: any) => {
  logDebug('状态', 'state', message, data);
};

/**
 * 数据处理日志
 */
export const logData = (message: string, data?: any) => {
  logDebug('数据', 'data', message, data);
};

/**
 * 错误日志
 */
export const logError = (message: string, error?: any) => {
  logDebug('错误', 'error', message, error);
};

/**
 * 警告日志
 */
export const logWarning = (message: string, data?: any) => {
  logDebug('警告', 'warning', message, data);
}; 