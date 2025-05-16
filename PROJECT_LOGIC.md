## 前后端逻辑分析文档

### 1. 项目概览

本项目是一个基于 React Native 和 Expo 构建的跨平台移动学习应用，支持 iOS 和 Android。后端服务使用 Node.js 和 Express.js 构建，通过 RESTful API 与前端进行数据交互。数据库操作可能通过 Sequelize ORM 进行。

**主要技术栈:**

- **前端**: React Native, Expo, TypeScript, Expo Router
- **后端**: Node.js, Express.js, Sequelize (推测), SQLite (或可配置的其他数据库)
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
- `app/unlock-test.tsx`: 单元解锁测试页面。
- `app/subject/[code].tsx`: 学科详情页面 (动态路由)。
- `app/hooks/`: 存放自定义 React Hooks。
  - `useSubject.tsx`: 管理当前选中的学科状态 (ID, 名称, 颜色, 图标等)，并将选择持久化到 AsyncStorage。学科颜色会影响应用主题。
  - `useColorScheme.ts`: 获取设备颜色方案 (深色/浅色)，并适配 web 平台。
  - `useThemeColor.ts`: 根据当前颜色方案和传入的颜色属性（light/dark）返回合适的颜色值。
- `app/constants/`: 存放应用常量 (如 `Colors.ts`, `apiConfig.ts`, AsyncStorage 键等)。
- `app/components/`: 存放可复用的小组件。
  - `Themed.tsx`: 提供基础的主题化 `Text` 和 `View` 组件，它们会根据当前颜色方案自动调整颜色。
  - `ThemedText.tsx`: 提供带额外类型样式（如 title, subtitle, link）的主题化文本组件。
  - `Exercise.tsx`: 练习题渲染和交互组件。
  - `SubjectModal.tsx`: 学科选择弹窗组件。
- `app/services/`: 存放与后端 API 交互的服务模块 (如 `progressService.ts`, `pointsService.ts`, `errorBookService.ts`)。
- `app/contexts/`: (空目录, 未来可用于存放其他 React Context 定义)。
- `app/lesson/`: (空目录, 未来可用于存放课程相关模块)。
- `app/assets/`: 存放静态资源 (图片、字体等)。
  - `images/`: 应用图标、启动图等。
  - `fonts/`: 应用字体。

#### 2.2. 导航 (Expo Router)

- **根导航 (`app/_layout.tsx`)**:
  - 使用 `Stack.Navigator` 作为主导航容器。
  - 管理 `welcome`, `(tabs)`, `study`, `practice`, `subject/[code]` 等屏幕的导航。
  - 动态判断初始路由：如果是首次打开，导航到 `/welcome`；否则导航到 `/(tabs)`。
- **标签导航 (`app/(tabs)/_layout.tsx`)**:
  - 使用 `Tabs` Navigator 定义底部标签栏。
  - 包含 "课程", "练习", "错题本", "积分商城", "个人" 五个标签。
  - 自定义了标签图标和样式。

#### 2.3. 状态管理

- **学科状态 (`app/hooks/useSubject.tsx`)**:
  - 通过 `SubjectContext` 和 `SubjectProvider` 实现全局学科状态共享。
  - `currentSubject` 对象包含学科的 `id`, `name`, `code`, `description`, `color`, `iconName`。
  - 学科选择会持久化到 `AsyncStorage`。
  - `currentSubject.color` 用于动态改变应用的主题颜色（通过 `@react-navigation/native` 的 `ThemeProvider` 和自定义主题实现）。
- **本地持久化**: 使用 `@react-native-async-storage/async-storage` 存储如 "是否已看过欢迎页" (`WELCOME_SCREEN_KEY`) 和 "当前学科" (`CURRENT_SUBJECT_KEY`) 等信息。

#### 2.4. 主要页面逻辑简介

- **`app/welcome.tsx`**:
  - 展示欢迎信息和 "开始探索" 按钮。
  - 点击按钮后，在 `AsyncStorage` 中设置 `WELCOME_SCREEN_KEY` 为 `true`，并导航到 `/(tabs)`。
- **`app/(tabs)/index.tsx` ("课程"页)**:
  - (推测) 展示学科列表或当前学科的单元列表。
  - 用户可以选择学科，触发 `useSubject` 更新当前学科。
  - 用户可以选择单元进入学习或练习。
