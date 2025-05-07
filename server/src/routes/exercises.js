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

    console.log(`获取单元 ${unitId} 的练习题，筛选参数: 用户=${userId}, 过滤已完成=${filterCompleted}`);

    // 查询条件
    const whereClause = { unitId };

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
    let filteredExercises = exercises;
    if (filterCompleted === 'true' && completedExerciseIds.length > 0) {
      filteredExercises = exercises.filter(ex => !completedExerciseIds.includes(ex.id));
      console.log(`过滤后剩余 ${filteredExercises.length} 道练习题`);
    }

    res.json({
      success: true,
      data: filteredExercises,
      allCompleted: allCompleted
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
