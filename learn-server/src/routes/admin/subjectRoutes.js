const express = require('express');
const { 
  getSubjects, 
  getSubjectById, 
  createSubject, 
  updateSubject, 
  deleteSubject 
} = require('../../controllers/admin/subjectController');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

// 所有学科路由都需要身份验证
router.use(authenticate);

// 获取学科列表
router.get('/', getSubjects);

// 获取学科详情
router.get('/:id', getSubjectById);

// 创建学科 (只有管理员和超级管理员可以)
router.post('/', authorize('admin', 'superadmin'), createSubject);

// 更新学科 (只有管理员和超级管理员可以)
router.put('/:id', authorize('admin', 'superadmin'), updateSubject);

// 删除学科 (只有管理员和超级管理员可以)
router.delete('/:id', authorize('admin', 'superadmin'), deleteSubject);

module.exports = router; 