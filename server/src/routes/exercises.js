const express = require('express');
const router = express.Router();
const { Exercise, UserRecord, sequelize } = require('../models');
const { Op } = require('sequelize');

// 获取所有练习题单元
router.get('/', async (req, res) => {
  try {
    // 从数据库中获取所有不同的unitId
    const units = await Exercise.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('unitId')), 'unitId']],
      raw: true
    });

    // 提取unitId数组
    const unitIds = units.map(unit => unit.unitId);

    res.json({
      success: true,
      data: unitIds
    });
  } catch (error) {
    console.error('获取练习题单元出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定单元的练习题
router.get('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { userId, filterCompleted, types } = req.query;

    console.log(`获取单元 ${unitId} 的练习题，筛选参数: 用户=${userId}, 过滤已完成=${filterCompleted}, 题型=${types}`);

    // 查询条件
    const whereClause = { unitId };
    
    // 支持获取子单元习题 (如1-1-1开头的应用题)
    if (unitId.split('-').length === 3) {
      // 如果是子单元ID (如1-1-1)，使用前缀匹配查询
      console.log(`检测到子单元ID: ${unitId}，使用前缀匹配查询`);
      // 使用OR条件，同时获取直接属于该单元的题目和前缀匹配的题目
      whereClause[Op.or] = [
        { unitId }, // 精确匹配unitId
        { id: { [Op.like]: `${unitId}-%` } } // ID前缀匹配
      ];
      delete whereClause.unitId; // 删除原始条件，避免冲突
    } else if (unitId.split('-').length === 2) {
      // 如果是主单元ID (如1-1)，也需要获取其子单元的题目
      console.log(`主单元ID: ${unitId}，同时获取子单元题目`);
      whereClause[Op.or] = [
        { unitId }, // 精确匹配unitId
        { unitId: { [Op.like]: `${unitId}-%` } } // unitId前缀匹配（获取子单元的题目）
      ];
      delete whereClause.unitId; // 删除原始条件，避免冲突
    }

    // 根据题型筛选
    if (types) {
      const typesList = types.split(',');
      if (typesList.length > 0) {
        whereClause.type = {
          [Op.in]: typesList
        };
      }
    }

    // 如果需要过滤已完成的题目，且提供了用户ID
    let completedExerciseIds = [];
    if (userId) {
      // 查找用户已正确完成的练习题ID
      const completedExercises = await UserRecord.findAll({
        where: {
          userId,
          exerciseId: { [Op.like]: `${unitId}-%` }, // 确保只获取当前单元的记录
          isCorrect: true
        },
        attributes: ['exerciseId'],
        raw: true
      });

      // 提取已完成的练习题ID数组
      completedExerciseIds = completedExercises.map(record => record.exerciseId);
      console.log(`用户 ${userId} 已完成的练习题: ${completedExerciseIds.join(', ') || '无'}`);
    }

    // 查询练习题
    const exercises = await Exercise.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });

    console.log(`找到 ${exercises.length} 道练习题`);

    if (exercises.length === 0) {
      console.log(`未找到单元 ${unitId} 的练习题`);
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId} 的练习题`
      });
    }

    // 处理附加信息，格式化返回数据
    const formattedExercises = exercises.map(ex => {
      // 创建基本题目对象
      const exercise = ex.toJSON();
      
      // 添加是否已完成标志
      exercise.completed = completedExerciseIds.includes(ex.id);
      
      // 处理不同题型的特殊格式化
      switch (exercise.type) {
        case 'matching':
          // 匹配题需要在前端才能看到正确答案
          if (!exercise.completed) {
            exercise.correctAnswer = null;
          }
          break;
        case 'application':
          // 应用题总是隐藏正确答案，因为需要老师批改
          exercise.correctAnswer = null;
          break;
        case 'math':
          // 数学题型保留正确答案的值，但隐藏解题步骤
          if (!exercise.completed && exercise.correctAnswer && exercise.correctAnswer.steps) {
            exercise.correctAnswer = { value: exercise.correctAnswer.value };
          }
          break;
      }
      
      return exercise;
    });

    // 检查是否所有题目都已完成
    const allCompleted = exercises.length > 0 && 
                         completedExerciseIds.length >= exercises.length && 
                         exercises.every(ex => completedExerciseIds.includes(ex.id));

    // 如果所有题目都已完成且需要过滤已完成的题目
    if (allCompleted && filterCompleted === 'true') {
      console.log(`用户 ${userId} 已完成单元 ${unitId} 的所有练习题`);
      return res.status(200).json({
        success: true,
        data: [],
        message: '所有练习题已完成',
        allCompleted: true
      });
    }

    // 如果需要过滤已完成的题目
    let filteredExercises = formattedExercises;
    if (filterCompleted === 'true' && completedExerciseIds.length > 0) {
      filteredExercises = formattedExercises.filter(ex => !completedExerciseIds.includes(ex.id));
      console.log(`过滤后剩余 ${filteredExercises.length} 道练习题`);
    }

    // 获取题型统计信息
    const typeStats = {};
    exercises.forEach(ex => {
      const type = ex.type || 'choice';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: filteredExercises,
      allCompleted: allCompleted,
      typeStats: typeStats
    });
  } catch (error) {
    console.error('获取单元练习题出错:', error);
    res.status(500).json({
      success: false,
      message: '获取练习题时发生服务器错误',
      error: error.message
    });
  }
});

// 获取特定练习题
router.get('/:unitId/:exerciseId', async (req, res) => {
  try {
    const { unitId, exerciseId } = req.params;

    const exercise = await Exercise.findOne({
      where: {
        id: exerciseId,
        unitId
      }
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: `未找到练习题 ${exerciseId}`
      });
    }

    res.json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('获取练习题出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
