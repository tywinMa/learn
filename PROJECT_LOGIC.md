## 前后端逻辑分析文档

### 1. 项目概览

本项目是一个基于 React Native 和 Expo 构建的跨平台移动学习应用，支持 iOS 和 Android。后端服务使用 Node.js 和 Express.js 构建，通过 RESTful API 与前端进行数据交互。数据库操作通过 Sequelize ORM 进行。

**主要技术栈:**

- **前端**: React Native, Expo, TypeScript, Expo Router
- **后端**: Node.js, Express.js, Sequelize, SQLite (或可配置的其他数据库)
- **状态管理 (前端)**: React Context API (例如 `SubjectProvider`)
- **数据持久化 (前端)**: `@react-native-async-storage/async-storage`

### 2. 前端架构

#### 2.1. 目录结构 (app/)

- `app/index.tsx`: 应用初始入口，重定向到欢迎页或主应用。
- `app/welcome.tsx`: 欢迎与引导页面。
- `app/_layout.tsx`: 全局根布局，处理启动逻辑、字体加载、初始路由判断、并包含全局上下文提供者 (如 `SubjectProvider`) 和主导航栈 (Stack Navigator)。
- `app/(tabs)/`: 包含底部标签导航的页面和布局。
  - `_layout.tsx`: 定义标签导航栏本身和各个标签页。
  - `index.tsx`: "课程" 标签页。
  - `practice.tsx`: "练习" 标签页 (练习中心，区别于 `app/practice.tsx` 的答题页)。
  - `settings.tsx`: "个人" 标签页。
  - `wrong-exercises.tsx`: "错题本" 标签页。
  - `shop.tsx`: "积分商城" 标签页。
- `app/study.tsx`: 学习内容展示页面。
- `app/practice.tsx`: 练习答题页面。
- `app/subject/[code].tsx`: 学科详情页面 (动态路由)。
- `app/hooks/`: 存放自定义 React Hooks。
  - `useSubject.tsx`: 管理当前选中的学科状态 (ID, 名称, 颜色, 图标等)，并将选择持久化到 AsyncStorage。学科颜色会影响应用主题。
  - `useColorScheme.ts`: 获取设备颜色方案 (深色/浅色)，并适配 web 平台。
  - `useThemeColor.ts`: 根据当前颜色方案和传入的颜色属性（light/dark）返回合适的颜色值。
- `app/constants/`: 存放应用常量 (如 `Colors.ts`, `apiConfig.ts`, AsyncStorage 键等)。
- `app/components/`: 存放可复用的小组件。
  - `Themed.tsx`: 提供基础的主题化 `Text` 和 `View` 组件。
  - `ThemedText.tsx`: 提供带额外类型样式的主题化文本组件。
  - `Exercise.tsx`: 练习题渲染和交互组件。
  - `SubjectModal.tsx`: 学科选择弹窗组件。
- `app/services/`: 存放与后端 API 交互的服务模块。
- `app/assets/`: 存放静态资源 (图片、字体等)。

#### 2.2. 导航 (Expo Router)

- **根导航 (`app/_layout.tsx`)**:
  - 使用 `Stack.Navigator` 作为主导航容器。
  - 管理 `welcome`, `(tabs)`, `study`, `practice`, `subject/[code]` 等屏幕。
  - 动态判断初始路由：首次打开导航到 `/welcome`；否则导航到 `/(tabs)`。
- **标签导航 (`app/(tabs)/_layout.tsx`)**:
  - 使用 `Tabs` Navigator 定义底部标签栏。
  - 包含 "课程", "练习", "错题本", "积分商城", "个人" 五个标签。
  - 自定义了标签图标和样式。活动标签颜色 `tabBarActiveTintColor` 来自 `Colors[colorScheme].tint`。
  - "练习" 标签具有特殊的居中突出样式，其背景色和图标颜色会根据是否 `focused` 而变化。

#### 2.3. 状态管理

- **学科状态 (`app/hooks/useSubject.tsx`)**:
  - 通过 `SubjectContext` 和 `SubjectProvider` 实现全局学科状态共享。
  - `currentSubject` 对象包含学科的 `id`, `name`, `code`, `description`, `color`, `iconName`。
  - 学科选择会持久化到 `AsyncStorage` (`CURRENT_SUBJECT_KEY`)。
  - `currentSubject.color` 用于动态改变应用的主题颜色（通过 `@react-navigation/native` 的 `ThemeProvider` 和自定义主题实现）。
- **本地持久化**: 使用 `@react-native-async-storage/async-storage` 存储如 "是否已看过欢迎页" (`WELCOME_SCREEN_KEY`) 和 "当前学科" 等信息。

