require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'your-default-secret-key',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'admin-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']
  }
}; 