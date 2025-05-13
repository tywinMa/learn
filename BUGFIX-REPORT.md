# 数据重置失败问题修复报告

## 问题描述

在尝试使用 `./reset-data.sh` 脚本重置数据时，出现了以下错误：

```
SQLITE_CONSTRAINT: NOT NULL constraint failed: Units.subjectCode
```

这个错误表明在尝试插入数据到 `Units` 表时，因为 `subjectCode` 字段被设置为 NOT NULL，但是初始化脚本中没有提供该字段的值而导致失败。

## 问题原因

经过分析，此问题是由于之前的改进中为了支持多学科功能，对数据模型进行了以下增强：

1. 在 `Unit` 模型中添加了必填字段 `subjectCode`
2. 在 `Exercise` 模型中添加了必填字段 `subjectCode`
3. 在 `LearningContent` 模型中添加了必填字段 `subjectCode`

但是，初始化脚本 `initSubjectsAndUnits.js`、`addUnit1_1Exercises.js`、`addMissingExercises.js`、`addNewExerciseTypes.js` 和 `initLearningContent.js` 没有相应更新，没有为这些新增的必填字段提供值。

## 解决方案

我们对以下文件进行了修改：

### 1. server/src/utils/initSubjectsAndUnits.js

- 为每个 Unit 对象添加了 `subjectCode` 字段
- 使用相应的学科代码作为 `subjectCode` 的值

### 2. server/src/utils/addUnit1_1Exercises.js

- 为每个 Exercise 对象添加了 `subjectCode` 字段
- 添加了 `subjectCode` 变量从学科对象中获取
- 修改了 ID 格式，加入学科代码前缀（如 `math-1-1-1`）

### 3. server/src/utils/addMissingExercises.js

- 为每个 Exercise 对象添加了 `subjectCode` 字段
- 添加了 `mathSubjectCode` 变量获取学科代码
- 修改了 ID 格式，使用模板字符串添加学科代码前缀

### 4. server/src/utils/addNewExerciseTypes.js

- 为每个不同类型的练习题（匹配题、填空题、排序题、拖拽题、数学计算题）添加了 `subjectCode` 字段
- 添加了 `mathSubjectCode` 变量获取学科代码
- 修改了 ID 格式，使用学科代码前缀

### 5. server/src/utils/initLearningContent.js

- 为每个学习内容添加了 `subjectCode` 字段
- 添加了为英语和物理学科的 `subjectCode` 变量

## 验证结果

修改完成后，重新运行 `./reset-data.sh` 脚本成功完成数据重置，输出如下：

```
开始重置数据...
检查数据库连接...
数据库连接正常
运行数据初始化脚本...
开始初始化数据...
数据库表结构已重置
开始初始化学科和单元...
成功创建 4 条学科记录
成功创建 24 条单元记录
...
数据重置完成！
```

这表明所有必填字段现在都有了正确的值，数据重置过程可以正常完成。

## 经验教训

1. 在对数据模型添加必填字段时，需要同时更新所有相关的数据初始化脚本。
2. 在对现有系统进行增强时，应该全面审查受影响的组件，包括数据初始化和迁移脚本。
3. 添加钩子函数（如 `beforeCreate`）来处理特定的数据需求是好的实践，但仍然需要确保初始数据符合模型要求。 

# API调用undefined参数问题修复报告

## 问题描述

在练习模块中，发现前端调用API时会出现包含undefined的URL路径：

```
/api/exercises/math/undefined?userId=user1&filterCompleted=true
```

这种情况通常发生在从课程列表页进入练习页，但未能正确传递单元ID参数时。

## 问题原因

经过分析，该问题出现在`app/practice.tsx`文件中，主要原因是：

1. 从URL参数中获取lessonId时，如果参数不存在，会使用空字符串作为默认值
2. 缺少对API URL构建前的参数有效性检查
3. TypeScript类型处理不够严格，允许undefined值被用于构建URL

## 解决方案

我们对`app/practice.tsx`文件进行了以下修改：

1. 改进了参数获取逻辑，使用更健壮的检查来避免undefined值：
   ```typescript
   const lessonId = typeof params.id === 'string' && params.id.trim() ? params.id.trim() : '';
   const subjectCode = typeof params.subject === 'string' && params.subject.trim() ? 
                      params.subject.trim() : currentSubject?.code || 'math';
   ```

