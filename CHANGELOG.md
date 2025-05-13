# 变更日志

## 2023-10-15 多学科支持改进

### 学科主题管理优化

1. 删除了 `constants/SubjectTheme.ts` 常量文件
   - 改为从API获取主题数据，支持动态更新
   - 创建了全局的学科上下文 `hooks/useSubject.tsx`

2. 学科切换流程优化
   - 使用 `SubjectProvider` 统一管理学科状态
   - 在 `app/_layout.tsx` 中监听学科变化，动态更新导航主题
   - 移除了轮询AsyncStorage的方式，改为使用上下文API

3. 路由管理改进
   - 使用 expo-router 统一管理路由
   - 替代了直接操作 window.location 的方式
   - 学科切换过程中添加了更友好的用户提示

### 数据模型优化

1. 学科与题目关联增强
   - 在 Exercise 模型中添加了 `subjectCode` 字段
   - 增加了确保ID包含学科前缀的钩子函数
   - 所有题目ID现在强制包含学科代码前缀，例如 `math-1-1-1`

2. API 端点格式优化
   - 新增支持学科区分的API格式：`/api/exercises/:subject/:unitId`
   - 更新了前端代码确保传递正确的学科信息

3. 其他相关模型优化
   - 更新了 Unit、LearningContent 和 UserRecord 模型
   - 添加了 `subjectCode` 字段用于明确区分不同学科的数据
   - 添加了确保ID包含学科前缀的业务逻辑

### 用户体验改进

1. 学科切换时会立即更新UI主题色
2. 不同学科间的数据完全隔离，避免ID冲突
3. 题目请求和用户记录按学科正确区分

## 兼容性说明

- 更新保持了与现有数据的兼容性
- 旧API端点保持兼容，但建议使用新的带学科参数的端点 