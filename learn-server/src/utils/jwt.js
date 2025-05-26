const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (user) => {
  let payload;
  
  // 如果是学生token格式 { id: studentId, type: 'student' }
  if (user.type === 'student') {
    payload = {
      id: user.id,
      type: 'student'
    };
  } else {
    // 管理员用户格式
    payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };
  }

  return jwt.sign(payload, config.adminJwtSecret, { expiresIn: config.jwtExpiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.adminJwtSecret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 