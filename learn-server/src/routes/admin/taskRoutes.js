const express = require('express');
const TaskController = require('../../controllers/admin/taskController');
const router = express.Router();

// 获取任务列表
router.get('/', TaskController.getTasks);

// 获取任务统计
router.get('/stats', TaskController.getTaskStats);

// 获取单个任务详情
router.get('/:id', TaskController.getTask);

// 删除任务
router.delete('/:id', TaskController.deleteTask);

// 创建AI生成习题组任务
router.post('/ai-generate-exercise-group', TaskController.createAIGenerateExerciseGroupTask);

// 清理旧任务
router.post('/cleanup', TaskController.cleanupOldTasks);

module.exports = router; 