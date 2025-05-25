const express = require('express');
const { login, logout } = require('../../controllers/admin/authController');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// 登录路由
router.post('/login', login);

// 登出路由 (需要身份验证)
router.post('/logout', authenticate, logout);

module.exports = router; 