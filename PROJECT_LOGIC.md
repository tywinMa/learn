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
  - 展示学科列表或当前学科的单元列表。用户可选择学科和单元。单元的解锁状态可能需要前端结合从 `/api/answer-records/:userId/progress/batch` 或 `/api/answer-records/:userId/progress/:unitId` 获取的进度数据判断。
- **`app/study.tsx` ("学习"页)**:
  - 接收 `unitId` (通常格式为 `subjectCode-unitIdentifier`) 和 `subjectCode` 参数。
  - 调用后端 API (如 `GET /api/unit-content/:unitId`) 获取该单元的学习内容和媒体资源。
  - 每次访问时调用 `POST /api/answer-records/:userId/increment-study/:unitId` 增加学习次数统计
- **`app/practice.tsx` ("练习"页 - 通用单元练习)**:
  - 接收 `unitId` (格式为 `subjectCode-unitIdentifier`) 和 `subjectCode` 参数。
  - 调用后端 API (如 `GET /api/exercises/:subjectCode/:unitIdentifier`) 获取练习题，可传递 `userId` 和 `filterCompleted`。
  - 用户答题，提交答案到后端 (`POST /api/answer-records/:userId/submit`)。
  - 每次访问时调用 `POST /api/answer-records/:userId/increment-practice/:unitId` 增加练习次数统计
  - **知识点功能**: 在提交答案按钮下方显示相关知识点区域，用户可点击知识点标签查看详细内容弹窗
  - **新增答题数据收集**: 提交更丰富的答题数据，包括用户具体答案、会话ID、练习模式、设备信息等
- **`app/(tabs)/wrong-exercises.tsx` ("错题本"页)**:
  - 调用后端 API (`GET /api/answer-records/:userId/wrong-exercises`) 获取用户的错题列表（包含题目详情）。
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
- `server/src/models/`: Sequelize 模型定义 (如 `Subject`, `Unit`, `Exercise`, `UserPoints`, `UnitProgress`, `AnswerRecord`)。
- `server/src/routes/`: 各模块的路由定义文件。
- `server/src/controllers/`: 控制器逻辑 (如 `unitActionsController.js`)。
- `server/src/services/`: 业务逻辑服务层 (如 `answerRecordService.js`)。
- `server/src/middleware/`: 自定义中间件 (如认证，当前代码中部分被注释)。
- `server/src/utils/`: 工具函数和数据初始化脚本。

#### 3.2. Express 应用设置 (`server/src/index.js`)

- 中间件:
  - `cors`: 允许跨域请求 (配置为 `origin: '*'`)。同时通过 `app.options('*', cors())` 处理预检请求。
  - `express.json()`: 解析 JSON 请求体。
  - `morgan('dev')`: HTTP 请求日志。
  - `express.static(path.join(__dirname, '..', '..', 'dist'))`: 托管 `dist/` 目录下的静态文件 (用于前端构建产物)。
- 路由注册: 
  - `/api/users` 路径被 `userPointsRoutes` 使用
  - `/api/answer-records` 新的答题记录API路径
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
- **`UserPoints`**: 用户积分
- **`UnitProgress`**: 用户单元学习进度 (重要扩展)
  - 新增详细统计字段：`studyCount`, `practiceCount`, `correctCount`, `incorrectCount`
  - 新增时间追踪：`lastStudyTime`, `lastPracticeTime`, `totalTimeSpent`
  - 新增掌握程度评估：`masteryLevel`, `averageResponseTime`
- **`AnswerRecord`**: 综合答题记录模型（整合了原UserRecord和WrongExercise功能）
  - **基础信息**: userId, exerciseId, unitId, subject
  - **答题结果**: isCorrect, userAnswer, correctAnswer, score
  - **时间数据**: responseTime, startTime, submitTime
  - **尝试相关**: attemptNumber, totalAttempts, isFirstAttempt, previousResult
  - **上下文信息**: sessionId, practiceMode, deviceInfo
  - **学习行为**: hintsUsed, helpRequested, knowledgePointsViewed
  - **题目属性**: exerciseType, difficultyLevel
  - **用户状态**: confidence, studyTimeBeforeAnswer
  - **错题管理**: isWrongAnswer, wrongAnswerType, reviewCount, lastReviewTime, masteredAfterAttempts
  - **分析字段**: timeOfDay, weekday, learningStreak
  - **成绩与进度**: pointsEarned, experienceGained, masteryContribution

