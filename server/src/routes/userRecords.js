const express = require('express');
const router = express.Router();
const { Exercise, UserRecord, WrongExercise, UserPoints, sequelize, UnitProgress } = require('../models');
const { Op } = require('sequelize');

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

// 获取用户在特定单元的完成情况
router.get('/:userId/progress/:unitId', async (req, res) => {
  try {
    const { userId, unitId } = req.params;

    console.log(`获取用户 ${userId} 在单元 ${unitId} 的进度`);

    // 假定unitId已包含学科前缀，直接使用精确匹配
    const whereClause = { unitId };

    // 获取该单元的所有练习题
    const exercises = await Exercise.findAll({
      where: whereClause,
      attributes: ['id']
    });

    if (exercises.length === 0) {
      console.warn(`未找到单元 ${unitId} 的练习题`);
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId} 的练习题`
      });
    }

    // 获取用户在该单元的所有答题记录
    const exerciseIds = exercises.map(ex => ex.id);
    console.log(`单元 ${unitId} 包含 ${exerciseIds.length} 道练习题: ${exerciseIds.join(', ')}`);

    const userRecords = await UserRecord.findAll({
      where: {
        userId,
        exerciseId: { [Op.in]: exerciseIds },
        isCorrect: true // 只计算正确的答题记录
      }
    });

    console.log(`用户 ${userId} 完成了 ${userRecords.length} 道练习题`);

    // 计算完成率和星星数
    const totalExercises = exercises.length;
    const completedExercises = userRecords.length;
    const completionRate = totalExercises > 0 ? completedExercises / totalExercises : 0;

    // 根据完成率计算星星数
    let stars = 0;
    if (completionRate >= 0.8) {
      stars = 3; // 完成80%以上，3颗星
    } else if (completionRate >= 0.6) {
      stars = 2; // 完成60%以上，2颗星
    } else if (completionRate > 0) {
      stars = 1; // 只要完成了题目，至少1颗星
    }

    // 判断是否解锁下一个单元
    const unlockNext = stars === 3;

    res.json({
      success: true,
      data: {
        unitId,
        totalExercises,
        completedExercises,
        completionRate,
        stars,
        unlockNext
      }
    });
  } catch (error) {
    console.error('获取用户进度出错:', error);
    res.status(500).json({
      success: false,
      message: '获取用户进度失败，可能是数据库有问题',
      error: error.message
    });
  }
});

// 强制更新用户在特定单元的完成进度
router.post('/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const { unitId, completed = true } = req.body;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    console.log(`强制刷新用户 ${userId} 在单元 ${unitId} 的进度`);

    // 假定unitId已包含学科前缀，直接使用精确匹配
    const whereClause = { unitId };

    // 获取该单元的所有练习题
    const exercises = await Exercise.findAll({
      where: whereClause,
      attributes: ['id']
    });

    if (exercises.length === 0) {
      console.warn(`未找到单元 ${unitId} 的练习题`);
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId} 的练习题`
      });
    }

    // 获取用户在该单元的所有答题记录
    const exerciseIds = exercises.map(ex => ex.id);

    // 查询用户已完成的练习题
    const userRecords = await UserRecord.findAll({
      where: {
        userId,
        exerciseId: { [Op.in]: exerciseIds }
      }
    });

    // 对于没有记录的题目，创建正确的记录
    const completedExerciseIds = userRecords.map(record => record.exerciseId);
    const missingExerciseIds = exerciseIds.filter(id => !completedExerciseIds.includes(id));

    console.log(`单元 ${unitId} 需要补充 ${missingExerciseIds.length} 道练习题记录`);

    // 添加缺失的记录
    if (missingExerciseIds.length > 0) {
      // 获取每个练习题的subject值
      const exerciseDetails = await Exercise.findAll({
        where: { id: { [Op.in]: missingExerciseIds } },
        attributes: ['id', 'subject']
      });

      // 创建ID到subject的映射
      const exerciseSubjectMap = {};
      exerciseDetails.forEach(ex => {
        exerciseSubjectMap[ex.id] = ex.subject;
      });

      const recordsToCreate = missingExerciseIds.map(exerciseId => ({
        userId,
        exerciseId,
        unitId,
        subject: exerciseSubjectMap[exerciseId] || unitId.split('-')[0], // 从映射获取subject，或从unitId推断
        isCorrect: true,
        attemptCount: 1
      }));

      await UserRecord.bulkCreate(recordsToCreate);
      console.log(`为用户 ${userId} 创建了 ${recordsToCreate.length} 条答题记录`);
    }

    // 确保所有记录都标记为正确
    for (const record of userRecords) {
      if (!record.isCorrect) {
        record.isCorrect = true;
        await record.save();
        console.log(`更新记录 ${record.id} 为正确`);
      }
    }

    // 返回最新的进度信息
    const totalExercises = exercises.length;
    const completionRate = 1.0; // 100% 完成
    const stars = 3; // 全部完成，3颗星
    const unlockNext = true;

    res.json({
      success: true,
      data: {
        unitId,
        totalExercises,
        completedExercises: totalExercises,
        completionRate,
        stars,
        unlockNext
      },
      message: '进度已强制更新为完成状态'
    });
  } catch (error) {
    console.error('强制刷新用户进度出错:', error);
    res.status(500).json({
      success: false,
      message: '刷新用户进度失败',
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

module.exports = router;
