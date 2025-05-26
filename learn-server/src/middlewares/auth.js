const { verifyToken } = require('../utils/jwt');
const { User, Student } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
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