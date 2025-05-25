# 后台服务管理系统

基于 Node.js、Express 和 Sequelize 的后台服务管理系统API。

## 技术栈

- Node.js - 作为后端运行环境
- Express.js - Web框架，用于处理HTTP请求和路由
- Sequelize - ORM框架，用于数据库模型定义和操作
- MySQL - 关系型数据库
- JWT - 用于用户认证

## 项目结构

```
server/
├── src/
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── middlewares/    # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── utils/          # 工具函数
│   └── app.js          # 应用入口
└── package.json        # 项目配置
```

## 安装与运行

### 前提条件

- Node.js (v14或更高版本)
- MySQL (v5.7或更高版本)

### 安装步骤

1. 克隆或下载项目

2. 安装依赖
   ```
   npm install
   ```

3. 配置数据库
   编辑 `src/config/config.js` 文件中的数据库配置参数（主机、用户名、密码等）

4. 初始化数据
   ```
   npm run seed
   ```

5. 启动服务
   ```
   npm run dev
   ```

服务将运行在 http://localhost:3000

## API 端点

### 认证模块

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 用户模块

- `GET /api/users/profile` - 获取当前用户信息
- `PUT /api/users/password` - 修改密码

### 课程模块

- `GET /api/courses` - 获取课程列表（支持分页、筛选）
- `GET /api/courses/:id` - 获取课程详情
- `POST /api/courses` - 创建新课程
- `PUT /api/courses/:id` - 更新课程信息
- `DELETE /api/courses/:id` - 删除课程

## 测试账户

系统初始化后包含以下测试账户：

- 超级管理员：
  - 用户名：admin
  - 密码：admin123

- 教师账户：
  - 用户名：teacher1
  - 密码：teacher123

## 许可证

ISC

// todo:
    1. 习题部分