- **`app/study.tsx` ("学习"页)**:
  - 接收 `unitId` (可能还有 `subjectCode`) 参数。
  - 调用后端 API (如 `GET /api/learning/:subject/:unitId`) 获取该单元的学习内容。
  - 按顺序展示学习材料 (文本、图片、视频等)。
- **`app/practice.tsx` ("练习"页 - 通用单元练习)**:
  - 接收 `unitId` (可能还有 `subjectCode`) 参数。
  - 调用后端 API (如 `GET /api/exercises/:subject/:unitId`) 获取该单元的练习题。
  - 可能传递 `userId` 以便后端判断题目完成状态，并根据 `filterCompleted` 决定是否过滤已做题目。
  - 用户答题，提交答案到后端 (如 `POST /api/users/:userId/submit`)。
- **`app/unlock-test.tsx` ("解锁测试"页)**:
  - 接收 `targetUnitId` 参数。
  - 调用后端 API (`GET /api/exercises/for-unlock-test?targetUnitId=xxx`) 获取解锁测试的题目。
  - 用户完成测试后，(推测) 前端或后端判断测试是否通过。
  - 如果通过，调用后端 API (`POST /api/units/:targetUnitId/attempt-unlock`) 来正式解锁该单元。
- **`app/(tabs)/wrong-exercises.tsx` ("错题本"页)**:
  - 调用后端 API (如 `GET /api/users/:userId/wrong-exercises`) 获取用户的错题列表。
  - 展示错题，允许用户重新练习。
- **`app/(tabs)/shop.tsx` ("积分商城"页)**:
  - (推测) 调用后端 API 获取商品列表。
  - 显示用户当前积分 (通过 `GET /api/users/:userId/points`)。
  - 用户兑换商品时，调用后端 API (`POST /api/users/:userId/points/deduct`) 扣除积分。
- **`app/(tabs)/settings.tsx` ("个人"页)**:
  - (推测) 显示用户信息，如总积分、学习统计等。
  - 可能包含退出登录、设置等功能。

### 3. 后端架构

#### 3.1. 目录结构 (server/src/)

- `server/src/index.js`: Express 应用入口，配置服务器、中间件、路由。
- `server/src/config/database.js`: (推测) 数据库连接配置 (如 Sequelize 实例)。
- `server/src/models/`: (推测) Sequelize 模型定义 (如 `Subject`, `Unit`, `Exercise`, `UserRecord`, `UserPoints`, `LearningContent`, `UnitProgress`, `WrongExercise`)。
- `server/src/routes/`: 存放各模块的路由定义文件。
  - `subjects.js`: 学科相关 API。
  - `exercises.js`: 练习题相关 API。
  - `userRecords.js`: 用户答题记录、进度、错题本等 API。
  - `userPoints.js`: 用户积分相关 API。
  - `units.js`: 单元操作相关 API (实际逻辑在 Controller)。
  - `learningContent.js`: 学习内容相关 API。
- `server/src/controllers/`: 存放控制器逻辑 (如 `unitActionsController.js`)。
- `server/src/middleware/`: (推测) 存放自定义中间件 (如认证 `authMiddleware.js`，虽然部分被注释掉了)。

#### 3.2. Express 应用设置

- 使用 `express` 框架。
- 中间件:
  - `cors`: 允许跨域请求。
  - `express.json()`: 解析 JSON 请求体。
  - `morgan('dev')`: HTTP 请求日志。
  - `express.static`: 托管 `dist/` 目录下的静态文件 (用于前端构建产物)。
- 端口: 默认 3000，可配置。
- 数据库: 启动时测试数据库连接 (`testConnection`)。
- 错误处理: 全局错误处理中间件。
- 端口占用处理: 服务器启动时，如果端口被占用，会尝试自动杀死占用进程 (macOS/Linux)。

#### 3.3. API 端点详解

##### 3.3.1. 学科 (`/api/subjects`, `/subjects`)

- **`GET /`**: 获取所有学科列表。
  - 返回数据包含 `id`, `name`, `code`, `description`, `color`, `iconName`。
  - 后端会根据学科 `code` 附加预定义的 `color` 和 `iconName`。
- **`GET /:code`**: 获取特定学科的详细信息 (通过学科代码)。
- **`GET /:code/units`**: 获取特定学科下的所有单元。
  - 可选查询参数 `level` 筛选单元级别。
  - `userId` (暂时硬编码) 用于判断单元的 `isCompleted` 和 `isLocked` 状态。
  - 实现线性解锁逻辑：前一个单元完成后，下一个单元才解锁。
  - 返回的单元信息包含 `exercisesCount`, `isChallenge`, `iconUrl`, `color` 等增强属性。

