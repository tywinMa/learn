const express = require('express');
const router = express.Router();
const knowledgePointController = require('../../controllers/admin/knowledgePointController');
const { authenticate, authorize } = require('../../middlewares/auth');

// 模拟用户中间件（用于测试）
const mockUser = (req, res, next) => {
  req.user = {
    id: 1,
    username: 'testuser',
    name: '测试用户'
  };
  next();
};

// 测试路由（无需认证）
router.post('/test', mockUser, knowledgePointController.createKnowledgePoint);
router.get('/test', knowledgePointController.getAllKnowledgePoints);
router.get('/test/:id', knowledgePointController.getKnowledgePointById);

// 获取所有知识点
router.get('/', authenticate, knowledgePointController.getAllKnowledgePoints);

// 获取单个知识点
router.get('/:id', authenticate, knowledgePointController.getKnowledgePointById);

// 创建知识点（教师、管理员和超级管理员）
router.post('/', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  knowledgePointController.createKnowledgePoint
);

// 更新知识点（教师、管理员和超级管理员）
router.put('/:id', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  knowledgePointController.updateKnowledgePoint
);

// 删除知识点（管理员和超级管理员）
router.delete('/:id', 
  authenticate, 
  authorize('admin', 'superadmin'), 
  knowledgePointController.deleteKnowledgePoint
);

module.exports = router; 