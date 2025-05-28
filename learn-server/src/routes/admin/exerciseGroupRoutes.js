const express = require('express');
const router = express.Router();
const exerciseGroupController = require('../../controllers/admin/exerciseGroupController');
const { authenticate } = require('../../middlewares/auth');

// 获取习题组列表
router.get('/', authenticate, exerciseGroupController.getExerciseGroups);

// 根据学科获取习题组列表
router.get('/subject/:subjectCode', authenticate, exerciseGroupController.getExerciseGroupsBySubject);

// 获取习题组详情
router.get('/:id', authenticate, exerciseGroupController.getExerciseGroupById);

// 创建习题组
router.post('/', authenticate, exerciseGroupController.createExerciseGroup);

// 更新习题组
router.put('/:id', authenticate, exerciseGroupController.updateExerciseGroup);

// 删除习题组
router.delete('/:id', authenticate, exerciseGroupController.deleteExerciseGroup);

module.exports = router; 