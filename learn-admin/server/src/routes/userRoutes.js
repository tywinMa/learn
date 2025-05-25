const express = require('express');
const { getUserProfile, changePassword } = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// 所有用户路由都需要身份验证
router.use(authenticate);

// 获取当前用户信息
router.get('/profile', getUserProfile);

// 修改密码
router.put('/password', changePassword);

module.exports = router; 