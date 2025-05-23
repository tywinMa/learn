## 前后端逻辑分析文档

### 1. 项目概览

本项目是一个基于 React Native 和 Expo 构建的跨平台移动学习应用，支持 iOS 和 Android。后端服务使用 Node.js 和 Express.js 构建，通过 RESTful API 与前端进行数据交互。数据库操作通过 Sequelize ORM 进行。

**主要技术栈:**

- **前端**: React Native, Expo, TypeScript, Expo Router (文件系统路由)
- **后端**: Node.js, Express.js, Sequelize, SQLite
- **状态管理 (前端)**: React Context API (例如 `SubjectProvider`)
- **数据持久化 (前端)**: `@react-native-async-storage/async-storage`
- **网络请求**: Fetch API，支持超时、重试和降级策略
- **主题系统**: 基于学科颜色的动态主题切换

### 2. 前端架构

#### 2.1. 目录结构 (app/)

- `app/index.tsx`: 应用初始入口，重定向到欢迎页或主应用。
- `app/welcome.tsx`: 欢迎与引导页面。
- `app/_layout.tsx`: 全局根布局，处理启动逻辑、字体加载、初始路由判断、并包含全局上下文提供者 (如 `SubjectProvider`) 和主导航栈 (Stack Navigator)。支持动态主题切换。
- `app/(tabs)/`: 包含底部标签导航的页面和布局。
  - `_layout.tsx`: 定义标签导航栏本身和各个标签页，包含特殊的居中练习按钮样式。
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
  - `KnowledgePointModal.tsx`: 知识点详情弹窗组件，支持文本、图片、视频等多种知识点内容类型。
- `app/services/`: 存放与后端 API 交互的服务模块。
  - `progressService.ts`: 进度管理服务，包含批量API优化、超时重试机制
  - `pointsService.ts`: 积分系统服务
  - `errorBookService.ts`: 错题本管理服务
- `app/assets/`: 存放静态资源 (图片、字体等)。

#### 2.2. 导航 (Expo Router)

- **根导航 (`app/_layout.tsx`)**:
  - 使用 `Stack.Navigator` 作为主导航容器。
  - 管理 `welcome`, `(tabs)`, `study`, `practice`, `subject/[code]` 等屏幕。
  - 动态判断初始路由：首次打开导航到 `/welcome`；否则导航到 `/(tabs)`。
  - 集成动态主题系统：根据学科颜色实时更新应用主题
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
  - 默认学科设置：数学 (math)，颜色 #58CC02，图标 math-compass
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
  - 每次访问时调用 `POST /api/users/:userId/increment-study/:unitId` 增加学习次数统计
- **`app/practice.tsx` ("练习"页 - 通用单元练习)**:
  - 接收 `unitId` (格式为 `subjectCode-unitIdentifier`) 和 `subjectCode` 参数。
  - 调用后端 API (如 `GET /api/exercises/:subjectCode/:unitIdentifier`) 获取练习题，可传递 `userId` 和 `filterCompleted`。
  - 用户答题，提交答案到后端 (`POST /api/users/:userId/submit`)。
  - 每次访问时调用 `POST /api/users/:userId/increment-practice/:unitId` 增加练习次数统计
  - **知识点功能**: 在提交答案按钮下方显示相关知识点区域，用户可点击知识点标签查看详细内容弹窗
- **`app/(tabs)/wrong-exercises.tsx` ("错题本"页)**:
  - 调用后端 API (`GET /api/users/:userId/wrong-exercises`) 获取用户的错题列表（包含题目详情）。
- **`app/(tabs)/shop.tsx` ("积分商城"页)**:
  - 调用后端 API (`GET /api/users/:userId/points`) 显示用户当前积分。
  - (推测) 调用后端 API 获取商品列表。
  - 用户兑换商品时，调用后端 API (`POST /api/users/:userId/points/deduct`) 扣除积分。
- **`app/(tabs)/settings.tsx` ("个人"页)**:
  - (推测) 显示用户信息，如总积分、学习统计等。

#### 2.5. API 服务层优化