**模型关系**：
- `Subject` 1:n `Unit`: 一个学科有多个学习单元
- `Unit` 1:n `Exercise`: 一个单元有多个练习题
- `Unit` 1:n `UnitProgress`: 一个单元对应多个用户的学习进度
- `Exercise` 1:n `AnswerRecord`: 一个练习题有多个用户的详细答题记录
- `Subject` 1:n `AnswerRecord`: 一个学科有多个答题记录
- `Unit` 1:n `AnswerRecord`: 一个单元有多个答题记录

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

##### 3.4.3. 答题记录 (`/api/answer-records`) - 主要API

- **`POST /:userId/submit`**: 提交详细答题记录
  - 请求体包含丰富的答题数据：`exerciseId`, `unitId`, `isCorrect`, `userAnswer`, `responseTime`, `sessionId`, `practiceMode`, `hintsUsed`, `helpRequested`, `confidence`, `knowledgePointsViewed`, `deviceInfo`
  - 自动计算得分、积分奖励、尝试次数等
  - 同时更新UnitProgress和UserPoints
  - 返回详细的答题结果和掌握度信息

- **`GET /:userId/wrong-exercises`**: 获取用户错题列表
  - 支持按学科、单元、题型筛选
  - 只返回最新仍然错误的题目
  - 包含详细的答题历史信息

- **`DELETE /:userId/wrong-exercises/:exerciseId`**: 从错题本移除题目
  - 通过创建正确答题记录来表示掌握，而非直接删除

- **`GET /:userId/progress/:unitId`**: 获取用户单元进度
  - 优先查询UnitProgress表，回退到基于AnswerRecord计算
  - 返回详细的进度信息和掌握度数据

- **`POST /:userId/progress/batch`**: 批量获取用户进度
  - 支持一次性获取多个单元的进度数据
  - 优化网络请求，提高性能

- **`POST /:userId/increment-study/:unitId`**: 增加学习次数统计
- **`POST /:userId/increment-practice/:unitId`**: 增加练习次数统计

- **`GET /:userId/stats`**: 获取用户学习统计
- **`GET /:userId/pattern-analysis`**: 获取学习模式分析
- **`GET /:userId/history`**: 获取答题历史
- **`GET /:userId/detailed-analysis`**: 获取详细分析报告

##### 3.4.4. 其他API

- 用户积分、单元操作、单元内容等API保持不变

### 4. 开发与部署工具

#### 4.1. 开发脚本

- **`start-dev.sh`**: 启动开发环境
- **`reset-data.sh`**: 重置数据库数据

#### 4.2. 数据初始化

- **`server/src/utils/initData.js`**: 数据初始化主入口

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

#### 5.3. 单元学习与练习流程（更新）

1.  **用户在 "课程" 页选择一个单元**。
2.  **进入学习界面 (`app/study.tsx`)**:
    - 调用 `GET /api/unit-content/:unitId` 获取单元内容和媒体资源。
    - 调用 `POST /api/answer-records/:userId/increment-study/:unitId` 增加学习次数统计
3.  **进入练习界面 (`app/practice.tsx`)**:
    - 调用 `GET /api/exercises/:subjectCode/:unitIdentifier?userId=xxx` 获取练习题。
    - 调用 `POST /api/answer-records/:userId/increment-practice/:unitId` 增加练习次数统计
    - **生成会话ID**: 为本次练习会话生成唯一标识
4.  **用户答题并提交（增强）**:
    - **收集丰富数据**: 用户具体答案、响应时间、会话信息、设备信息等
    - **API提交**: 使用 `POST /api/answer-records/:userId/submit` 提交详细数据
5.  **后端处理提交（增强）**:
    - **AnswerRecord**: 创建包含所有维度的详细答题记录
    - **智能分析**: 自动计算得分、积分、掌握程度等
    - **关联更新**: 同时更新UnitProgress和UserPoints
    - **错题管理**: 智能管理错题状态，支持错题重做追踪

#### 5.4. 单元解锁流程

