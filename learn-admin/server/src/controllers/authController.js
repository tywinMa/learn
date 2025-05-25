const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

// 登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        err_no: 400,
        message: '用户名和密码为必填项',
        data: null
      });
    }
    
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ 
        err_no: 401,
        message: '用户名或密码错误',
        data: null
      });
    }
    
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        err_no: 401,
        message: '用户名或密码错误',
        data: null
      });
    }
    
    const token = generateToken(user);
    
    res.json({
      err_no: 0,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message,
      data: null
    });
  }
};

// 登出（由于使用JWT，客户端只需删除token即可，此处为后端实现）
const logout = (req, res) => {
  // 实际JWT无法在服务端失效（除非使用黑名单），这里只是返回成功消息
  res.json({ 
    err_no: 0,
    message: '登出成功',
    data: null
  });
};

module.exports = {
  login,
  logout
}; 