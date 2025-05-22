const express = require('express');
const router = express.Router();
const { Exercise, UserRecord, WrongExercise, UserPoints, sequelize, Unit, UnitProgress } = require('../models');
const { Op } = require('sequelize');

// Helper function to get progress details for a single unit
async function getUnitProgressDetails(userId, unitId) {
  // 1. Check UnitProgress table first
  const unitProgressEntry = await UnitProgress.findOne({ where: { userId, unitId } });

  if (unitProgressEntry && unitProgressEntry.completed) {
    const exercisesInUnit = await Exercise.count({ where: { unitId } });
    const unlockNextStatus = unitProgressEntry.stars === 3;

    console.log(`[Progress Details] From UnitProgress: ${unitId}, Stars: ${unitProgressEntry.stars}, Completed: ${unitProgressEntry.completed}`);
    return {
      unitId,
      totalExercises: exercisesInUnit,
      completedExercises: (unitProgressEntry.stars > 0 && exercisesInUnit > 0) ? exercisesInUnit : 0,
      completionRate: (unitProgressEntry.stars > 0 && exercisesInUnit > 0) ? 1.0 : 0,
      stars: unitProgressEntry.stars,
      unlockNext: unlockNextStatus,
      completed: unitProgressEntry.completed, // Ensure completed status is from UnitProgress
      studyCount: unitProgressEntry.studyCount || 0, // 添加学习次数
      practiceCount: unitProgressEntry.practiceCount || 0, // 添加练习次数
      source: 'UnitProgressTable'
    };
  }

  // 2. If not in UnitProgress or not marked as completed there, fallback to UserRecord-based calculation
  console.log(`[Progress Details] UnitProgress miss or not completed for ${unitId}, falling back to UserRecord calc`);
  const exercises = await Exercise.findAll({
    where: { unitId },
    attributes: ['id']
  });

  if (exercises.length === 0) {
    // No exercises means we can't calculate progress based on them.
    // If there was no UnitProgress entry, this unit effectively has no progress.
    console.warn(`[Progress Details] No exercises found for unit ${unitId}, returning default empty progress.`);
    return {
      unitId,
      totalExercises: 0,
      completedExercises: 0,
      completionRate: 0,
      stars: 0,
      unlockNext: false,
      completed: false, // Not in UnitProgress and no exercises to base completion on
      studyCount: 0, // 没有记录时默认为0
      practiceCount: 0, // 没有记录时默认为0
      source: 'NoDataOrNoExercises'
    };
  }

  const exerciseIds = exercises.map(ex => ex.id);
  const userRecords = await UserRecord.findAll({
    where: {
      userId,
      exerciseId: { [Op.in]: exerciseIds },
      isCorrect: true
    }
  });

  const totalExercises = exercises.length;
  const completedExercises = userRecords.length;
  const completionRate = totalExercises > 0 ? completedExercises / totalExercises : 0;

  let stars = 0;
  if (completionRate >= 0.8) stars = 3;
  else if (completionRate >= 0.6) stars = 2;
  else if (completionRate > 0) stars = 1;

  const unlockNext = stars === 3;
  const calculatedCompleted = stars > 0; // Or based on a more specific logic if needed

  // 获取学习和练习次数（如果UnitProgress存在）
  const studyPracticeCount = unitProgressEntry 
    ? { studyCount: unitProgressEntry.studyCount || 0, practiceCount: unitProgressEntry.practiceCount || 0 } 
    : { studyCount: 0, practiceCount: 0 };

  console.log(`[Progress Details] From UserRecord calc for ${unitId}: Stars: ${stars}, Completed: ${calculatedCompleted}`);
  return {
    unitId,
    totalExercises,
    completedExercises,
    completionRate,
    stars,
    unlockNext,
    completed: calculatedCompleted,
    studyCount: studyPracticeCount.studyCount, // 添加学习次数
    practiceCount: studyPracticeCount.practiceCount, // 添加练习次数
    source: 'UserRecordCalculation'
  };
}