##### 3.3.2. 练习题 (`/api/exercises`, `/exercises`)

- **`GET /for-unlock-test?targetUnitId=<unit_id>`**: 获取用于解锁特定单元的测试题。
  - 题目范围包括目标单元及其同科目下的所有前序单元。
  - 返回随机打乱的练习题列表。
- **`GET /:subject/:unitId`**: 获取指定学科下特定单元的练习题 (推荐)。
  - 查询参数: `userId` (用于标记已完成), `filterCompleted` ('true' 则过滤已完成的), `types` (逗号分隔的题型)。
  - 返回的练习题会根据用户完成情况附加 `completed` 标志。
  - 对特定题型 (`matching`, `application`, `math`) 的 `correctAnswer` 会做特殊处理 (如隐藏或部分隐藏)。
  - 返回数据还包括 `allCompleted` (是否全部完成) 和 `typeStats` (题型统计)。
- **`GET /`**: 获取所有包含练习题的单元 ID 列表 (较少使用)。
- _(其他未详细分析的端点可能包括获取单个练习题详情，提交练习等)_

##### 3.3.3. 用户记录与进度 (`/api/users`)

- **`POST /:userId/submit`** (由 `userRecords.js` 处理): 提交用户答题结果。
  - 请求体: `exerciseId`, `unitId`, `isCorrect`。
  - 记录到 `UserRecord` 表 (查找或创建，更新则增加尝试次数)。
  - 如果答错，记录到 `WrongExercise` 表 (查找或创建/更新尝试次数)。
  - 如果答对：
    - 从 `WrongExercise` 表移除。
    - 如果是首次答对该题，则为用户增加积分 (通过 `UserPoints` 表)。
- **`GET /:userId/records`** (由 `userRecords.js` 处理): 获取用户所有答题记录，包含练习题详情。
- **`GET /:userId/progress`** (由 `userRecords.js` 处理，未详细分析): 获取用户整体学习进度。
- **`GET /:userId/progress/:unitId`** (由 `userRecords.js` 处理，未详细分析): 获取用户在特定单元的详细进度，可能使用 `getUnitProgressDetails` 辅助函数，该函数会优先查询 `UnitProgress` 表，若无则根据 `UserRecord` 计算。
- **`GET /:userId/wrong-exercises`** (由 `userRecords.js` 处理，未详细分析): 获取用户的错题列表。

##### 3.3.4. 用户积分 (`/api/users`)

- **`GET /:userId/points`** (由 `userPoints.js` 处理): 获取用户当前的总积分。
- **`POST /:userId/points/add`** (由 `userPoints.js` 处理): 增加用户积分。
  - 请求体: `points` (要增加的数量)。
  - 用于通用加分场景。
- **`POST /:userId/points/deduct`** (由 `userPoints.js` 处理): 扣除用户积分。
  - 请求体: `points` (要扣除的数量)。
  - 用于积分商城兑换等场景。

##### 3.3.5. 单元操作 (`/api/units`)

- **`POST /batch-unlock`** (控制器: `unitActionsController.batchUnlockUnits`): 批量解锁单元。
  - 请求体: `unitIds` (数组), `userId`。
  - 将指定单元在 `UnitProgress` 表中标记为 `completed: true` (通常 `stars: 0`)。
- **`POST /:targetUnitId/attempt-unlock`** (控制器: `unitActionsController.attemptUnlockUnit`): 尝试解锁特定单元（通过测试后）。
  - URL 参数: `targetUnitId`。请求体: `userId`。
  - 解锁条件：用户在目标单元及其前序单元的解锁测试范围内至少答对一道题。
  - 如果满足条件，在 `UnitProgress` 表中将目标单元标记为 `completed: true`, `stars: 1` (或更高)。

##### 3.3.6. 学习内容 (`/api/learning`, `/learning`)

- **`GET /:subject/:id`**: 获取指定学科下特定单元的所有学习内容 (推荐)。
  - 返回学习内容列表，按 `order` 排序。包含 `id`, `unitId`, `title`, `type`, `order`, `content`, `mediaUrl`, `metadata` 等。
- **`GET /detail/:id`**: 获取特定学习内容条目的完整详情 (通过学习内容的主键 `id`)。
- **`GET /`**: 获取所有学习内容的概览列表 (不含详细 `content`)。
- **`POST /`**: 创建新的学习内容条目 (管理员权限)。
- **`PUT /:id`**: 更新指定 ID 的学习内容 (管理员权限)。
- **`DELETE /:id`**: 删除指定 ID 的学习内容 (管理员权限)。