#### 2.4. 主要页面逻辑简介

- **`app/welcome.tsx`**:
  - 展示欢迎信息和 "开始探索" 按钮。
  - 点击按钮后，在 `AsyncStorage` 中设置 `WELCOME_SCREEN_KEY` 为 `true`，并导航到 `/(tabs)`。
- **`app/(tabs)/index.tsx` ("课程"页)**:
  - 展示学科列表或当前学科的单元列表。用户可选择学科和单元。单元的解锁状态可能需要前端结合从 `/api/users/:userId/progress/batch` 或 `/api/users/:userId/progress/:unitId` 获取的进度数据判断。
- **`app/study.tsx` ("学习"页)**:
  - 接收 `unitId` (通常格式为 `subjectCode-unitIdentifier`) 和 `subjectCode` 参数。
  - 调用后端 API (如 `GET /api/unit-content/:unitId`) 获取该单元的学习内容和媒体资源。
- **`app/practice.tsx` ("练习"页 - 通用单元练习)**:
  - 接收 `unitId` (格式为 `subjectCode-unitIdentifier`) 和 `subjectCode` 参数。
  - 调用后端 API (如 `GET /api/exercises/:subjectCode/:unitIdentifier`) 获取练习题，可传递 `userId` 和 `filterCompleted`。
  - 用户答题，提交答案到后端 (`POST /api/users/:userId/submit`)。
- **`app/(tabs)/wrong-exercises.tsx` ("错题本"页)**:
  - 调用后端 API (`GET /api/users/:userId/wrong-exercises`) 获取用户的错题列表（包含题目详情）。
- **`app/(tabs)/shop.tsx` ("积分商城"页)**:
  - 调用后端 API (`GET /api/users/:userId/points`) 显示用户当前积分。
  - (推测) 调用后端 API 获取商品列表。
  - 用户兑换商品时，调用后端 API (`POST /api/users/:userId/points/deduct`) 扣除积分。
- **`app/(tabs)/settings.tsx` ("个人"页)**:
  - (推测) 显示用户信息，如总积分、学习统计等。

### 3. 后端架构

#### 3.1. 目录结构 (server/src/)

- `server/src/index.js`: Express 应用入口，配置服务器、中间件、路由。
- `server/src/config/database.js`: 数据库连接配置 (Sequelize 实例)。
- `server/src/models/`: Sequelize 模型定义 (如 `Subject`, `Unit`, `Exercise`, `UserRecord`, `UserPoints`, `UnitProgress`, `WrongExercise`)。
- `server/src/routes/`: 各模块的路由定义文件。
- `server/src/controllers/`: 控制器逻辑 (如 `unitActionsController.js`)。
- `server/src/middleware/`: 自定义中间件 (如认证，当前代码中部分被注释)。
- `server/src/utils/`: 工具函数和数据初始化脚本。

#### 3.2. Express 应用设置 (`server/src/index.js`)

- 中间件:
  - `cors`: 允许跨域请求 (配置为 `origin: '*'`)。同时通过 `app.options('*', cors())` 处理预检请求。
  - `express.json()`: 解析 JSON 请求体。
  - `morgan('dev')`: HTTP 请求日志。
  - `express.static(path.join(__dirname, '..', '..', 'dist'))`: 托管 `dist/` 目录下的静态文件 (用于前端构建产物)。
- 路由注册: `/api/users` 路径被 `userRecordsRoutes` 和 `userPointsRoutes` 共享，依赖各自文件内定义的具体子路径进行区分。
- 端口: 默认 3000，可配置。
- 数据库: 启动时通过 `testConnection()` 测试数据库连接。
- 错误处理: 全局错误处理中间件。
- 端口占用处理: 服务器启动时，若端口被占用，会尝试自动终止占用进程 (macOS/Linux)。

#### 3.3. 数据模型与关系

**主要模型**：

- **`Subject`**: 学科信息（如数学、物理）
- **`Unit`**: 学习单元，每个单元属于一个学科
  - 新增 `content` 字段：存储单元的详细学习内容文本（富文本格式）
  - 新增 `media` 字段：存储媒体资源数组（如视频、图片），JSON格式
- **`Exercise`**: 练习题，每个题目属于一个单元
- **`UserRecord`**: 用户答题记录
- **`UserPoints`**: 用户积分
- **`UnitProgress`**: 用户单元学习进度
- **`WrongExercise`**: 用户错题记录