// 获取用户的所有答题记录
router.get('/:userId/records', async (req, res) => {
  try {
    const { userId } = req.params;

    const records = await UserRecord.findAll({
      where: { userId },
      include: [{ model: Exercise }],
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('获取用户答题记录出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 提交用户的答题结果
router.post('/:userId/submit', async (req, res) => {
  try {
    const { userId } = req.params;
    const { exerciseId, unitId, isCorrect } = req.body;

    if (!exerciseId || !unitId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 查找练习题
    const exercise = await Exercise.findOne({
      where: { id: exerciseId, unitId }
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: '未找到该练习题'
      });
    }

    // 查找或创建用户记录
    const [record, created] = await UserRecord.findOrCreate({
      where: { userId, exerciseId },
      defaults: {
        unitId,
        subject: exercise.subject, // 从练习题获取subject值
        isCorrect,
        attemptCount: 1
      }
    });

    // 如果记录已存在，更新它
    if (!created) {
      record.isCorrect = isCorrect;
      record.attemptCount += 1;
      await record.save();
    }

    // 如果答错了，添加到错题本
    if (!isCorrect) {
      // 查找或创建错题记录
      const [wrongExercise, wrongCreated] = await WrongExercise.findOrCreate({
        where: { userId, exerciseId },
        defaults: {
          unitId,
          subject: exercise.subject, // 从练习题获取subject值
          attempts: 1
        }
      });

      // 如果记录已存在，更新尝试次数
      if (!wrongCreated) {
        wrongExercise.attempts += 1;
        await wrongExercise.save();
      }
    } else {
      // 如果答对了，从错题本中移除（如果存在）
      await WrongExercise.destroy({
        where: { userId, exerciseId }
      });

      // 如果答对了，增加积分（每道题1积分）
      // 只有第一次答对才增加积分，避免刷积分
      if (created || (record.attemptCount === 1 && !record.isCorrect && isCorrect)) {
        // 查找或创建用户积分记录
        const [userPoints, pointsCreated] = await UserPoints.findOrCreate({
          where: { userId },
          defaults: {
            points: 1 // 初始积分为1（第一次答对）
          }
        });

        // 如果积分记录已存在，增加1积分
        if (!pointsCreated) {
          userPoints.points += 1;
          await userPoints.save();
        }
      }
    }

    res.json({
      success: true,
      message: '答题结果已记录'
    });
  } catch (error) {
    console.error('提交答题结果出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取用户的错题本
router.get('/:userId/wrong-exercises', async (req, res) => {
  try {
    const { userId } = req.params;

    // 查询错题记录，并包含练习题详情
    const wrongExercises = await WrongExercise.findAll({
      where: { userId },
      include: [{ model: Exercise }],
      order: [['updatedAt', 'DESC']]
    });

    // 格式化返回数据，与前端期望的格式保持一致
    const formattedData = wrongExercises
      .filter(wrong => wrong.Exercise) // 过滤掉没有关联练习题的记录
      .map(wrong => ({
        exerciseData: wrong.Exercise,
        unitId: wrong.unitId,
        attempts: wrong.attempts,
        timestamp: wrong.updatedAt.getTime()
      }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('获取错题本出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 从错题本中删除一道题
router.delete('/:userId/wrong-exercises/:exerciseId', async (req, res) => {
  try {
    const { userId, exerciseId } = req.params;

    // 查找错题记录
    const wrongExercise = await WrongExercise.findOne({
      where: { userId, exerciseId }
    });

    if (!wrongExercise) {
      return res.status(404).json({
        success: false,
        message: '未找到该错题'
      });
    }

    // 删除错题记录
    await wrongExercise.destroy();

    res.json({
      success: true,
      message: '已从错题本中删除'
    });
  } catch (error) {
    console.error('删除错题出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// GET user progress for a specific unit (refactored to use the helper)
router.get('/:userId/progress/:unitId', async (req, res) => {
  try {
    const { userId, unitId } = req.params;
    console.log(`API: GET /:userId/progress/:unitId - User: ${userId}, Unit: ${unitId}`);

    const progressData = await getUnitProgressDetails(userId, unitId);

    if (progressData.source === 'NoDataOrNoExercises' && progressData.totalExercises === 0) {
      // Optionally, you could return 404 if unitId itself is invalid / has no exercises at all
      // For now, returning the default empty progress is consistent.
    }

    res.json({
      success: true,
      data: progressData
    });
  } catch (error) {
    console.error(`Error in GET /:userId/progress/:unitId for unit ${req.params.unitId}:`, error);
    res.status(500).json({
      success: false,
      message: '获取用户单元进度失败',
      error: error.message
    });
  }
});

// NEW: POST route for batch fetching unit progress
router.post('/:userId/progress/batch', async (req, res) => {
  try {
    const { userId } = req.params;
    const { unitIds } = req.body;

    console.log(`API: POST /:userId/progress/batch - User: ${userId}, Unit Count: ${unitIds ? unitIds.length : 0}`);

    if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请求体中必须包含一个非空的 unitIds 数组。'
      });
    }

    // Limit batch size to prevent abuse or performance issues, e.g., 100 units at a time
    const MAX_BATCH_SIZE = 100;
    if (unitIds.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        success: false,
        message: `批量请求的单元数量不能超过 ${MAX_BATCH_SIZE}。`
      });
    }

    const results = {};
    // Consider Promise.all for parallel fetching if getUnitProgressDetails is I/O bound and can run in parallel.
    // For now, sequential to be safe and simple. If DB queries are heavy, parallel might be better.
    for (const unitId of unitIds) {
      if (typeof unitId !== 'string' || unitId.trim() === '') {
        console.warn(`[Batch Progress] Invalid unitId found: '${unitId}', skipping.`);
        results[unitId] = { // Provide a consistent error structure for this ID
          unitId,
          error: 'Invalid unitId provided',
          source: 'BatchRequestError'
        };
        continue;
      }
      try {
        results[unitId] = await getUnitProgressDetails(userId, unitId);
      } catch (error) {
        console.error(`[Batch Progress] Error fetching progress for unit ${unitId}:`, error.message);
        results[unitId] = {
          unitId,
          error: error.message || 'Failed to fetch progress for this unit',
          stars: 0, // Default error state
          completed: false,
          source: 'BatchUnitError'
        };
      }
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error in POST /:userId/progress/batch:', error);
    res.status(500).json({
      success: false,
      message: '批量获取用户进度失败',
      error: error.message
    });
  }
});

// 获取用户在特定学科的所有单元进度
router.get('/:userId/subject/:subject/progress', async (req, res) => {
  try {
    const { userId, subject } = req.params;

    console.log(`获取用户 ${userId} 在学科 ${subject} 的所有单元进度`);

    // 查询用户完成的练习题记录
    const userRecords = await UserRecord.findAll({
      where: {
        userId,
        unitId: { [Op.like]: `${subject}-%` } // 只获取指定学科的记录
      },
      include: [{ model: Exercise }],
      order: [['updatedAt', 'DESC']]
    });

    // 按单元ID分组
    const unitProgress = {};
    userRecords.forEach(record => {
      const { unitId, exerciseId, isCorrect } = record;

      if (!unitProgress[unitId]) {
        unitProgress[unitId] = {
          unitId,
          totalExercises: 0,
          completedExercises: 0,
          correctExercises: 0,
          stars: 0
        };
      }

      unitProgress[unitId].totalExercises += 1;
      if (isCorrect) {
        unitProgress[unitId].correctExercises += 1;
      }
      unitProgress[unitId].completedExercises += 1;
    });

    // 计算每个单元的星星数
    Object.keys(unitProgress).forEach(unitId => {
      const progress = unitProgress[unitId];
      const percentCorrect = (progress.correctExercises / progress.totalExercises) * 100;

      // 根据正确率计算星星
      if (percentCorrect >= 90) {
        progress.stars = 3;
      } else if (percentCorrect >= 70) {
        progress.stars = 2;
      } else if (percentCorrect >= 50) {
        progress.stars = 1;
      }
    });

    res.json({
      success: true,
      data: Object.values(unitProgress)
    });
  } catch (error) {
    console.error(`获取学科 ${req.params.subject} 进度出错:`, error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 标记用户完成单元
router.post('/:userId/complete-unit/:unitId', async (req, res) => {
  try {
    const { userId, unitId } = req.params;
    console.log(`标记用户 ${userId} 完成单元 ${unitId}`);

    // 更新或创建UnitProgress记录
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { userId, unitId },
      defaults: {
        completed: true,
        completedAt: new Date(),
        stars: req.body.stars || 3 // 默认三星
      }
    });

    if (!created) {
      // 如果记录已存在，更新它
      unitProgress.completed = true;
      unitProgress.completedAt = new Date();
      unitProgress.stars = req.body.stars || unitProgress.stars;
      await unitProgress.save();
    }

    // 增加用户积分奖励
    const starsToPoints = {
      1: 5,
      2: 10,
      3: 15
    };
    const pointsToAdd = starsToPoints[unitProgress.stars] || 0;

    if (pointsToAdd > 0) {
      const [userPoints, pointsCreated] = await UserPoints.findOrCreate({
        where: { userId },
        defaults: { points: pointsToAdd }
      });

      if (!pointsCreated) {
        // 如果积分记录已存在，增加相应积分
        userPoints.points += pointsToAdd;
        await userPoints.save();
      }
    }

    // 不再使用额外的查询，直接返回成功
    res.json({
      success: true,
      message: `已标记完成单元 ${unitId}`,
      data: {
        unitId,
        stars: unitProgress.stars,
        completedAt: unitProgress.completedAt,
        pointsAdded: pointsToAdd
      }
    });
  } catch (error) {
    console.error('标记完成单元出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 增加用户学习单元的次数
router.post('/:userId/increment-study/:unitId', async (req, res) => {
  try {
    const { userId, unitId } = req.params;
    console.log(`增加用户 ${userId} 对单元 ${unitId} 的学习次数`);

    // 查找或创建UnitProgress记录
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { userId, unitId },
      defaults: {
        studyCount: 1, // 如果是新记录，初始化为1
        practiceCount: 0,
        completed: false,
        stars: 0
      }
    });

    if (!created) {
      // 如果记录已存在，增加学习次数
      unitProgress.studyCount += 1;
      await unitProgress.save();
    }

    res.json({
      success: true,
      message: `单元 ${unitId} 的学习次数已增加`,
      data: {
        unitId,
        studyCount: unitProgress.studyCount
      }
    });
  } catch (error) {
    console.error('增加学习次数出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 增加用户练习单元的次数
router.post('/:userId/increment-practice/:unitId', async (req, res) => {
  try {
    const { userId, unitId } = req.params;
    console.log(`增加用户 ${userId} 对单元 ${unitId} 的练习次数`);

    // 查找或创建UnitProgress记录
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { userId, unitId },
      defaults: {
        studyCount: 0,
        practiceCount: 1, // 如果是新记录，初始化为1
        completed: false,
        stars: 0
      }
    });

    if (!created) {
      // 如果记录已存在，增加练习次数
      unitProgress.practiceCount += 1;
      await unitProgress.save();
    }

    res.json({
      success: true,
      message: `单元 ${unitId} 的练习次数已增加`,
      data: {
        unitId,
        practiceCount: unitProgress.practiceCount
      }
    });
  } catch (error) {
    console.error('增加练习次数出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;