**网络请求优化机制**:
- **超时控制**: 所有API请求都有超时机制 (默认5-20秒)
- **重试策略**: 失败请求自动重试 (最多2次)
- **降级处理**: API失败时返回默认数据，保证UI不崩溃
- **批量优化**: 使用 `/progress/batch` API 减少网络请求数量

**用户体验优化**:
- **临时用户ID**: 使用固定的 `user1` 作为临时用户标识
- **进度缓存**: 前端缓存进度数据，减少重复请求
- **错误恢复**: 网络错误时显示友好提示并提供重试选项

### 3. 后端架构

#### 3.1. 目录结构 (server/src/)

- `server/src/index.js`: Express 应用入口，配置服务器、中间件、路由。包含智能端口冲突处理。
- `server/src/config/database.js`: 数据库连接配置 (Sequelize 实例)，使用 SQLite 数据库。
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
- **智能端口处理**: 服务器启动时，若端口被占用，会尝试自动终止占用进程 (macOS/Linux)。

#### 3.3. 数据模型与关系

**主要模型**：

- **`Subject`**: 学科信息（如数学、物理）
  - 新增 `color` 字段：学科主题颜色，默认 "#5EC0DE"
  - 新增 `icon` 字段：学科图标标识
  - 新增 `order` 字段：显示顺序
- **`Unit`**: 学习单元，每个单元属于一个学科
  - 新增 `content` 字段：存储单元的详细学习内容文本（富文本格式）
  - 新增 `media` 字段：存储媒体资源数组（如视频、图片），JSON格式
  - 新增 `isMajor` 字段 (Boolean)：用于区分大单元 (true) 和小单元 (false)。
  - 新增 `color`, `secondaryColor` 字段：单元主题色和次要颜色
  - 新增 `unitType` 字段：单元类型 ('normal' 或 'exercise')
  - 新增 `position` 字段：特殊位置设置 ('default', 'left', 'right')
- **`Exercise`**: 练习题，每个题目属于一个单元
  - 新增 `knowledgePoints` 字段 (JSON)：存储相关知识点数据，格式为 `[{title: '知识点名称', content: '详细内容', type: 'text|image|video', mediaUrl?: 'string'}]`
- **`UserRecord`**: 用户答题记录
- **`UserPoints`**: 用户积分
- **`UnitProgress`**: 用户单元学习进度 (重要扩展)
  - 新增详细统计字段：`studyCount`, `practiceCount`, `correctCount`, `incorrectCount`
  - 新增时间追踪：`lastStudyTime`, `lastPracticeTime`, `totalTimeSpent`
  - 新增掌握程度评估：`masteryLevel`, `averageResponseTime`
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
  - 学科颜色映射：math="#58CC02", physics="#5EC0DE", chemistry="#FF9600", biology="#9069CD", history="#DD6154"
- **`GET /:code`**: 获取特定学科的详细信息 (通过学科代码)。包含 `iconName`。
- **`GET /:code/units`**: 获取特定学科下的所有单元。
  - 可选查询参数 `level` 筛选单元级别。
  - 返回的单元信息包含 `id`, `title`, `level`, `order`, `subject` (学科代码), `exercisesCount` (该单元练习题数量), `unitType` (单元类型，值为"normal"或"exercise"), `position` (位置信息), `iconUrl` (通过 `getIconUrlByTitle`), `color` (优先用数据库值，否则按level/order生成), `secondaryColor` (基于主颜色生成), `code` (单元自身的code，如 `1-1`)。按 `level` 和 `order` 排序。
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
  - **双源进度计算策略**：优先查询 `UnitProgress` 表获取单元进度 (`stars`, `completed`, `unlockNext` 基于 `stars === 3`)。
  - 若 `UnitProgress` 无记录或未完成，则根据 `UserRecord` 表中用户对该单元练习题的正确作答情况计算进度：
    - `completionRate` (已答题目数 / 总题目数)。
    - `stars` (基于 `completionRate`: >=0.8 -> 3星, >=0.6 -> 2星, >0 -> 1星)。
    - `unlockNext` (基于 `stars === 3`)。
    - `completed` (基于 `stars > 0`)。
  - 返回详细进度对象，包含来源 (`UnitProgressTable` 或 `UserRecordCalculation`)。
  - **掌握程度计算**：`masteryLevel = (correctRate * 0.6) + (practiceEffort * 0.2) + (studyEffort * 0.2)`