**模型关系**：
- `Subject` 1:n `Unit`: 一个学科有多个学习单元
- `Unit` 1:n `Exercise`: 一个单元有多个练习题
- `Unit` 1:n `UnitProgress`: 一个单元对应多个用户的学习进度
- `Exercise` 1:n `UserRecord`: 一个练习题有多个用户的答题记录
- `Exercise` 1:n `WrongExercise`: 一个练习题可能是多个用户的错题

#### 3.4. API 端点详解

##### 3.4.1. 学科 (`/api/subjects` 或 `/subjects`)

- **`GET /`**: 获取所有学科列表。
  - 返回数据包含 `id`, `name`, `code`, `description`, `color` (基于学科代码硬编码映射), `iconName` (通过 `getIconNameByCode` 函数生成)。按 `order` 排序。
- **`GET /:code`**: 获取特定学科的详细信息 (通过学科代码)。包含 `iconName`。
- **`GET /:code/units`**: 获取特定学科下的所有单元。
  - 可选查询参数 `level` 筛选单元级别。
  - 返回的单元信息包含 `id`, `title`, `level`, `order`, `subject` (学科代码), `exercisesCount` (该单元练习题数量), `isChallenge` (根据标题或难度判断), `iconUrl` (通过 `getIconUrlByTitle`), `color` (优先用数据库值，否则按level/order生成), `secondaryColor` (基于主颜色生成), `code` (单元自身的code，如 `1-1`)。按 `level` 和 `order` 排序。
  - **注意**: 此API本身不直接处理单元的 `isCompleted` 或 `isLocked` 状态。这些状态的判断通常由客户端结合用户进度数据完成。
- **`GET /units/:unitId`**: 获取特定单元的详细信息 (通过单元主键 `unitId`)。增强逻辑类似 `/:code/units` 中的单个单元。

##### 3.4.2. 练习题 (`/api/exercises` 或 `/exercises`)

- **`GET /:subject/:unitId` (推荐)**: 获取指定学科 (`subject`) 下特定单元 (`unitId`，不含学科前缀) 的练习题。
  - 单元ID在后端会组合学科前缀进行查询 (如 `subject-unitId`)。
  - 查询参数: `userId` (用于标记已完成题目), `filterCompleted` ('true' 则过滤已完成的), `types` (逗号分隔的题型)。
  - 返回的练习题会根据用户完成情况附加 `completed` 标志。
  - 对特定题型 (`matching`, `application`, `math`) 的 `correctAnswer` 会做特殊处理（如未完成则隐藏，应用题始终隐藏）。
  - 返回数据包括 `allCompleted` (布尔值) 和 `typeStats` (题型统计)。
- **`GET /:unitId` (兼容API)**: 获取特定单元的练习题，`unitId` 参数应为已包含学科前缀的完整单元ID。功能类似推荐API。
- **`GET /`**: 获取所有包含练习题的单元ID列表 (不重复的 `unitId` 列表)。

##### 3.4.3. 用户记录与进度 (`/api/users`)

- **核心辅助函数 `getUnitProgressDetails(userId, unitId)` (内部使用)**:
  - 优先查询 `UnitProgress` 表获取单元进度 (`stars`, `completed`, `unlockNext` 基于 `stars === 3`)。
  - 若 `UnitProgress` 无记录或未完成，则根据 `UserRecord` 表中用户对该单元练习题的正确作答情况计算进度：
    - `completionRate` (已答题目数 / 总题目数)。
    - `stars` (基于 `completionRate`: >=0.8 -> 3星, >=0.6 -> 2星, >0 -> 1星)。
    - `unlockNext` (基于 `stars === 3`)。
    - `completed` (基于 `stars > 0`)。
  - 返回详细进度对象，包含来源 (`UnitProgressTable` 或 `UserRecordCalculation`)。

- **`POST /:userId/submit`** (由 `userRecords.js` 处理): 提交用户答题结果。
  - 请求体: `exerciseId`, `unitId`, `isCorrect`。
  - 记录到 `UserRecord` 表 (查找或创建，更新则增加 `attemptCount`)。
  - 如果答错 (`!isCorrect`): 记录到 `WrongExercise` 表 (查找或创建，更新则增加 `attempts`)。
  - 如果答对 (`isCorrect`):
    - 从 `WrongExercise` 表移除该题。
    - **首次答对此题时** (新记录且答对，或从错误更新为正确)，用户增加1积分 (更新 `UserPoints` 表)。
- **`GET /:userId/records`** (由 `userRecords.js` 处理): 获取用户所有答题记录，包含练习题详情 (`Exercise` model)，按 `updatedAt` 降序。
- **`GET /:userId/progress/:unitId`** (由 `userRecords.js` 处理): 获取用户在特定单元的详细进度。
  - 内部调用 `getUnitProgressDetails(userId, unitId)`。