**根据当前代码分析：**
- 学科-单元-关卡结构中，同一个学科下有多个单元（如数学下有初级、中级、高级），每个单元下有多个关卡（具体的学习内容）。
- 单元类型由 `unitType` 字段确定，可以是 `"normal"` (普通学习单元) 或 `"exercise"` (练习单元)。
- 单元解锁有两种方式：
  1. **常规解锁**：完成前一个单元的全部关卡后解锁下一个单元。首个单元默认解锁。
  2. **跳级解锁**：大单元的第一个小单元（格式为x-y-1，其中y是大单元编号，1是小单元编号）可以直接点击进入，不受前面单元限制。在UI上以虚线边框特殊样式显示。当用户完成该单元练习题并获得至少1星后，将自动解锁该大单元前面的所有单元。
- 关卡解锁逻辑：单元内部的关卡是线性解锁的；必须完成当前关卡才能解锁下一个关卡。

#### 5.5. 错题本（增强）

1.  **用户进入 "错题本" 页 (`app/(tabs)/wrong-exercises.tsx`)**。
2.  **获取错题**: 调用 `GET /api/answer-records/:userId/wrong-exercises` 获取智能筛选的错题列表。
3.  **错题管理机制（增强）**：
    - **智能筛选**: 只显示最新仍然错误的题目
    - **多维度筛选**: 支持按学科、单元、题型筛选
    - **详细信息**: 包含答题历史、错误类型、尝试次数等
    - **掌握追踪**: 记录从错误到掌握的完整过程

### 6. 最近的主要更改

- **删除旧模型**: 完全移除了UserRecord和WrongExercise模型及相关代码
- **统一AnswerRecord**: 所有答题记录功能现在统一使用AnswerRecord模型
- **API整合**: 将所有相关API端点整合到 `/api/answer-records` 路径下
- **代码简化**: 移除了大量冗余代码和兼容性逻辑

#### 6.2. 数据收集增强

- **用户答案**: 记录具体的答题内容，支持选择题、填空题、匹配题
- **会话追踪**: 通过sessionId追踪完整的学习会话
- **时间分析**: 精确记录答题开始时间、提交时间、响应时间
- **行为数据**: 记录提示使用、帮助请求、知识点查看等行为
- **上下文信息**: 记录设备信息、练习模式、时间段等上下文
- **掌握度跟踪**: 详细跟踪从错误到掌握的学习过程

#### 6.3. 分析能力提升

- **学习模式分析**: 识别用户最佳学习时间段、习惯模式
- **错误类型分析**: 分类用户的错误类型（计算、概念、粗心等）
- **进步追踪**: 记录用户在每个知识点的进步轨迹
- **个性化洞察**: 基于丰富数据提供个性化学习建议

#### 6.4. API服务优化

- **统一端点**: 所有答题相关功能统一在 `/api/answer-records` 下
- **完整功能**: 包含答题提交、错题管理、进度计算、统计分析等完整功能
- **性能优化**: 批量API、智能缓存、优化查询等
- **向前兼容**: 保持前端API调用的一致性

### 7. 用户数据统计与掌握程度计算

#### 7.1 收集的数据指标（更新）

**基础答题数据**:
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

**详细数据**（AnswerRecord模型）:
3. **具体答题内容**
   - `userAnswer`: 用户的具体答案（JSON格式）
   - `correctAnswer`: 正确答案（便于分析错误模式）
   - `score`: 详细得分（支持部分正确）

4. **学习会话数据**
   - `sessionId`: 学习会话唯一标识
   - `practiceMode`: 练习模式（normal、review、wrong_redo、test、unlock_test）
   - `deviceInfo`: 设备和环境信息

5. **学习行为详情**
   - `hintsUsed`: 使用提示次数
   - `helpRequested`: 是否请求帮助
   - `knowledgePointsViewed`: 查看的知识点列表
   - `confidence`: 答题信心度（1-5）

6. **时间和环境分析**
   - `timeOfDay`: 答题时间段（0-23小时）
   - `weekday`: 星期几（0-6）
   - `learningStreak`: 连续学习天数

7. **错题深度分析**
   - `wrongAnswerType`: 错误类型（calculation、concept、careless、unknown）
   - `reviewCount`: 作为错题被复习次数
   - `masteredAfterAttempts`: 经过多少次尝试后掌握

#### 7.2 掌握程度计算方法（保持不变）

掌握程度（masteryLevel）计算公式：

