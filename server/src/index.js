const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection } = require('./config/database');
const initDatabase = require('./database/init');
const exercisesRoutes = require('./routes/exercises');
const userRecordsRoutes = require('./routes/userRecords');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: '*', // 允许所有来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(morgan('dev')); // 日志记录

// 添加CORS预检请求处理
app.options('*', cors());

// 路由
app.use('/api/exercises', exercisesRoutes);
app.use('/api/users', userRecordsRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '学习应用API服务器运行中' });
});

// 初始化数据库并启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();

    // 初始化数据库并导入数据
    await initDatabase();

    // 尝试启动服务器，如果端口被占用则自动选择另一个端口
    const server = app.listen(PORT, () => {
      const actualPort = server.address().port;
      console.log(`服务器运行在 http://localhost:${actualPort}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // 端口被占用，尝试使用随机端口
        console.log(`端口 ${PORT} 已被占用，尝试使用随机端口...`);
        const randomPort = Math.floor(3001 + Math.random() * 1000);
        app.listen(randomPort, () => {
          console.log(`服务器运行在 http://localhost:${randomPort}`);
        });
      } else {
        throw err;
      }
    });
  } catch (error) {
    console.error('启动服务器时出错:', error);
    process.exit(1);
  }
};

startServer();