- **`POST /:userId/progress/batch`** (由 `userRecords.js` 处理): 批量获取多个单元的进度。
  - 请求体: `{ unitIds: string[] }`。
  - 对每个 `unitId` 调用 `getUnitProgressDetails`。最大批量大小为100。
- **`GET /:userId/wrong-exercises`** (由 `userRecords.js` 处理): 获取用户的错题列表。
  - 返回包含 `exerciseData` (题目详情), `unitId`, `attempts`, `timestamp` 的数组。
- **`DELETE /:userId/wrong-exercises/:exerciseId`** (由 `userRecords.js` 处理): 从错题本中删除指定题目。
- **`GET /:userId/subject/:subject/progress`** (由 `userRecords.js` 处理): 获取用户在特定学科的所有单元进度。
  - 基于 `UserRecord` 计算每个单元的 `totalExercises`, `correctExercises`, `completedExercises`。
  - 星星数根据**正确率**计算 (`>=90%` -> 3星, `>=70%` -> 2星, `>=50%` -> 1星)。**此星星计算逻辑与 `getUnitProgressDetails` 不同，且不使用 `UnitProgress` 表。**
- **`POST /:userId/complete-unit/:unitId`** (由 `userRecords.js` 处理): 标记用户完成单元。
  - 在 `UnitProgress` 表中查找或创建记录，标记为 `completed: true`。
  - 可在请求体中传入 `stars`，默认为3星。
  - 根据获得的星级奖励用户积分 (1星:5分, 2星:10分, 3星:15分)，更新 `UserPoints` 表。

##### 3.4.4. 用户积分 (`/api/users`)

- **`GET /:userId/points`** (由 `userPoints.js` 处理): 获取用户当前的总积分。若无记录则创建并返回0分。
- **`POST /:userId/points/add`** (由 `userPoints.js` 处理): 增加用户积分。
  - 请求体: `points` (要增加的正整数)。
- **`POST /:userId/points/deduct`** (由 `userPoints.js` 处理): 扣除用户积分。
  - 请求体: `points` (要扣除的正整数)。检查积分是否足够。

##### 3.4.5. 单元操作 (`/api/units`)

- **`POST /batch-unlock`** (控制器: `unitActionsController.batchUnlockUnits`): 批量解锁单元。
  - 请求体: `unitIds` (数组), `userId`。
  - 在 `UnitProgress` 表中将指定单元标记为 `completed: true`, `stars: 0`。

##### 3.4.6. 单元内容 (`/api/unit-content`)

- **`GET /:unitId`**: 获取特定单元的内容，`unitId` 参数应为已包含学科前缀的完整单元ID。
  - 返回单元的 `id`, `title`, `content` (富文本内容), `media` (媒体资源数组) 和 `subject`。
- **`GET /:subject/:id`**: 获取指定学科 (`subject`) 下特定单元 (`id`) 的内容。
  - 单元ID在后端会组合学科前缀进行查询 (如 `subject-id`)。
  - 返回与上面接口相同格式的数据。
- **`PUT /:unitId`**: 更新特定单元的内容。
  - 请求体: `content` (富文本内容), `media` (媒体资源数组)。
  - 仅更新提供的字段，不改变其他字段。

### 4. 开发与部署工具

#### 4.1. 开发脚本

- **`start-dev.sh`**: 启动开发环境
  - 同时启动前端和后端服务
  - 自动处理端口占用问题
  - 添加了信号处理程序，使得在按下Ctrl+C/Cmd+C时能够优雅地关闭所有相关服务
  - 清理函数会负责终止所有启动的进程和释放端口

- **`reset-data.sh`**: 重置数据库数据
  - 调用数据初始化脚本重建数据库表并填充初始数据

#### 4.2. 数据初始化

- **`server/src/utils/initData.js`**: 数据初始化主入口
  - 调用各个专门的初始化脚本
  - 包括学科、单元、练习题和单元内容的初始化

- **`server/src/utils/initUnitContent.js`**: 初始化单元内容
  - 直接使用Unit模型存储内容和媒体资源
  - 替代了旧的学习内容初始化方式

- **`server/src/utils/initGeometryUnitContent.js`**: 初始化几何单元内容
  - 专门用于几何单元的内容初始化
  - 同样直接使用Unit模型

### 5. 核心业务流程串联

#### 5.1. 用户首次启动与导航

