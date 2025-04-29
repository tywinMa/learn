const express = require('express');
const router = express.Router();
const { Exercise, UserRecord, WrongExercise, UserPoints, sequelize } = require('../models');
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

    // 获取该单元的所有练习题
    const exercises = await Exercise.findAll({
      where: { unitId },
      attributes: ['id']
    });

    if (exercises.length === 0) {
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId} 的练习题`
      });
    }

    // 获取用户在该单元的所有答题记录
    const exerciseIds = exercises.map(ex => ex.id);
    const userRecords = await UserRecord.findAll({
      where: {
        userId,
        exerciseId: { [Op.in]: exerciseIds },
        isCorrect: true // 只计算正确的答题记录
      }
    });

    // 计算完成率和星星数
    const totalExercises = exercises.length;
    const completedExercises = userRecords.length;
    const completionRate = totalExercises > 0 ? completedExercises / totalExercises : 0;

    // 根据完成率计算星星数
    let stars = 0;
    if (completionRate >= 1) {
      stars = 3; // 全部完成，3颗星
    } else if (completionRate >= 0.7) {
      stars = 2; // 完成70%以上，2颗星
    } else if (completionRate >= 0.3) {
      stars = 1; // 完成30%以上，1颗星
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
      message: '服务器错误'
    });
  }
});

module.exports = router;
