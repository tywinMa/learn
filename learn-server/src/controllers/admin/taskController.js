const TaskService = require('../../services/taskService');
const AITaskService = require('../../services/aiTaskService');

/**
 * 任务控制器
 */
class TaskController {
  /**
   * 获取任务列表
   */
  static async getTasks(req, res) {
    try {
      const { page = 1, pageSize = 20, status, type } = req.query;

      const options = {
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };

      if (status) {
        if (status.includes(',')) {
          options.status = status.split(',');
        } else {
          options.status = status;
        }
      }

      if (type) {
        options.type = type;
      }

      const result = await TaskService.getTasks(options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('获取任务列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取任务列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取单个任务详情
   */
  static async getTask(req, res) {
    try {
      const { id } = req.params;
      const task = await TaskService.getTask(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      console.error('获取任务详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取任务详情失败',
        error: error.message
      });
    }
  }

  /**
   * 删除任务
   */
  static async deleteTask(req, res) {
    try {
      const { id } = req.params;
      await TaskService.deleteTask(id);

      res.json({
        success: true,
        message: '任务删除成功'
      });
    } catch (error) {
      console.error('删除任务失败:', error);
      res.status(500).json({
        success: false,
        message: '删除任务失败',
        error: error.message
      });
    }
  }

  /**
   * 创建AI生成习题组任务
   */
  static async createAIGenerateExerciseGroupTask(req, res) {
    try {
      const params = req.body;
      const { groupName, subject, gradeId, type, courseId, relevance, difficulty, questionCount } = params;

      // 参数验证
      if (!groupName || !subject || !type || !questionCount) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：groupName, subject, type, questionCount'
        });
      }

      if (!['choice', 'fill_blank', 'matching', 'mixed'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: '不支持的题目类型'
        });
      }

      if (questionCount < 1 || questionCount > 50) {
        return res.status(400).json({
          success: false,
          message: '题目数量必须在1-50之间'
        });
      }

      const task = await AITaskService.createAIGenerateExerciseGroupTask(params);

      res.json({
        success: true,
        data: task,
        message: '任务创建成功，正在后台执行中...'
      });
    } catch (error) {
      console.error('创建AI生成习题组任务失败:', error);
      res.status(500).json({
        success: false,
        message: '创建任务失败',
        error: error.message
      });
    }
  }

  /**
   * 创建AI生成单个习题任务
   */
  static async createAIGenerateSingleExerciseTask(req, res) {
    try {
      const params = req.body;
      const { subject, gradeId, type, courseId, relevance, difficulty } = params;

      // 参数验证
      if (!subject || !type) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：subject, type'
        });
      }

      if (!['choice', 'fill_blank', 'matching'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: '不支持的题目类型，单个习题生成仅支持：choice, fill_blank, matching'
        });
      }

      const task = await AITaskService.createAIGenerateSingleExerciseTask(params);

      res.json({
        success: true,
        data: task,
        message: '任务创建成功，正在后台执行中...'
      });
    } catch (error) {
      console.error('创建AI生成单个习题任务失败:', error);
      res.status(500).json({
        success: false,
        message: '创建任务失败',
        error: error.message
      });
    }
  }

  /**
   * 获取任务统计信息
   */
  static async getTaskStats(req, res) {
    try {
      const [pending, running, success, failed] = await Promise.all([
        TaskService.getTasks({ status: 'pending', pageSize: 1 }),
        TaskService.getTasks({ status: 'running', pageSize: 1 }),
        TaskService.getTasks({ status: 'success', pageSize: 1 }),
        TaskService.getTasks({ status: 'failed', pageSize: 1 })
      ]);

      res.json({
        success: true,
        data: {
          pending: pending.total,
          running: running.total,
          success: success.total,
          failed: failed.total,
          total: pending.total + running.total + success.total + failed.total
        }
      });
    } catch (error) {
      console.error('获取任务统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取任务统计失败',
        error: error.message
      });
    }
  }

  /**
   * 清理旧任务
   */
  static async cleanupOldTasks(req, res) {
    try {
      const { days = 30 } = req.body;
      const deletedCount = await TaskService.cleanupOldTasks(parseInt(days));

      res.json({
        success: true,
        message: `清理了${deletedCount}个旧任务`,
        data: { deletedCount }
      });
    } catch (error) {
      console.error('清理旧任务失败:', error);
      res.status(500).json({
        success: false,
        message: '清理旧任务失败',
        error: error.message
      });
    }
  }
}

module.exports = TaskController; 