2. 添加了额外的参数验证，确保在构建API URL前检查必要参数：
   ```typescript
   if (!lessonId) {
     console.error("缺少必要参数：lessonId");
     throw new Error("无法加载练习题：缺少单元ID");
   }
   
   if (!subjectCode) {
     throw new Error("无法加载练习题：缺少学科代码");
   }
   ```

3. 确保UI显示正确的错误信息，指导用户如何解决问题

## 验证结果

修改完成后，前端在缺少必要参数时会显示适当的错误信息，而不是发送无效的API请求。这防止了包含undefined的API调用，改善了用户体验并减少了不必要的服务器错误。

## 经验教训

1. 前端应始终验证API调用前的所有必要参数
2. 使用严格的类型检查和默认值处理来防止undefined值传递
3. 提供清晰的错误消息，帮助用户和开发人员理解问题
4. 在路由参数处理时，应该考虑各种边缘情况，包括缺失或无效的参数 

# 学科代码与单元ID分离重构报告

## 概述

完成了对应用的重构，将API路径中的学科代码与单元ID进行分离，从混合格式如`/api/learning/math-1-1`改为分层格式`/api/learning/math/1-1`。这一改动使得API路径结构更加清晰、一致，并且符合RESTful API的设计原则。

## 已实施的变更

1. **前端应用修改**

   - 修改了`study.tsx`文件:
     - 添加了对混合格式单元ID的处理逻辑，能够分离学科代码和单元号
     - 更新了调用practice页面的参数，使用`id`而非`unitId`

   - 修改了`practice.tsx`文件:
     - 同时支持`id`和`unitId`参数，增强了向后兼容性
     - 添加了混合格式单元ID的处理逻辑
     - 在退出到学习页面时确保传递学科代码

2. **后端接口**

   后端已经支持新的API路径格式:
   - `/api/learning/:subject/:id` - 获取特定学科的特定单元学习内容
   - `/api/exercises/:subject/:unitId` - 获取特定学科的特定单元练习题

## 无需修改的部分

经过仔细检查，以下组件已经支持新的数据结构，不需要额外修改:

1. **数据库模型**
   
   现有的数据库模型(`Unit.js`, `Exercise.js`, `LearningContent.js`)已经包含了`subjectCode`字段和相应的钩子函数，能够确保ID的正确格式化:
   
   ```javascript
   hooks: {
     beforeCreate: (unit) => {
       // 确保ID包含学科代码前缀
       if (!unit.id.startsWith(unit.subjectCode)) {
         unit.id = `${unit.subjectCode}-${unit.id}`;
       }
     }
   }
   ```

2. **数据初始化脚本**
   
   之前已经为修复数据重置失败问题对这些脚本进行了更新，它们现在正确地处理学科代码和单元ID:
   - `initSubjectsAndUnits.js` 
   - `addUnit1_1Exercises.js`
   - `addMissingExercises.js`
   - `addNewExerciseTypes.js`
   - `initLearningContent.js`

3. **路由处理器**

   后端路由处理器已经同时支持新旧格式的API路径:
   ```javascript
   // 新API格式
   router.get('/:subject/:id', async (req, res) => {...});
   
   // 旧API格式(向后兼容)
   router.get('/:unitId', async (req, res) => {...});
   ```

## 建议的后续工作

1. **过渡计划**:
   - 在一段时间内同时保留新旧API路径格式以确保向后兼容
   - 逐步将所有前端组件迁移到新的格式
   - 最终可以移除旧的API路径支持

2. **API文档更新**:
   - 更新API文档，明确推荐使用新的路径格式
   - 标记旧API路径为"已弃用"(deprecated)

3. **测试覆盖**:
   - 为新的API路径格式添加更多的自动化测试
   - 确保关键路径的向后兼容性

## 结论

通过这次重构，我们成功地将学科代码与单元ID分离，改进了API路径的结构和可读性。这些更改已经在系统中实施并通过测试，同时保持了向后兼容性。系统现在更加模块化，对于未来添加新学科和扩展功能也更为灵活。 