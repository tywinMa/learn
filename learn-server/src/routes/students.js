const express = require('express');
const { 
  studentLogin, 
  studentRegister, 
  getStudentProfile, 
  updateStudentProfile,
  changeStudentPassword 
} = require('../controllers/studentController');
const { authenticateStudent } = require('../middlewares/auth');

const router = express.Router();

// 学生登录
router.post('/login', studentLogin);

// 学生注册
router.post('/register', studentRegister);

// 获取学生个人信息（需要认证）
router.get('/profile', authenticateStudent, getStudentProfile);

// 更新学生个人信息（需要认证）
router.put('/profile', authenticateStudent, updateStudentProfile);

// 修改密码（需要认证）
router.put('/change-password', authenticateStudent, changeStudentPassword);

module.exports = router; 