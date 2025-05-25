# 学习应用服务端

这是一个基于Express.js的服务端，用于提供学习应用的练习题数据，并支持用户答题记录和错题本功能。使用SQLite数据库进行数据持久化存储。

## 数据库设计

本项目使用SQLite作为数据库，通过Sequelize ORM进行数据库操作。数据库设计如下：

1. **Exercise (练习题)**
   - id: 练习题ID (主键)
   - unitId: 所属单元ID
   - question: 题目内容
   - options: 选项 (JSON格式)
   - correctAnswer: 正确答案索引

2. **UserRecord (用户答题记录)**
   - id: 记录ID (主键)
   - userId: 用户ID
   - exerciseId: 练习题ID
   - unitId: 单元ID
   - isCorrect: 是否正确
   - attemptCount: 尝试次数

3. **WrongExercise (错题本)**
   - id: 记录ID (主键)
   - userId: 用户ID
   - exerciseId: 练习题ID
   - unitId: 单元ID
   - attempts: 尝试次数

## 安装

```bash
cd server
npm install
```

## 运行

开发模式（自动重启）:
```bash
npm run dev
```

生产模式:
```bash
npm start
```

## API接口

### 练习题接口

#### 获取所有练习题单元
```
GET /api/exercises
```

#### 获取特定单元的练习题
```
GET /api/exercises/:unitId
```
例如: `/api/exercises/1-1`

可选查询参数:
- `userId`: 用户ID
- `filterCompleted`: 是否过滤已完成的题目（true/false）

例如: `/api/exercises/1-1?userId=user1&filterCompleted=true`

#### 获取特定练习题
```
GET /api/exercises/:unitId/:exerciseId
```
例如: `/api/exercises/1-1/1-1-1`

### 用户记录接口

#### 获取用户的所有答题记录
```
GET /api/users/:userId/records
```
例如: `/api/users/user1/records`

#### 提交用户的答题结果
```
POST /api/users/:userId/submit
```
例如: `/api/users/user1/submit`

请求体:
```json
{
  "exerciseId": "1-1-1",
  "unitId": "1-1",
  "isCorrect": true
}
```

#### 获取用户的错题本
```
GET /api/users/:userId/wrong-exercises
```
例如: `/api/users/user1/wrong-exercises`

#### 从错题本中删除一道题
```
DELETE /api/users/:userId/wrong-exercises/:exerciseId
```
例如: `/api/users/user1/wrong-exercises/1-1-1`

## 功能说明

1. **练习题过滤**: 可以根据用户ID过滤已完成的题目，只返回未完成或答错的题目
2. **答题记录**: 记录用户的答题结果，包括是否正确、时间戳等
3. **错题本**: 自动收集用户答错的题目，支持再次练习和从错题本中删除
4. **学习进度**: 正确的题目下次不再显示，错误的题目会被收录到错题本中

## 数据库迁移说明

当前项目使用SQLite作为数据库，便于开发和测试。如需迁移到MySQL或MongoDB，可按以下步骤操作：

### 迁移到MySQL

1. 安装MySQL相关依赖:
   ```bash
   npm install mysql2
   ```

2. 修改数据库配置 (`src/config/database.js`):
   ```javascript
   const sequelize = new Sequelize({
     dialect: 'mysql',
     host: 'localhost',
     username: 'root',
     password: 'your_password',
     database: 'learn_app',
     logging: false
   });
   ```

### 迁移到MongoDB

1. 安装MongoDB相关依赖:
   ```bash
   npm install mongoose
   ```

2. 创建MongoDB连接和模型，替换Sequelize相关代码。

注意：迁移到MongoDB需要对模型和查询逻辑进行较大改动，因为MongoDB是文档型数据库，与关系型数据库的操作方式不同。
