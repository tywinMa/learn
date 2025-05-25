const express = require('express');
const router = express.Router();
const unitController = require('../../controllers/admin/unitController');
const { authenticate, authorize } = require('../../middlewares/auth');

// 获取所有单元
router.get('/', authenticate, unitController.getAllUnits);

// 获取指定学科的所有单元
router.get('/subject/:subject', authenticate, unitController.getUnitsBySubject);

// 获取单个单元
router.get('/:id', authenticate, unitController.getUnitById);

// 创建单元（仅教师、管理员和超级管理员）
router.post('/', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  unitController.createUnit
);

// 更新单元（仅教师、管理员和超级管理员）
router.put('/:id', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  unitController.updateUnit
);

// 删除单元（仅教师、管理员和超级管理员）
router.delete('/:id', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  unitController.deleteUnit
);

// 批量删除指定学科的所有单元（仅教师、管理员和超级管理员）
router.delete('/subject/:subject', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  unitController.deleteUnitsBySubject
);

module.exports = router; 