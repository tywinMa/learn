const express = require('express');
const { 
  getCourses, 
  getCourseById, 
  getCoursesBySubject,
  createCourse, 
  updateCourse, 
  deleteCourse 
} = require('../../controllers/admin/courseController');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

// 所有课程路由都需要身份验证
router.use(authenticate);

// 获取课程列表
router.get('/', getCourses);

// 获取指定学科的课程列表
router.get('/subject/:subjectCode', getCoursesBySubject);

// 获取课程详情
router.get('/:id', getCourseById);

// 创建课程 (只有管理员和超级管理员可以)
router.post('/', authorize('admin', 'superadmin'), createCourse);

// 更新课程 (只有管理员和超级管理员可以)
router.put('/:id', authorize('admin', 'superadmin'), updateCourse);

// 删除课程 (只有管理员和超级管理员可以)
router.delete('/:id', authorize('admin', 'superadmin'), deleteCourse);

module.exports = router; 