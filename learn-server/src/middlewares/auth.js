const { verifyToken } = require('../utils/jwt');
const { User, Student } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    console.log('=== 后端认证中间件开始 ===');
    const authHeader = req.headers.authorization;
    console.log('Authorization头:', authHeader ? `${authHeader.substring(0, 20)}...` : '无');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ 认证失败: 未提供认证令牌或格式错误');
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('提取的token:', token ? `${token.substring(0, 20)}...` : '无');
    
    console.log('开始验证token...');
    const decoded = verifyToken(token);
    console.log('Token验证成功，decoded:', decoded);
    
    console.log('查找用户...');
    const user = await User.findByPk(decoded.id);
    console.log('找到用户:', user ? { id: user.id, username: user.username, role: user.role } : '未找到');
    
    if (!user) {
      console.log('❌ 认证失败: 用户不存在');
      return res.status(401).json({ message: '用户不存在' });
    }
    
    req.user = user;
    console.log('✅ 认证成功');
    console.log('=== 后端认证中间件结束 ===');
    next();
  } catch (error) {
    console.log('=== 后端认证中间件错误 ===');
    console.log('错误类型:', error.constructor.name);
    console.log('错误消息:', error.message);
    console.log('错误堆栈:', error.stack);
    console.log('=== 后端认证中间件错误结束 ===');
    return res.status(401).json({ message: '认证失败: ' + error.message });
  }
};

// 学生认证中间件
const authenticateStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: '未提供认证令牌' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // 检查token类型是否为学生
    if (decoded.type !== 'student') {
      return res.status(401).json({ 
        success: false,
        message: '无效的认证令牌' 
      });
    }
    
    const student = await Student.findByPk(decoded.id);
    
    if (!student) {
      return res.status(401).json({ 
        success: false,
        message: '学生不存在' 
      });
    }
    
    if (student.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        message: '账户已被停用' 
      });
    }
    
    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: '认证失败: ' + error.message 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '未认证用户' });
    }
    
    // 临时取消角色权限检查，所有认证用户都可以通过
    /*
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: '无权限执行此操作' });
    }
    */
    
    next();
  };
};

module.exports = {
  authenticate,
  authenticateStudent,
  authorize
}; 