const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// 创建SQLite数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/learn.sqlite'),
  logging: false, // 设置为true可以在控制台看到SQL查询日志
  define: {
    timestamps: true,
    underscored: false // 保持与learn项目一致，使用驼峰命名
  }
});

// 测试数据库连接
const testConnection = async () => {
  try {
    // 确保数据库目录存在
    const dbDir = path.join(__dirname, '../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    await sequelize.authenticate();
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('无法连接到数据库:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
}; 