- **`POST /:userId/submit`** (由 `userRecords.js` 处理): 提交用户答题结果。
  - 请求体: `exerciseId`, `unitId`, `isCorrect`, `responseTime`。
  - 记录到 `UserRecord` 表 (查找或创建，更新则增加 `attemptCount`)。
  - 如果答错 (`!isCorrect`): 记录到 `WrongExercise` 表 (查找或创建，更新则增加 `attempts`)。
  - 如果答对 (`isCorrect`):
    - 从 `WrongExercise` 表移除该题。
    - **首次答对此题时** (新记录且答对，或从错误更新为正确)，用户增加1积分 (更新 `UserPoints` 表)。
  - 更新 `UnitProgress` 表的统计数据 (答题次数、正确次数等)
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
- **`POST /:userId/increment-study/:unitId`** (由 `userRecords.js` 处理): 增加用户学习单元的次数。
  - 在 `UnitProgress` 表中查找或创建记录，增加 `studyCount` 字段值。
  - 当用户访问学习页面 (`/study`) 时调用此API。
  - 更新 `lastStudyTime` 和重新计算 `masteryLevel`
  - 返回更新后的学习次数。
- **`POST /:userId/increment-practice/:unitId`** (由 `userRecords.js` 处理): 增加用户练习单元的次数。
  - 在 `UnitProgress` 表中查找或创建记录，增加 `practiceCount` 字段值。
  - 当用户访问练习页面 (`/practice`) 时调用此API。
  - 更新 `lastPracticeTime` 和重新计算 `masteryLevel`
  - 返回更新后的练习次数。

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
    - 调用 `POST /api/users/:userId/increment-study/:unitId` 增加学习次数统计
3.  **进入练习界面 (`app/practice.tsx`)**:
    - 调用 `GET /api/exercises/:subjectCode/:unitIdentifier?userId=xxx` 获取练习题。
    - 调用 `POST /api/users/:userId/increment-practice/:unitId` 增加练习次数统计
4.  **用户答题并提交**:
    - 前端将答案 `POST` 到 `/api/users/:userId/submit`。
5.  **后端处理提交**:
    - 更新 `UserRecord`, `WrongExercise`, 并根据是否首次答对更新 `UserPoints`。
    - 更新 `UnitProgress` 表中的统计数据和掌握程度
6.  **(可选) 完成单元**:
    - 当用户完成一个单元的所有学习/练习后，前端或后端逻辑（例如，在所有练习都完成后）可能会调用 `POST /api/users/:userId/complete-unit/:unitId` 来正式标记单元完成并获得星级和积分奖励。

#### 5.4. 单元解锁流程

**根据当前代码分析：**
- 学科-单元-关卡结构中，同一个学科下有多个单元（如数学下有初级、中级、高级），每个单元下有多个关卡（具体的学习内容）。
- 单元类型由 `unitType` 字段确定，可以是 `"normal"` (普通学习单元) 或 `"exercise"` (练习单元)。
- 单元解锁有两种方式：
  1. **常规解锁**：完成前一个单元的全部关卡后解锁下一个单元。首个单元默认解锁。
  2. **跳级解锁**：大单元的第一个小单元（格式为x-y-1，其中y是大单元编号，1是小单元编号）可以直接点击进入，不受前面单元限制。在UI上以虚线边框特殊样式显示。当用户完成该单元练习题并获得至少1星后，将自动解锁该大单元前面的所有单元。
- 关卡解锁逻辑：单元内部的关卡是线性解锁的；必须完成当前关卡才能解锁下一个关卡。

#### 5.5. 错题本

