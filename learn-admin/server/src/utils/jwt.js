const jwt = require('jsonwebtoken');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const jwtConfig = config[env].jwt;

const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 