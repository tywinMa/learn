const { Sequelize } = require('sequelize');
const path = require('path');

// 创建SQLite数据库连接
// 数据库文件将保存在server/src/database/learn.sqlite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/learn.sqlite'),
  logging: false // 设置为true可以在控制台看到SQL查询日志
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('无法连接到数据库:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};
