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

// 新增：根据学科和ID获取练习题（推荐使用此API）
router.get('/:subject/:unitId', async (req, res) => {
  try {
    const { subject, unitId } = req.params;
    const { userId, filterCompleted, types } = req.query;

    // 验证参数
    if (!subject || !unitId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    console.log(`获取学科 ${subject} 中单元 ${unitId} 的练习题`);

    // 构建单元ID格式（确保包含学科前缀）
    const formattedUnitId = `${subject}-${unitId}`;

    // 构建查询条件
    let whereClause = { unitId: formattedUnitId };

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
          exerciseId: { [Op.like]: `${formattedUnitId}-%` }, // 确保只获取当前单元的记录
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
      return res.status(404).json({
        success: false,
        message: `未找到学科 ${subject} 中单元 ${unitId} 的练习题`
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
      console.log(`用户 ${userId} 已完成学科 ${subject} 中单元 ${unitId} 的所有练习题`);
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

// 获取特定单元的练习题（保留向后兼容）
router.get('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { userId, filterCompleted, types } = req.query;

    console.log(`获取单元 ${unitId} 的练习题，筛选参数: 用户=${userId}, 过滤已完成=${filterCompleted}, 题型=${types}`);

    // 查询条件 - 基于unitId构建灵活的查询条件
    let whereClause = {};
    const parts = unitId.split('-');

    // 处理不同格式的单元ID
    if (parts.length === 2) {
      // 格式为 "1-1"，需要匹配可能的所有格式：精确匹配和带主题前缀的 "math-1-1" 等
      console.log(`检测到简短单元ID格式: ${unitId}，尝试匹配所有可能的单元格式`);
      whereClause[Op.or] = [
        { unitId }, // 精确匹配 "1-1"
        { unitId: { [Op.like]: `%-${unitId}` } }, // 匹配 "math-1-1" 等带前缀的格式
        { unitId: { [Op.like]: `%-${parts[0]}-%` } } // 匹配相同章节的其他单元，如 "math-1-x"
      ];
    } else if (parts.length === 3) {
      // 格式为 "math-1-1"，直接使用精确匹配
      console.log(`检测到完整单元ID格式: ${unitId}，使用精确匹配`);
      whereClause.unitId = unitId;

      // 同时获取与该单元相关的其他题目
      whereClause[Op.or] = [
        { unitId }, // 精确匹配 "math-1-1"
        { unitId: { [Op.like]: `${parts[0]}-${parts[1]}-%` } }, // 匹配相同章节的单元，如 "math-1-x"
        { id: { [Op.like]: `${unitId}-%` } } // 匹配ID以该单元开头的题目
      ];
    } else {
      // 其他格式直接使用精确匹配
      whereClause.unitId = unitId;
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