1.  **用户进入 "错题本" 页 (`app/(tabs)/wrong-exercises.tsx`)**。
2.  调用 `GET /api/users/:userId/wrong-exercises` 获取错题列表。
3.  用户选择错题进行重新练习。
4.  **错题管理机制**：
    - 答错时自动记录到 `WrongExercise` 表
    - 答对时自动从错题本移除
    - 支持按学科分类查看错题

### 6. 最近的主要更改

#### 6.1. 数据模型优化 (2023-11)

- **Unit模型集成学习内容**:
  - 添加 `content` 字段存储单元学习内容（富文本格式）
  - 添加 `media` 字段存储媒体资源数组（JSON格式）
  - 新增 `isMajor` 字段 (Boolean)：用于区分大单元 (true) 和小单元 (false)。
  - 移除了独立的 `LearningContent` 模型，简化了数据结构

- **UnitProgress模型扩展**:
  - 添加详细的学习行为统计字段
  - 添加掌握程度评估算法
  - 支持实时更新学习和练习统计

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

#### 6.3. 前端架构优化

- **主题系统完善**:
  - 实现基于学科颜色的动态主题切换
  - 支持深色/浅色模式适配
  - 统一的颜色管理系统

- **网络层优化**:
  - 添加超时和重试机制
  - 实现优雅的错误降级策略
  - 批量API调用优化

#### 6.4. 知识点功能新增 (2024-05)

- **架构重构与优化**:
  - 移除 `Exercise` 组件内的提交按钮功能（已废弃）
  - 将知识点功能从 `ResultFeedback` 组件中独立出来，创建独立的 `KnowledgePointsSection` 组件
  - 知识点组件始终显示在题目下方，不受答题状态控制，位于 `Exercise` 和 `ResultFeedback` 组件之间
  - 保持了原有的UI设计和交互体验，但实现了更好的组件分离

- **Exercise组件简化**:
  - 移除了 `pendingSubmission` 状态和相关逻辑
  - 移除了 `renderSubmitButton` 和 `renderKnowledgePoints` 函数
  - 移除了知识点弹窗状态管理
  - 简化为纯粹的题目展示和交互组件

- **知识点组件独立化**:
  - 新增独立的 `KnowledgePointsSection` 组件，完全独立于 `ResultFeedback` 组件
  - 组件自管理知识点弹窗状态和交互逻辑
  - 知识点始终显示在题目下方，不受答题状态控制
  - 维持了知识点的原有UI设计风格和功能完整性
  - 知识点区域位置：Exercise组件下方，ResultFeedback组件上方

- **Exercise模型扩展**:
  - 添加 `knowledgePoints` 字段 (JSON)：存储相关知识点数据
  - 支持文本、图片、视频等多种知识点内容类型
  - 格式：`[{title: '知识点名称', content: '详细内容', type: 'text|image|video', mediaUrl?: 'string'}]`

- **前端组件新增**:
  - 新增 `KnowledgePointModal.tsx`：知识点详情弹窗组件
  - 支持富文本内容渲染，使用 `react-native-render-html`
  - 支持图片和视频内容展示（视频功能待开发）

- **数据库同步**:
  - 创建 `sync-database.js` 脚本用于数据库模型同步
  - 创建 `add-sample-knowledge-points.js` 脚本添加示例知识点数据
  - 为现有练习题随机分配1-2个知识点

- **开发工具集成**:
  - 更新 `reset-data.sh` 脚本，集成知识点功能
  - 数据重置流程包含：基础数据 → 数据库同步 → 知识点数据生成
  - 提供完整的开发环境重置解决方案，支持一键重置所有数据和功能
  - **进程清理优化**：启动和重置脚本现在包含完整的nodemon进程清理功能，确保服务关闭时不留残留进程

### 7. 用户数据统计与掌握程度计算

#### 7.1 收集的数据指标

为了评估用户对某个单元的掌握程度，系统收集以下数据指标：

1. **学习行为数据**
   - `studyCount`: 用户学习该单元的次数（每次访问学习页面时增加）
   - `lastStudyTime`: 用户最后一次学习该单元的时间
   - `practiceCount`: 用户练习该单元的次数（每次访问练习页面时增加）
   - `lastPracticeTime`: 用户最后一次练习该单元的时间
   - `totalTimeSpent`: 用户在该单元花费的总时间（秒）

