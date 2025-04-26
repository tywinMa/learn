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
    const { userId, filterCompleted } = req.query;

    // 查询条件
    const whereClause = { unitId };

    // 如果需要过滤已完成的题目，且提供了用户ID
    if (filterCompleted === 'true' && userId) {
      // 查找用户已正确完成的练习题ID
      const completedExercises = await UserRecord.findAll({
        where: {
          userId,
          isCorrect: true
        },
        attributes: ['exerciseId'],
        raw: true
      });

      // 提取已完成的练习题ID数组
      const completedExerciseIds = completedExercises.map(record => record.exerciseId);

      // 如果有已完成的练习题，则排除它们
      if (completedExerciseIds.length > 0) {
        whereClause.id = {
          [Op.notIn]: completedExerciseIds
        };
      }
    }

    // 查询练习题
    const exercises = await Exercise.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });

    if (exercises.length === 0) {
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId} 的练习题`
      });
    }

    res.json({
      success: true,
      data: exercises
    });
  } catch (error) {
    console.error('获取单元练习题出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
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
