const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const sequelize = require('./config/database');
const { checkDatabaseConnection } = require('./config/database');

// 导入路由
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const unitRoutes = require('./routes/unitRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const subjectRoutes = require('./routes/subjectRoutes');

const env = process.env.NODE_ENV || 'development';
const appConfig = config[env];
const PORT = appConfig.port;

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../dist/uploads')));

// 路由
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/courses', courseRoutes);
app.use('/api/admin/units', unitRoutes);
app.use('/api/admin/exercises', exerciseRoutes);
app.use('/api/admin/upload', uploadRoutes);
app.use('/api/admin/subjects', subjectRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '后台管理系统API服务已启动' });
});

// 启动服务器
const startServer = async () => {
  try {
    // 只检查数据库连接，不进行初始化
    await checkDatabaseConnection();
    console.log('数据库连接检查完成');
    
    app.listen(PORT, () => {
      console.log(`服务器运行在端口: ${PORT}`);
    });
  } catch (error) {
    console.error('无法启动服务器:', error);
    console.error('数据库连接失败，服务器启动失败');
    process.exit(1);
  }
};

startServer(); 