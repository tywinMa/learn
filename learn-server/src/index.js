const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// 导入 app 端路由
const exercisesRoutes = require('./routes/exercises');
const studentPointsRoutes = require('./routes/studentPoints');
const unitContentRoutes = require('./routes/unitContent');
const subjectsRoutes = require('./routes/subjects');
const unitsRouter = require('./routes/units');
const knowledgePointsRoutes = require('./routes/knowledgePoints');
const answerRecordsRoutes = require('./routes/answerRecords');
const studentsRoutes = require('./routes/students');

// 导入 admin 端路由
const adminAuthRoutes = require('./routes/admin/authRoutes');
const adminUserRoutes = require('./routes/admin/userRoutes');
const adminStudentRoutes = require('./routes/admin/studentRoutes');
const adminCourseRoutes = require('./routes/admin/courseRoutes');
const adminUnitRoutes = require('./routes/admin/unitRoutes');
const adminExerciseRoutes = require('./routes/admin/exerciseRoutes');
const adminExerciseGroupRoutes = require('./routes/admin/exerciseGroupRoutes');
const adminUploadRoutes = require('./routes/admin/uploadRoutes');
const adminSubjectRoutes = require('./routes/admin/subjectRoutes');
const adminKnowledgePointRoutes = require('./routes/admin/knowledgePointRoutes');
const adminTaskRoutes = require('./routes/admin/taskRoutes');

const app = express();
const PORT = config.port;

// 中间件
app.use(cors({
  origin: '*', // 允许所有来源的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../dist')));

// 添加CORS预检请求处理
app.options('*', cors());

// App端路由 - 以 /api 开头
app.use('/api/exercises', exercisesRoutes);
app.use('/api/unit-content', unitContentRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/units', unitsRouter);
app.use('/api/answer-records', answerRecordsRoutes);
app.use('/api/knowledge-points', knowledgePointsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/students', studentPointsRoutes);

// Admin端路由 - 以 /api/admin 开头
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/students', adminStudentRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/units', adminUnitRoutes);
app.use('/api/admin/exercises', adminExerciseRoutes);
app.use('/api/admin/exercise-groups', adminExerciseGroupRoutes);
app.use('/api/admin/upload', adminUploadRoutes);
app.use('/api/admin/subjects', adminSubjectRoutes);
app.use('/api/admin/knowledge-points', adminKnowledgePointRoutes);
app.use('/api/admin/tasks', adminTaskRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ 
    message: '统一后端服务已启动',
    endpoints: {
      app: '/api/*',
      admin: '/api/admin/*'
    }
  });
});

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
    console.log('数据库连接测试成功');
    
    // 启用数据库同步，确保Task表被创建
    await syncDatabase();
    console.log('数据库模型同步完成');
    
    // 检查数据库状态
    const { Subject } = require('./models');
    const subjectCount = await Subject.count();
    console.log(`数据库状态检查: 学科数量 = ${subjectCount}`);

    // 尝试启动服务器，如果端口被占用则尝试杀掉占用进程
    const server = app.listen(PORT, () => {
      console.log(`统一服务器运行在 http://localhost:${PORT}`);
      console.log(`App端接口: http://localhost:${PORT}/api`);
      console.log(`Admin端接口: http://localhost:${PORT}/api/admin`);
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
                console.log(`统一服务器运行在 http://localhost:${PORT}`);
                console.log(`App端接口: http://localhost:${PORT}/api`);
                console.log(`Admin端接口: http://localhost:${PORT}/api/admin`);
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