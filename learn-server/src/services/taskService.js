const { Task } = require('../models');
const { Op } = require('sequelize');

/**
 * 任务服务类
 */
class TaskService {
  /**
   * 创建新任务
   */
  static async createTask(taskData) {
    try {
      const task = await Task.create({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...taskData,
        status: 'pending',
      });
      
      return task;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  static async updateTaskStatus(taskId, status, updates = {}) {
    try {
      const updateData = {
        status,
        ...updates
      };

      if (status === 'running' && !updates.startTime) {
        updateData.startTime = new Date();
      }

      if ((status === 'success' || status === 'failed') && !updates.endTime) {
        updateData.endTime = new Date();
      }

      await Task.update(updateData, {
        where: { id: taskId }
      });

      return await Task.findByPk(taskId);
    } catch (error) {
      console.error('更新任务状态失败:', error);
      throw error;
    }
  }

  /**
   * 设置任务结果
   */
  static async setTaskResult(taskId, result, status = 'success') {
    try {
      await Task.update({
        result,
        status,
        endTime: new Date()
      }, {
        where: { id: taskId }
      });

      return await Task.findByPk(taskId);
    } catch (error) {
      console.error('设置任务结果失败:', error);
      throw error;
    }
  }

  /**
   * 设置任务错误
   */
  static async setTaskError(taskId, error, status = 'failed') {
    try {
      await Task.update({
        error: error.message || error,
        status,
        endTime: new Date()
      }, {
        where: { id: taskId }
      });

      return await Task.findByPk(taskId);
    } catch (error) {
      console.error('设置任务错误失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务列表
   */
  static async getTasks(options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        status,
        type,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;

      const where = {};
      if (status) {
        if (Array.isArray(status)) {
          where.status = { [Op.in]: status };
        } else {
          where.status = status;
        }
      }
      if (type) {
        where.type = type;
      }

      const result = await Task.findAndCountAll({
        where,
        order: [[sortBy, sortOrder]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      return {
        tasks: result.rows,
        total: result.count,
        page,
        pageSize,
        totalPages: Math.ceil(result.count / pageSize)
      };
    } catch (error) {
      console.error('获取任务列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个任务
   */
  static async getTask(taskId) {
    try {
      return await Task.findByPk(taskId);
    } catch (error) {
      console.error('获取任务失败:', error);
      throw error;
    }
  }

  /**
   * 删除任务
   */
  static async deleteTask(taskId) {
    try {
      await Task.destroy({
        where: { id: taskId }
      });
      return true;
    } catch (error) {
      console.error('删除任务失败:', error);
      throw error;
    }
  }

  /**
   * 清理旧任务（删除指定天数前的已完成任务）
   */
  static async cleanupOldTasks(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedCount = await Task.destroy({
        where: {
          status: { [Op.in]: ['success', 'failed'] },
          endTime: { [Op.lt]: cutoffDate }
        }
      });

      console.log(`清理了${deletedCount}个旧任务`);
      return deletedCount;
    } catch (error) {
      console.error('清理旧任务失败:', error);
      throw error;
    }
  }
}

module.exports = TaskService; 