2. **答题表现数据**
   - `correctCount`: 用户在该单元正确回答的题目数量
   - `incorrectCount`: 用户在该单元错误回答的题目数量
   - `totalAnswerCount`: 用户在该单元总共回答的题目数量（包括重复的题目）
   - `averageResponseTime`: 用户回答问题的平均反应时间（秒）

3. **进度评估数据**
   - `completed`: 该单元是否已完成
   - `stars`: 获得的星级（0-3颗星）
   - `completedAt`: 单元完成的时间
   - `masteryLevel`: 掌握程度（0-1之间的浮点数）

#### 7.2 掌握程度计算方法

掌握程度（masteryLevel）是衡量用户对单元内容理解和掌握情况的关键指标，取值范围为0-1，计算公式如下：

```
masteryLevel = (correctRate * 0.6) + (practiceEffort * 0.2) + (studyEffort * 0.2)
```

其中：

1. **correctRate（正确率）- 权重0.6**
   - 计算方法：`correctCount / (correctCount + incorrectCount)`
   - 正确率是衡量掌握程度的最主要因素

2. **practiceEffort（练习努力程度）- 权重0.2**
   - 计算方法：`Math.min(1, practiceCount / 10)`
   - 反映用户练习的投入程度，最多记录10次练习（对应满分1分）

3. **studyEffort（学习努力程度）- 权重0.2**
   - 计算方法：`Math.min(1, studyCount / 5)`
   - 反映用户学习内容的投入程度，最多记录5次学习（对应满分1分）

掌握程度自动更新的三个时机：
1. 用户提交答案时
2. 用户访问学习页面时
3. 用户访问练习页面时

#### 7.3 星级计算方法

星级（stars）是对用户掌握程度的简化表示，用于前端UI展示，取值为0-3：

1. 基于完成率（completionRate）计算：
   - 完成率 >= 80%：3星
   - 完成率 >= 60%：2星
   - 完成率 > 0%：1星
   - 完成率 = 0%：0星

2. 或基于正确率（正确题目百分比）计算：
   - 正确率 >= 90%：3星
   - 正确率 >= 70%：2星
   - 正确率 >= 50%：1星
   - 正确率 < 50%：0星

不同的API端点可能使用不同的星级计算逻辑，具体取决于上下文需求。

#### 7.4 进度数据应用场景

1. **个性化学习路径**：根据用户掌握程度推荐后续学习内容
2. **学习状态可视化**：在UI中展示用户学习进度和掌握情况
3. **学习成果评估**：通过掌握程度和星级评估用户的学习效果
4. **系统适应性**：根据用户表现调整题目难度和推荐内容
5. **学习报告生成**：基于收集的数据生成学习报告和分析图表

### 8. 性能优化与用户体验

#### 8.1 网络层优化

- **批量API**: 使用 `/progress/batch` 减少网络请求数量
- **超时控制**: 所有API请求都有合理的超时设置
- **重试机制**: 失败请求的自动重试策略
- **降级处理**: 网络异常时的优雅降级和默认数据返回

#### 8.2 数据库优化

- **智能同步**: 使用 `alter` 模式同步数据库模型，保留现有数据
- **索引优化**: 在用户ID和单元ID组合上建立唯一索引
- **关联查询**: 使用 Sequelize 的 include 减少查询次数

#### 8.3 前端体验优化

- **状态管理**: 基于Context的全局状态管理
- **主题联动**: 学科切换与UI主题的实时同步
- **错误恢复**: 友好的错误提示和重试机制

### 9. 安全性与稳定性

#### 9.1 错误处理

- **全局错误捕获**: 统一的错误处理机制
- **参数验证**: API入参的完整性检查
- **优雅降级**: 确保关键功能在异常情况下的可用性

#### 9.2 数据一致性

- **事务处理**: 关键操作使用数据库事务保证一致性
- **双源验证**: 进度计算的多重验证机制
- **状态同步**: 前后端状态的实时同步