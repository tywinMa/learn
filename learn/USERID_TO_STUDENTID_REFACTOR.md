# APP端 userId 到 studentId 重构总结

## 重构目标
将APP端项目中使用`userId`但实际代表`studentId`的字段统一改为`studentId`，提高代码可读性和一致性。

## 主要更改

### 1. authService.ts
- **存储键更新**: `USER_ID` → `STUDENT_ID`
- **新增函数**: `getCurrentStudentId()` - 专门获取学生ID的函数
- **保持兼容**: `getCurrentUserId()` 仍然存在，内部调用 `getCurrentStudentId()`
- **登录/注册**: 统一使用 `STUDENT_ID` 存储键保存学生ID

### 2. progressService.ts
- **常量重命名**: `USER_ID` → `TEMP_STUDENT_ID`
- **函数重命名**: `getCurrentUserIdForProgress()` → `getCurrentStudentIdForProgress()`
- **API调用更新**: 所有API调用都使用真实的学生ID而不是硬编码的临时ID
- **参数更新**: `getUserProgressBySubject(subjectCode, userId)` → `getUserProgressBySubject(subjectCode, studentId?)`

### 3. pointsService.ts
- **函数重命名**: `getUserPoints(userId)` → `getStudentPoints(studentId?)`
- **参数优化**: 参数改为可选，自动获取当前学生ID
- **API端点更新**: `/api/users/` → `/api/students/`
- **向后兼容**: 保留 `getUserPoints` 作为 `getStudentPoints` 的别名

### 4. errorBookService.ts
- **移除硬编码**: 不再使用硬编码的 `USER_ID`
- **动态获取**: 所有API调用都动态获取当前学生ID
- **新增函数**: `getStudentWrongExercises()` - 更语义化的函数名
- **向后兼容**: 保留 `getErrorBook()` 函数

### 5. exercise.tsx
- **移除硬编码**: 不再导入和使用 `USER_ID` 常量
- **状态管理**: 添加 `currentStudentId` 状态来存储学生ID
- **异步处理**: 在组件初始化时获取并保存学生ID
- **API调用更新**: 所有API调用都使用真实的学生ID

### 6. study.tsx
- **移除硬编码**: 不再使用硬编码的 `USER_ID`
- **状态管理**: 添加 `currentStudentId` 状态
- **API调用更新**: 学习统计和积分获取都使用真实学生ID

### 7. 页面组件更新
- **wrong-exercises.tsx**: 使用动态获取的学生ID
- **shop.tsx**: API端点从 `/api/users/` 更新为 `/api/students/`
- **index.tsx**: 移除 `PROGRESS_USER_ID` 的使用

## 技术改进

### 1. 认证系统集成
- 所有服务现在都优先使用认证系统中的真实学生ID
- 只有在认证失败时才回退到临时ID
- 提高了数据的准确性和一致性

### 2. API端点统一
- 学生相关的API调用统一使用 `/api/students/` 端点
- 与后端的学生模型保持一致
- 提高了API的语义化程度

### 3. 错误处理改进
- 在异步函数中正确处理学生ID获取失败的情况
- 在组件卸载时的清理函数中使用预先获取的学生ID
- 避免了在非异步上下文中使用await的问题

### 4. 向后兼容性
- 保留了原有的函数名作为别名
- 确保现有代码不会因为重构而破坏
- 渐进式迁移策略

## 测试建议

1. **登录流程测试**: 确认学生登录后ID正确保存和获取
2. **进度同步测试**: 验证学习进度与正确的学生账户关联
3. **积分系统测试**: 确认积分获取和消费与正确学生关联
4. **错题本测试**: 验证错题记录与学生账户的正确关联
5. **多用户测试**: 确认不同学生账户之间的数据隔离

## 后续优化建议

1. **移除临时ID**: 在认证系统完善后，可以移除 `TEMP_STUDENT_ID` 的使用
2. **类型安全**: 考虑使用TypeScript的品牌类型来区分不同类型的ID
3. **缓存优化**: 在组件级别缓存学生ID，减少重复的异步调用
4. **错误监控**: 添加学生ID获取失败的监控和报警

## 影响范围

- ✅ 认证服务 (authService.ts)
- ✅ 进度服务 (progressService.ts)  
- ✅ 积分服务 (pointsService.ts)
- ✅ 错题服务 (errorBookService.ts)
- ✅ 练习页面 (exercise.tsx)
- ✅ 学习页面 (study.tsx)
- ✅ 错题页面 (wrong-exercises.tsx)
- ✅ 商店页面 (shop.tsx)
- ✅ 主页面 (index.tsx)

所有更改都已完成，代码现在使用统一的学生ID管理，提高了可读性和维护性。 