### 4. 核心业务流程串联

#### 4.1. 用户首次启动与导航

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

#### 4.2. 学科选择与主题切换

1.  **用户在 "课程" 页 (或学科选择界面) 选择一个学科**。
2.  **前端 (`useSubject` hook)**:
    - 调用 `setCurrentSubject(selectedSubject)` 更新 React Context 中的 `currentSubject`。
    - 调用 `saveCurrentSubject(selectedSubject)` 将学科信息 (包括 `code`, `name`, `color` 等) 保存到 `AsyncStorage`。
3.  **主题更新 (`app/_layout.tsx -> RootLayoutNav`)**:
    - `RootLayoutNav` 组件消费 `useSubject` 提供的 `currentSubject`。
    - `customTheme` 中的 `primary` 颜色会使用 `currentSubject.color`。
    - `ThemeProvider` 应用新的主题，UI 中使用 `primary` 色的部分会更新。

#### 4.3. 单元学习与练习流程

1.  **用户在 "课程" 页选择一个单元 (假设已解锁)**。
2.  **进入学习界面 (`app/study.tsx`)**:
    - 传入 `unitId` 和 `subjectCode`。
    - 调用 `GET /api/learning/:subjectCode/:unitId` 获取学习内容列表。
    - 前端渲染学习材料。
3.  **进入练习界面 (`app/practice.tsx`)**:
    - 传入 `unitId` 和 `subjectCode`。
    - 调用 `GET /api/exercises/:subjectCode/:unitId?userId=xxx` 获取练习题。
    - 前端渲染题目。
4.  **用户答题并提交**:
    - 前端将答案 (题号 `exerciseId`, 所属单元 `unitId`, 是否正确 `isCorrect`) `POST` 到 `/api/users/:userId/submit`。
5.  **后端处理提交**:
    - 记录到 `UserRecord`。
    - 更新错题本 (`WrongExercise`)。
    - 如果首次答对，更新用户积分 (`UserPoints`)。
    - (后端可能会有逻辑，在特定条件下更新 `UnitProgress`，例如当单元内所有题目完成时，或达到一定正确率时，将单元标记为完成并给予星级评价)。

#### 4.4. 单元解锁流程

1.  **用户在 "课程" 页遇到一个锁定的单元**。
2.  **点击 "解锁测试" (或类似按钮)**。
3.  **进入解锁测试页 (`app/unlock-test.tsx`)**:
    - 传入 `targetUnitId`。
    - 调用 `GET /api/exercises/for-unlock-test?targetUnitId=xxx` 获取该单元解锁所需的测试题。
    - 前端渲染测试题。
4.  **用户完成测试并提交**:
    - (前端可能先在本地判断是否有答对，或者直接依赖后端 `attempt-unlock` 接口的判断逻辑)。
    - 前端调用 `POST /api/units/:targetUnitId/attempt-unlock`，请求体中包含 `userId`。
5.  **后端处理解锁尝试 (`unitActionsController.attemptUnlockUnit`)**:
    - 验证用户在解锁测试范围内的题目中是否至少答对一题。
    - 如果满足条件：
      - 更新 `UnitProgress` 表，将该 `targetUnitId` 标记为 `completed: true`, `stars: 1` (或更高)。
      - 返回成功响应。
    - 如果不满足条件，返回失败响应。
6.  **前端更新 UI**: 如果解锁成功，课程页该单元状态更新为已解锁。

#### 4.5. 错题本

1.  **用户进入 "错题本" 页 (`app/(tabs)/wrong-exercises.tsx`)**。
2.  调用 `GET /api/users/:userId/wrong-exercises` 获取错题列表。
3.  用户选择错题进行重新练习。
4.  提交答案流程类似普通练习，如果答对，后端 `/api/users/:userId/submit` 接口会将其从 `WrongExercise` 表中移除。

#### 4.6. 积分商城

1.  **用户进入 "积分商城" 页 (`app/(tabs)/shop.tsx`)**。
2.  前端调用 `GET /api/users/:userId/points` 显示用户当前积分。
3.  (推测) 前端调用某个 API 获取商品列表。
4.  用户选择商品兑换。
5.  前端调用 `POST /api/users/:userId/points/deduct`，请求体中包含消耗的 `points`。
6.  后端扣除积分，并返回结果。前端更新用户积分显示，并处理后续发货/虚拟物品授予逻辑。

---
