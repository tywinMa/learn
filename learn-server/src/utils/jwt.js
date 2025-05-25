const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };

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