1.  **App 启动 (`app/_layout.tsx`)**:
    - 加载字体。
    - 检查 `AsyncStorage` 中的 `WELCOME_SCREEN_KEY`。
    - 如果未设置或为 `false` -> `initialRoute = "/welcome"`。
    - 如果为 `true` -> `initialRoute = "/(tabs)"`。
2.  **导航**: `router.replace(initialRoute)`。
3.  **欢迎页 (`app/welcome.tsx`)**:
    - 用户点击 "开始探索"。
    - 设置 `WELCOME_SCREEN_KEY` 为 `true`。
    - 导航到 `/(tabs)`。

#### 5.2. 学科选择与主题切换

1.  **用户在 "课程" 页 (或学科选择界面) 选择一个学科**。
2.  **前端 (`useSubject` hook)**:
    - 调用 `setCurrentSubject(selectedSubject)` 更新 React Context 中的 `currentSubject`。
    - 调用 `saveCurrentSubject(selectedSubject)` 将学科信息 (包括 `code`, `name`, `color` 等) 保存到 `AsyncStorage`。
3.  **主题更新 (`app/_layout.tsx -> RootLayoutNav`)**:
    - `RootLayoutNav` 组件消费 `useSubject` 提供的 `currentSubject`。
    - `customTheme` 中的 `primary` 颜色会使用 `currentSubject.color`。
    - `ThemeProvider` 应用新的主题，UI 中使用 `primary` 色的部分会更新。

#### 5.3. 单元学习与练习流程

1.  **用户在 "课程" 页选择一个单元**。单元是否可访问（解锁状态）由前端根据从 `/api/users/:userId/progress/batch` 或 `/api/users/:userId/progress/:unitId` 获取的进度数据判断。
2.  **进入学习界面 (`app/study.tsx`)**:
    - 调用 `GET /api/unit-content/:unitId` 获取单元内容和媒体资源。
3.  **进入练习界面 (`app/practice.tsx`)**:
    - 调用 `GET /api/exercises/:subjectCode/:unitIdentifier?userId=xxx` 获取练习题。
4.  **用户答题并提交**:
    - 前端将答案 `POST` 到 `/api/users/:userId/submit`。
5.  **后端处理提交**:
    - 更新 `UserRecord`, `WrongExercise`, 并根据是否首次答对更新 `UserPoints`。
6.  **(可选) 完成单元**:
    - 当用户完成一个单元的所有学习/练习后，前端或后端逻辑（例如，在所有练习都完成后）可能会调用 `POST /api/users/:userId/complete-unit/:unitId` 来正式标记单元完成并获得星级和积分奖励。

#### 5.4. 单元解锁流程

**根据当前代码分析：**
- 学科-单元-关卡结构中，同一个学科下有多个单元（如数学下有初级、中级、高级），每个单元下有多个关卡（具体的学习内容）。
- 单元解锁有两种方式：
  1. **常规解锁**：完成前一个单元的全部关卡后解锁下一个单元。首个单元默认解锁。
  2. **跳级解锁**：大单元的第一个小单元（格式为x-y-1，其中y是大单元编号，1是小单元编号）可以直接点击进入，不受前面单元限制。在UI上以虚线边框特殊样式显示。当用户完成该单元练习题并获得至少1星后，将自动解锁该大单元前面的所有单元。
- 关卡解锁逻辑：单元内部的关卡是线性解锁的；必须完成当前关卡才能解锁下一个关卡。

#### 5.5. 错题本

1.  **用户进入 "错题本" 页 (`app/(tabs)/wrong-exercises.tsx`)**。
2.  调用 `GET /api/users/:userId/wrong-exercises` 获取错题列表。
3.  用户选择错题进行重新练习。

### 6. 最近的主要更改

#### 6.1. 数据模型优化 (2023-11)

- **Unit模型集成学习内容**:
  - 添加 `content` 字段存储单元学习内容（富文本格式）
  - 添加 `media` 字段存储媒体资源数组（JSON格式）
  - 移除了独立的 `LearningContent` 模型，简化了数据结构

- **API端点更新**:
  - 移除了 `/api/learning` API路径
  - 新增 `/api/unit-content` API路径，直接从Unit模型获取内容
  - 更新了前端代码以适应新的API和数据结构

- **数据初始化脚本更新**:
  - 添加了专门的单元内容初始化脚本 `initUnitContent.js` 和 `initGeometryUnitContent.js`
  - 移除了旧的学习内容初始化和迁移脚本

#### 6.2. 开发环境改进

- **启动脚本优化**:
  - 添加了信号处理程序，使Ctrl+C/Cmd+C能够优雅地关闭所有服务
  - 实现了清理函数，确保所有进程正确终止
  - 改进了端口检测和进程管理逻辑

---
