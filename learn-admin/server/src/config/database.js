const { Sequelize } = require('sequelize');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env].database;

const sequelize = new Sequelize({
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// 检查数据库连接
const checkDatabaseConnection = async () => {
  try {
    // 确保SQLite文件所在目录存在
    const dbDir = path.dirname(dbConfig.storage);
    if (dbDir !== '.' && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    await sequelize.authenticate();
    console.log('数据库连接成功');
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    return false;
  }
};

module.exports = sequelize;
module.exports.checkDatabaseConnection = checkDatabaseConnection; 