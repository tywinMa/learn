const express = require('express');
const router = express.Router();
const { Exercise, AnswerRecord, sequelize } = require('../models');
const { Op } = require('sequelize');

// 获取所有包含练习题的单元ID列表
router.get('/', async (req, res) => {
  try {
    const unitIds = await Exercise.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('unitId')), 'unitId']],
      raw: true
    });

    res.json({
      success: true,
      data: unitIds.map(item => item.unitId)
    });
  } catch (error) {
    console.error('获取单元ID列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定单元的练习题 (推荐API)
router.get('/:subject/:unitId', async (req, res) => {
  try {
    const { subject, unitId } = req.params;
    const { userId, filterCompleted, types } = req.query;

    // 构建完整的单元ID (包含学科前缀)
    const fullUnitId = `${subject}-${unitId}`;

    // 构建查询条件
    const whereClause = { unitId: fullUnitId };

    // 如果指定了题型，添加类型过滤
    if (types) {
      const typeArray = types.split(',').map(t => t.trim());
      whereClause.type = { [Op.in]: typeArray };
    }

    // 获取练习题
    const exercises = await Exercise.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });

    if (exercises.length === 0) {
      return res.json({
        success: true,
        data: [],
        allCompleted: false,
        typeStats: {}
      });
    }

    let processedExercises = exercises;

    // 如果提供了用户ID，标记已完成的题目
    if (userId) {
      const exerciseIds = exercises.map(ex => ex.id);
      
      // 使用AnswerRecord查询已完成的题目
      const completedExercises = await AnswerRecord.findAll({
        where: {
          userId,
          exerciseId: { [Op.in]: exerciseIds },
          isCorrect: true
        },
        attributes: ['exerciseId'],
        raw: true
      });

      const completedIds = new Set(completedExercises.map(record => record.exerciseId));

      // 标记已完成的题目
      processedExercises = exercises.map(exercise => {
        const exerciseData = exercise.toJSON();
        exerciseData.completed = completedIds.has(exercise.id);

        // 对特定题型的正确答案进行处理
        if (!exerciseData.completed) {
          // 匹配题的匹配项是固定的，用户无法从选项推断正确答案，所以可以安全暴露
          if (exercise.type === 'application') {
            exerciseData.correctAnswer = null;
          } else if (exercise.type === 'math') {
            exerciseData.correctAnswer = null;
          }
          // 不再隐藏匹配题的正确答案
        }

        return exerciseData;
      });

      // 如果需要过滤已完成的题目
      if (filterCompleted === 'true') {
        processedExercises = processedExercises.filter(ex => !ex.completed);
      }
    }

    // 计算统计信息
    const allCompleted = userId ? processedExercises.length === 0 && exercises.length > 0 : false;

    // 按题型统计
    const typeStats = {};
    exercises.forEach(ex => {
      if (!typeStats[ex.type]) {
        typeStats[ex.type] = { total: 0, completed: 0 };
      }
      typeStats[ex.type].total++;
      
      if (userId) {
        const processedEx = processedExercises.find(pex => pex.id === ex.id);
        if (processedEx && processedEx.completed) {
          typeStats[ex.type].completed++;
        }
      }
    });

    res.json({
      success: true,
      data: processedExercises,
      allCompleted,
      typeStats
    });

  } catch (error) {
    console.error('获取练习题出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定单元的练习题 (兼容API)
router.get('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { userId, filterCompleted, types } = req.query;

    // 构建查询条件
    const whereClause = { unitId };

    // 如果指定了题型，添加类型过滤
    if (types) {
      const typeArray = types.split(',').map(t => t.trim());
      whereClause.type = { [Op.in]: typeArray };
    }

    // 获取练习题
    const exercises = await Exercise.findAll({
      where: whereClause,
      order: [['id', 'ASC']]
    });

    if (exercises.length === 0) {
      return res.json({
        success: true,
        data: [],
        allCompleted: false,
        typeStats: {}
      });
    }

    let processedExercises = exercises;

    // 如果提供了用户ID，标记已完成的题目
    if (userId) {
      const exerciseIds = exercises.map(ex => ex.id);
      
      // 使用AnswerRecord查询已完成的题目
      const completedExercises = await AnswerRecord.findAll({
        where: {
          userId,
          exerciseId: { [Op.in]: exerciseIds },
          isCorrect: true
        },
        attributes: ['exerciseId'],
        raw: true
      });

      const completedIds = new Set(completedExercises.map(record => record.exerciseId));

      // 标记已完成的题目
      processedExercises = exercises.map(exercise => {
        const exerciseData = exercise.toJSON();
        exerciseData.completed = completedIds.has(exercise.id);

        // 对特定题型的正确答案进行处理
        if (!exerciseData.completed) {
          // 匹配题的匹配项是固定的，用户无法从选项推断正确答案，所以可以安全暴露
          if (exercise.type === 'application') {
            exerciseData.correctAnswer = null;
          } else if (exercise.type === 'math') {
            exerciseData.correctAnswer = null;
          }
          // 不再隐藏匹配题的正确答案
        }

        return exerciseData;
      });

      // 如果需要过滤已完成的题目
      if (filterCompleted === 'true') {
        processedExercises = processedExercises.filter(ex => !ex.completed);
      }
    }

    // 计算统计信息
    const allCompleted = userId ? processedExercises.length === 0 && exercises.length > 0 : false;

    // 按题型统计
    const typeStats = {};
    exercises.forEach(ex => {
      if (!typeStats[ex.type]) {
        typeStats[ex.type] = { total: 0, completed: 0 };
      }
      typeStats[ex.type].total++;
      
      if (userId) {
        const processedEx = processedExercises.find(pex => pex.id === ex.id);
        if (processedEx && processedEx.completed) {
          typeStats[ex.type].completed++;
        }
      }
    });

    res.json({
      success: true,
      data: processedExercises,
      allCompleted,
      typeStats
    });

  } catch (error) {
    console.error('获取练习题出错:', error);
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