```
masteryLevel = (correctRate * 0.6) + (practiceEffort * 0.2) + (studyEffort * 0.2)
```

#### 7.3 新增分析能力

**学习模式分析**:
- 最佳学习时间段识别
- 不同练习模式效果对比
- 学习会话模式分析

**错误模式分析**:
- 错误类型分布统计
- 常见错误知识点识别
- 错误到掌握的转化分析

**个性化洞察**:
- 基于历史数据的难度预测
- 个性化练习推荐
- 学习效果趋势分析

### 8. 性能优化与用户体验

#### 8.1 网络层优化

- **批量API**: 使用 `/progress/batch` 减少网络请求数量
- **超时控制**: 所有API请求都有合理的超时设置
- **重试机制**: 失败请求的自动重试策略
- **降级处理**: 网络异常时的优雅降级和默认数据返回

#### 8.2 数据库优化

- **智能同步**: 使用 `alter` 模式同步数据库模型，保留现有数据
- **索引优化**: AnswerRecord模型包含15+个优化索引，支持各种查询场景
- **关联查询**: 使用 Sequelize 的 include 减少查询次数
- **分页支持**: 大数据量查询支持分页和限制

#### 8.3 前端体验优化

- **状态管理**: 基于Context的全局状态管理
- **主题联动**: 学科切换与UI主题的实时同步
- **错误恢复**: 友好的错误提示和重试机制
- **数据缓存**: 合理的数据缓存策略，减少重复请求

### 9. 安全性与稳定性

#### 9.1 错误处理

- **全局错误捕获**: 统一的错误处理机制
- **参数验证**: API入参的完整性检查
- **优雅降级**: 确保关键功能在异常情况下的可用性

#### 9.2 数据一致性

- **事务处理**: 关键操作使用数据库事务保证一致性
- **双源验证**: 进度计算的多重验证机制
- **状态同步**: 前后端状态的实时同步

### 10. 未来扩展方向

#### 10.1 数据分析应用

基于AnswerRecord模型，可以开发：
- **学习效果预测模型**: 基于历史数据预测学习效果
- **个性化推荐系统**: 根据用户行为推荐合适的学习内容
- **智能难度调节**: 动态调整题目难度
- **学习路径优化**: 为用户推荐最优的学习路径

#### 10.2 功能扩展

- **社交学习**: 基于会话数据的协作学习功能
- **智能提醒**: 基于时间模式的个性化学习提醒
- **成就系统**: 基于详细数据的多维度成就体系
- **家长监控**: 基于丰富数据的学习报告系统

### 11. 最近修复记录

#### 11.1. API接口修复 (2024-12-23)

**问题描述**:
- `http://localhost:3000/api/exercises/math-1-1?userId=user1&filterCompleted=true` 接口返回500错误
- 错误信息：`SQLITE_ERROR: no such column: Exercise.order`

**根本原因**:
1. **Sequelize操作符使用错误**: 在 `exercises.js` 和 `answerRecords.js` 中使用了 `sequelize.Op` 而不是导入的 `Op`
2. **数据库字段不存在**: `Exercise` 模型中没有 `order` 字段，但代码中尝试按此字段排序

**修复措施**:
1. **修复Sequelize操作符**:
   - 在 `server/src/routes/exercises.js` 中将所有 `sequelize.Op` 替换为 `Op`
   - 在 `server/src/routes/answerRecords.js` 中添加 `const { Op } = require('sequelize')` 导入
   - 修复所有使用 `require('sequelize').Op` 的地方

2. **修复排序字段**:
   - 将 `Exercise.findAll()` 中的 `order: [['order', 'ASC']]` 改为 `order: [['id', 'ASC']]`
   - 确保按练习题ID排序，保持一致的顺序

**验证结果**:
- ✅ `GET /api/exercises/math-1-1?userId=user1&filterCompleted=true` 返回200状态码
- ✅ 成功返回12道练习题的完整数据
- ✅ 包含题型统计信息：choice(3题)、application(5题)、fill_blank(2题)、matching(2题)
- ✅ `GET /api/answer-records/user1/progress/math-1-1` 正常工作
- ✅ `GET /api/answer-records/user1/wrong-exercises` 正常工作

**技术要点**:
- 确保Sequelize操作符的正确导入和使用
- 数据库模型字段与查询代码的一致性检查
- API错误处理和调试日志的重要性