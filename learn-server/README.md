# Learn Server - 统一后端服务

这是learn项目的统一后端服务，同时为客户端（App）和管理后台（Admin）提供API接口。

## 项目结构

```
learn-server/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   │   └── admin/       # 管理端控制器
│   ├── database/        # 数据库文件
│   ├── middlewares/     # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由
│   │   └── admin/       # 管理端路由
│   ├── services/        # 服务层
│   ├── utils/           # 工具函数
│   └── index.js         # 入口文件
├── uploads/             # 上传文件目录
├── package.json         # 项目依赖
└── README.md            # 项目说明
```

## API 路径规范

- **App端接口**：以 `/api` 开头
  - 例如：`/api/subjects`、`/api/exercises`
  
- **Admin端接口**：以 `/api/admin` 开头
  - 例如：`/api/admin/auth/login`、`/api/admin/courses`

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件并配置以下变量：

```
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
ADMIN_JWT_SECRET=admin-secret-key-here
JWT_EXPIRES_IN=7d
```

### 3. 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## 数据库

项目使用 SQLite 数据库，数据库文件位于 `src/database/learn.sqlite`。

### 数据初始化

初始化数据库（包含所有数据）：
```bash
npm run init-db
```

重置数据（保留表结构）：
```bash
npm run reset-data
```

重置数据并启动服务器：
```bash
npm run reset-data:run
```

强制重建数据库（删除所有数据）：
```bash
npm run reset-data:force
```

### 初始化选项

使用命令行参数控制初始化内容：

```bash
# 不包含管理员数据
node src/database/init.js --no-admin

# 不包含知识点数据
node src/database/init.js --no-knowledge

# 强制重建数据库表
node src/database/init.js --force
```

或使用reset-data脚本：

```bash
# 查看帮助
./scripts/reset-data.sh --help

# 重置但不包含管理员数据
./scripts/reset-data.sh --no-admin

# 重置并启动服务器，不包含知识点
./scripts/reset-data.sh -r --no-knowledge
```

### 管理工具

使用交互式管理工具：

```bash
npm run manage
```

管理工具提供以下功能：
- 启动开发服务器
- 重置数据（多种模式）
- 查看数据库状态
- 停止所有服务
- 分别初始化不同类型的数据

## 模型说明

以learn项目的模型定义为准，主要包括：

- **Subject** - 学科
- **Unit** - 大单元
- **Course** - 小单元（课程）
- **Exercise** - 练习题
- **User** - 用户（管理端）
- **AnswerRecord** - 答题记录
- **KnowledgePoint** - 知识点
- **UnitProgress** - 单元进度
- **UserPoints** - 用户积分

## 注意事项

1. 所有API接口都需要CORS支持，已配置允许所有来源
2. Admin端接口需要JWT认证，使用Bearer Token
3. 上传文件存储在 `uploads/` 目录下
4. 数据库使用驼峰命名，与learn项目保持一致

## 前端配置修改

### Learn App端
无需修改，默认连接 `http://localhost:3000`

### Learn Admin端
需要修改 `vite.config.ts` 中的代理配置：
```javascript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:3000', // 从3001改为3000
    changeOrigin: true,
  }
}
``` 