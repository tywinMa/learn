const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { authenticate, authorize } = require('../middlewares/auth');

// 测试路由（无需认证）
// 模拟用户中间件
const mockUser = (req, res, next) => {
  req.user = {
    id: 1,
    username: 'testuser',
    name: '测试用户'
  };
  next();
};

router.post('/test', mockUser, exerciseController.createExercise);
router.get('/test', exerciseController.getAllExercises);
router.get('/test/:id', exerciseController.getExerciseById);

// 获取所有练习题
router.get('/', authenticate, exerciseController.getAllExercises);

// 获取指定课程的所有练习题
router.get('/course/:courseId', authenticate, exerciseController.getExercisesByCourse);

// 获取指定单元的所有练习题
router.get('/unit/:unitId', authenticate, exerciseController.getExercisesByUnit);

// 获取单个练习题
router.get('/:id', authenticate, exerciseController.getExerciseById);

// 创建练习题（教师、管理员和超级管理员）
router.post('/', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  exerciseController.createExercise
);

// 更新练习题（教师、管理员和超级管理员）
router.put('/:id', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  exerciseController.updateExercise
);

// 删除练习题（教师、管理员和超级管理员）
router.delete('/:id', 
  authenticate, 
  authorize('teacher', 'admin', 'superadmin'), 
  exerciseController.deleteExercise
);

module.exports = router; 