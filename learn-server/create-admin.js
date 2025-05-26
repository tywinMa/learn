const { User } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function createAdmin() {
  try {
    await sequelize.sync();
    
    const admin = await User.create({
      username: 'admin',
      name: '管理员',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('管理员用户创建成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('用户ID:', admin.id);

  } catch (error) {
    console.error('创建管理员用户失败:', error);
  } finally {
    await sequelize.close();
  }
}

createAdmin(); 