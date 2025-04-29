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

    // 尝试启动服务器，如果端口被占用则尝试杀掉占用进程
    const server = app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`端口 ${PORT} 已被占用，尝试杀掉占用进程...`);

        // 在 macOS/Linux 上使用 lsof 查找占用端口的进程并杀掉
        const { execSync } = require('child_process');
        try {
          // 查找占用端口的进程 PID
          const pid = execSync(`lsof -t -i:${PORT}`).toString().trim();
          if (pid) {
            console.log(`找到占用端口 ${PORT} 的进程 PID: ${pid}，正在终止...`);
            execSync(`kill -9 ${pid}`);
            console.log(`已终止进程 ${pid}`);

            // 等待进程终止后再次尝试启动服务器
            setTimeout(() => {
              app.listen(PORT, () => {
                console.log(`服务器运行在 http://localhost:${PORT}`);
              });
            }, 1000);
          }
        } catch (execError) {
          console.error(`无法终止占用端口 ${PORT} 的进程:`, execError.message);
          console.error('请手动终止占用端口的进程后再启动服务器');
          process.exit(1);
        }
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
