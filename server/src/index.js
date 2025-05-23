const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { testConnection } = require('./config/database');
const exercisesRoutes = require('./routes/exercises');
const userPointsRoutes = require('./routes/userPoints');
const unitContentRoutes = require('./routes/unitContent');
const subjectsRoutes = require('./routes/subjects');
const unitsRouter = require('./routes/units');
const knowledgePointsRoutes = require('./routes/knowledgePoints');
const answerRecordsRoutes = require('./routes/answerRecords');

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

// 新增：静态文件代理
app.use(express.static(path.join(__dirname, '..', '..', 'dist')));

// 添加CORS预检请求处理
app.options('*', cors());

// 路由
app.use('/api/exercises', exercisesRoutes);
app.use('/api/users', userPointsRoutes);
app.use('/api/unit-content', unitContentRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/units', unitsRouter);
app.use('/api/answer-records', answerRecordsRoutes);
app.use('/api/knowledge-points', knowledgePointsRoutes);

// 添加全局错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();

    // 移除所有数据初始化调用

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
