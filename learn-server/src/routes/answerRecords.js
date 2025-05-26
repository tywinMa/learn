const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const AnswerRecordService = require('../services/answerRecordService');
const { AnswerRecord, Exercise, UnitProgress, Student, sequelize } = require('../models');

/**
 * 提交答题记录 - 新版本，使用AnswerRecord
 * POST /api/answer-records/:studentId/submit
 */
router.post('/:studentId/submit', async (req, res) => {
  try {
    const { studentId } = req.params;
    const answerData = {
      userId: studentId, // AnswerRecordService中的参数仍然叫userId
      ...req.body
    };

    console.log('提交答题记录:', answerData);

    const result = await AnswerRecordService.submitAnswer(answerData);

    res.json(result);
  } catch (error) {
    console.error('提交答题记录失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

/**
 * 获取学生错题列表 - 新版本
 * GET /api/answer-records/:studentId/wrong-exercises
 */
router.get('/:studentId/wrong-exercises', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject, unitId, exerciseType } = req.query;

    const filters = {};
    if (subject) filters.subject = subject;
    if (unitId) filters.unitId = unitId;
    if (exerciseType) filters.exerciseType = exerciseType;

    const wrongAnswers = await AnswerRecordService.getWrongAnswers(studentId, filters);

    res.json({
      success: true,
      data: wrongAnswers
    });
  } catch (error) {
    console.error('获取错题列表失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 从错题本移除题目 - 新版本
 * DELETE /api/answer-records/:studentId/wrong-exercises/:exerciseId
 */
router.delete('/:studentId/wrong-exercises/:exerciseId', async (req, res) => {
  try {
    const { studentId, exerciseId } = req.params;

    const result = await AnswerRecordService.removeFromWrongAnswers(studentId, exerciseId);

    res.json({
      success: true,
      message: '已从错题本中移除',
      data: result.data
    });
  } catch (error) {
    console.error('移除错题失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '服务器错误'
    });
  }
});

/**
 * 获取学生学习统计
 * GET /api/answer-records/:studentId/stats
 */
router.get('/:studentId/stats', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { timeRange = 30 } = req.query;

    const stats = await AnswerRecordService.getStudentLearningStats(studentId, parseInt(timeRange));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取学习统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 获取学习模式分析
 * GET /api/answer-records/:studentId/pattern-analysis
 */
router.get('/:studentId/pattern-analysis', async (req, res) => {
  try {
    const { studentId } = req.params;

    const analysis = await AnswerRecordService.getLearningPatternAnalysis(studentId);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('获取学习模式分析失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 获取学生答题历史
 * GET /api/answer-records/:studentId/history
 */
router.get('/:studentId/history', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { 
      subject, 
      unitId, 
      exerciseType, 
      isCorrect, 
      practiceMode,
      limit = 50,
      offset = 0 
    } = req.query;

    const whereClause = { studentId };
    
    if (subject) whereClause.subject = subject;
    if (unitId) whereClause.unitId = unitId;
    if (exerciseType) whereClause.exerciseType = exerciseType;
    if (isCorrect !== undefined) whereClause.isCorrect = isCorrect === 'true';
    if (practiceMode) whereClause.practiceMode = practiceMode;

    const records = await AnswerRecord.findAll({
      where: whereClause,
      include: [{ 
        model: Exercise,
        attributes: ['id', 'question', 'type', 'subject']
      }],
      order: [['submitTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await AnswerRecord.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < totalCount
        }
      }
    });
  } catch (error) {
    console.error('获取答题历史失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 获取答题详细分析
 * GET /api/answer-records/:studentId/detailed-analysis
 */
router.get('/:studentId/detailed-analysis', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject, timeRange = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    const whereClause = {
      studentId,
      submitTime: {
        [Op.gte]: startDate
      }
    };

    if (subject) {
      whereClause.subject = subject;
    }

    // 基础统计
    const totalAnswers = await AnswerRecord.count({ where: whereClause });
    const correctAnswers = await AnswerRecord.count({ 
      where: { ...whereClause, isCorrect: true } 
    });
    const wrongAnswers = await AnswerRecord.count({ 
      where: { ...whereClause, isCorrect: false } 
    });

    // 按题型统计
    const typeStats = await AnswerRecord.findAll({
      where: whereClause,
      attributes: [
        'exerciseType',
        [sequelize.fn('COUNT', '*'), 'total'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isCorrect THEN 1 ELSE 0 END')), 'correct']
      ],
      group: ['exerciseType'],
      raw: true
    });

    // 按时间段统计
    const timeStats = await AnswerRecord.findAll({
      where: whereClause,
      attributes: [
        'timeOfDay',
        [sequelize.fn('COUNT', '*'), 'total'],
        [sequelize.fn('AVG', sequelize.literal('CASE WHEN isCorrect THEN 1.0 ELSE 0.0 END')), 'correctRate'],
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime']
      ],
      group: ['timeOfDay'],
      order: [['timeOfDay', 'ASC']],
      raw: true
    });

    // 学习趋势
    const trendStats = await AnswerRecord.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('submitTime')), 'date'],
        [sequelize.fn('COUNT', '*'), 'total'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isCorrect THEN 1 ELSE 0 END')), 'correct'],
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime']
      ],
      group: [sequelize.fn('DATE', sequelize.col('submitTime'))],
      order: [[sequelize.fn('DATE', sequelize.col('submitTime')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalAnswers,
          correctAnswers,
          wrongAnswers,
          correctRate: totalAnswers > 0 ? (correctAnswers / totalAnswers * 100).toFixed(2) : 0
        },
        typeStats,
        timeStats,
        trendStats
      }
    });
  } catch (error) {
    console.error('获取详细分析失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 获取学生单元进度
 * GET /api/answer-records/:studentId/progress/:unitId
 */
router.get('/:studentId/progress/:unitId', async (req, res) => {
  try {
    const { studentId, unitId } = req.params;

    // 1. 优先查询UnitProgress表
    const unitProgressEntry = await UnitProgress.findOne({ 
      where: { studentId, unitId } 
    });

    if (unitProgressEntry && unitProgressEntry.completed) {
      const exercisesInUnit = await Exercise.count({ where: { unitId } });
      const unlockNextStatus = unitProgressEntry.stars === 3;

      // 获取实际完成的题目数（基于正确的答题记录）
      const exercises = await Exercise.findAll({
        where: { unitId },
        attributes: ['id']
      });
      
      const exerciseIds = exercises.map(ex => ex.id);
      const correctAnswerRecords = await AnswerRecord.findAll({
        where: {
          studentId,
          exerciseId: { [Op.in]: exerciseIds },
          isCorrect: true
        },
        attributes: ['exerciseId'],
        group: ['exerciseId']
      });
      
      const actualCompletedExercises = correctAnswerRecords.length;

      console.log(`[Progress Details] From UnitProgress: ${unitId}, Stars: ${unitProgressEntry.stars}, Completed: ${unitProgressEntry.completed}, ActualCompleted: ${actualCompletedExercises}/${exercisesInUnit}`);
      
      return res.json({
        success: true,
        data: {
          unitId,
          totalExercises: exercisesInUnit,
          completedExercises: actualCompletedExercises,
          completionRate: exercisesInUnit > 0 ? actualCompletedExercises / exercisesInUnit : 0,
          stars: unitProgressEntry.stars,
          unlockNext: unlockNextStatus,
          completed: unitProgressEntry.completed,
          studyCount: unitProgressEntry.studyCount || 0,
          practiceCount: unitProgressEntry.practiceCount || 0,
          correctCount: unitProgressEntry.correctCount || 0,
          incorrectCount: unitProgressEntry.incorrectCount || 0,
          totalAnswerCount: unitProgressEntry.totalAnswerCount || 0,
          totalTimeSpent: unitProgressEntry.totalTimeSpent || 0,
          lastStudyTime: unitProgressEntry.lastStudyTime,
          lastPracticeTime: unitProgressEntry.lastPracticeTime,
          averageResponseTime: unitProgressEntry.averageResponseTime || 0,
          masteryLevel: unitProgressEntry.masteryLevel || 0,
          source: 'UnitProgressTable'
        }
      });
    }

    // 2. 回退到基于AnswerRecord计算
    console.log(`[Progress Details] UnitProgress miss or not completed for ${unitId}, falling back to AnswerRecord calc`);
    
    const exercises = await Exercise.findAll({
      where: { unitId },
      attributes: ['id']
    });

    if (exercises.length === 0) {
      console.warn(`[Progress Details] No exercises found for unit ${unitId}, returning default empty progress.`);
      return res.json({
        success: true,
        data: {
          unitId,
          totalExercises: 0,
          completedExercises: 0,
          completionRate: 0,
          stars: 0,
          unlockNext: false,
          completed: false,
          studyCount: 0,
          practiceCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          totalAnswerCount: 0,
          totalTimeSpent: 0,
          averageResponseTime: 0,
          masteryLevel: 0,
          source: 'NoDataOrNoExercises'
        }
      });
    }

    const exerciseIds = exercises.map(ex => ex.id);

    // 获取所有答题记录
    const allAnswerRecords = await AnswerRecord.findAll({
      where: {
        studentId,
        exerciseId: { [Op.in]: exerciseIds }
      },
      order: [['submitTime', 'DESC']]
    });

    // 计算每道题的最新正确答案
    const correctAnswersMap = new Map();
    for (const record of allAnswerRecords) {
      if (!correctAnswersMap.has(record.exerciseId) && record.isCorrect) {
        correctAnswersMap.set(record.exerciseId, record);
      }
    }

    const totalExercises = exercises.length;
    const completedExercises = correctAnswersMap.size;
    const completionRate = totalExercises > 0 ? completedExercises / totalExercises : 0;

    let stars = 0;
    if (completionRate >= 0.8) stars = 3;
    else if (completionRate >= 0.6) stars = 2;
    else if (completionRate > 0) stars = 1;

    const unlockNext = stars === 3;
    const calculatedCompleted = stars > 0;

    // 计算统计数据
    const correctCount = correctAnswersMap.size;
    const totalAnswerCount = allAnswerRecords.length;
    const incorrectCount = totalAnswerCount - correctCount;
    const averageResponseTime = allAnswerRecords.length > 0 
      ? allAnswerRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0) / allAnswerRecords.length 
      : 0;

    // 计算掌握程度
    const correctRate = totalAnswerCount > 0 ? correctCount / totalAnswerCount : 0;
    const practiceEffort = Math.min(1, (allAnswerRecords.length / 10));
    const masteryLevel = (correctRate * 0.6) + (practiceEffort * 0.4);

    res.json({
      success: true,
      data: {
        unitId,
        totalExercises,
        completedExercises,
        completionRate,
        stars,
        unlockNext,
        completed: calculatedCompleted,
        studyCount: 0, // 这个需要从其他地方获取
        practiceCount: allAnswerRecords.length,
        correctCount,
        incorrectCount,
        totalAnswerCount,
        totalTimeSpent: allAnswerRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0),
        averageResponseTime,
        masteryLevel,
        source: 'AnswerRecordCalculation'
      }
    });

  } catch (error) {
    console.error('获取用户进度失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 批量获取学生进度
 * POST /api/answer-records/:studentId/progress/batch
 */
router.post('/:studentId/progress/batch', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { unitIds } = req.body;

    if (!unitIds || !Array.isArray(unitIds)) {
      return res.status(400).json({
        success: false,
        message: '缺少unitIds参数或格式错误'
      });
    }

    const progressData = {};

    for (const unitId of unitIds) {
      try {
        // 重用单个进度计算逻辑
        const unitProgressEntry = await UnitProgress.findOne({ 
          where: { studentId, unitId } 
        });

        if (unitProgressEntry && unitProgressEntry.completed) {
          const exercisesInUnit = await Exercise.count({ where: { unitId } });
          
          // 获取实际完成的题目数（基于正确的答题记录）
          const exercises = await Exercise.findAll({
            where: { unitId },
            attributes: ['id']
          });
          
          const exerciseIds = exercises.map(ex => ex.id);
          const correctAnswerRecords = await AnswerRecord.findAll({
            where: {
              studentId,
              exerciseId: { [Op.in]: exerciseIds },
              isCorrect: true
            },
            attributes: ['exerciseId'],
            group: ['exerciseId']
          });
          
          const actualCompletedExercises = correctAnswerRecords.length;
          
          progressData[unitId] = {
            unitId,
            totalExercises: exercisesInUnit,
            completedExercises: actualCompletedExercises,
            completionRate: exercisesInUnit > 0 ? actualCompletedExercises / exercisesInUnit : 0,
            stars: unitProgressEntry.stars,
            unlockNext: unitProgressEntry.stars === 3,
            completed: unitProgressEntry.completed,
            studyCount: unitProgressEntry.studyCount || 0,
            practiceCount: unitProgressEntry.practiceCount || 0,
            correctCount: unitProgressEntry.correctCount || 0,
            incorrectCount: unitProgressEntry.incorrectCount || 0,
            totalAnswerCount: unitProgressEntry.totalAnswerCount || 0,
            totalTimeSpent: unitProgressEntry.totalTimeSpent || 0,
            lastStudyTime: unitProgressEntry.lastStudyTime,
            lastPracticeTime: unitProgressEntry.lastPracticeTime,
            averageResponseTime: unitProgressEntry.averageResponseTime || 0,
            masteryLevel: unitProgressEntry.masteryLevel || 0,
            source: 'UnitProgressTable'
          };
        } else {
          // 基于AnswerRecord计算进度
          const exercises = await Exercise.findAll({
            where: { unitId },
            attributes: ['id']
          });

          if (exercises.length === 0) {
            progressData[unitId] = {
              unitId,
              totalExercises: 0,
              completedExercises: 0,
              completionRate: 0,
              stars: 0,
              unlockNext: false,
              completed: false,
              studyCount: 0,
              practiceCount: 0,
              correctCount: 0,
              incorrectCount: 0,
              totalAnswerCount: 0,
              totalTimeSpent: 0,
              averageResponseTime: 0,
              masteryLevel: 0,
              source: 'NoDataOrNoExercises'
            };
            continue;
          }

          const exerciseIds = exercises.map(ex => ex.id);
          const allAnswerRecords = await AnswerRecord.findAll({
            where: {
              studentId,
              exerciseId: { [Op.in]: exerciseIds }
            },
            order: [['submitTime', 'DESC']]
          });

          const correctAnswersMap = new Map();
          for (const record of allAnswerRecords) {
            if (!correctAnswersMap.has(record.exerciseId) && record.isCorrect) {
              correctAnswersMap.set(record.exerciseId, record);
            }
          }

          const totalExercises = exercises.length;
          const completedExercises = correctAnswersMap.size;
          const completionRate = totalExercises > 0 ? completedExercises / totalExercises : 0;

          let stars = 0;
          if (completionRate >= 0.8) stars = 3;
          else if (completionRate >= 0.6) stars = 2;
          else if (completionRate > 0) stars = 1;

          const correctCount = correctAnswersMap.size;
          const totalAnswerCount = allAnswerRecords.length;
          const incorrectCount = totalAnswerCount - correctCount;
          const averageResponseTime = allAnswerRecords.length > 0 
            ? allAnswerRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0) / allAnswerRecords.length 
            : 0;

          const correctRate = totalAnswerCount > 0 ? correctCount / totalAnswerCount : 0;
          const practiceEffort = Math.min(1, (allAnswerRecords.length / 10));
          const masteryLevel = (correctRate * 0.6) + (practiceEffort * 0.4);

          progressData[unitId] = {
            unitId,
            totalExercises,
            completedExercises,
            completionRate,
            stars,
            unlockNext: stars === 3,
            completed: stars > 0,
            studyCount: 0,
            practiceCount: allAnswerRecords.length,
            correctCount,
            incorrectCount,
            totalAnswerCount,
            totalTimeSpent: allAnswerRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0),
            averageResponseTime,
            masteryLevel,
            source: 'AnswerRecordCalculation'
          };
        }
      } catch (error) {
        console.error(`获取单元${unitId}进度失败:`, error);
        progressData[unitId] = {
          error: error.message,
          unitId,
          totalExercises: 0,
          completedExercises: 0,
          completionRate: 0,
          stars: 0,
          unlockNext: false,
          completed: false,
          source: 'Error'
        };
      }
    }

    res.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('批量获取进度失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 增加学习次数统计
 * POST /api/answer-records/:studentId/increment-study/:unitId
 */
router.post('/:studentId/increment-study/:unitId', async (req, res) => {
  try {
    const { studentId: studentIdParam, unitId } = req.params;
    const { activityType = 'study', timeSpent = 0 } = req.body;

    // 查找学生记录，获取数字ID
    const student = await Student.findOne({
      where: { studentId: studentIdParam }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `未找到学生: ${studentIdParam}`
      });
    }

    const studentId = student.id; // 使用数字ID

    // 查找或创建UnitProgress记录
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { studentId, unitId },
      defaults: {
        completed: false,
        stars: 0,
        studyCount: 1,
        practiceCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        totalAnswerCount: 0,
        totalTimeSpent: timeSpent,
        lastStudyTime: new Date(),
        averageResponseTime: 0,
        masteryLevel: 0
      }
    });

    if (!created) {
      // 更新现有记录
      if (activityType === 'study_start') {
        unitProgress.studyCount += 1;
      }
      
      if (timeSpent > 0) {
        unitProgress.totalTimeSpent += timeSpent;
      }
      
      unitProgress.lastStudyTime = new Date();
      await unitProgress.save();
    }

    res.json({
      success: true,
      message: '学习次数统计已更新',
      data: {
        studyCount: unitProgress.studyCount,
        totalTimeSpent: unitProgress.totalTimeSpent
      }
    });

  } catch (error) {
    console.error('更新学习次数统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * 增加练习次数统计
 * POST /api/answer-records/:studentId/increment-practice/:unitId
 */
router.post('/:studentId/increment-practice/:unitId', async (req, res) => {
  try {
    const { studentId: studentIdParam, unitId } = req.params;
    const { activityType = 'practice', timeSpent = 0 } = req.body;

    // 查找学生记录，获取数字ID
    const student = await Student.findOne({
      where: { studentId: studentIdParam }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `未找到学生: ${studentIdParam}`
      });
    }

    const studentId = student.id; // 使用数字ID

    // 查找或创建UnitProgress记录
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { studentId, unitId },
      defaults: {
        completed: false,
        stars: 0,
        studyCount: 0,
        practiceCount: 1,
        correctCount: 0,
        incorrectCount: 0,
        totalAnswerCount: 0,
        totalTimeSpent: timeSpent,
        lastPracticeTime: new Date(),
        averageResponseTime: 0,
        masteryLevel: 0
      }
    });

    if (!created) {
      // 更新现有记录
      if (activityType === 'practice_start') {
        unitProgress.practiceCount += 1;
      }
      
      if (timeSpent > 0) {
        unitProgress.totalTimeSpent += timeSpent;
      }
      
      unitProgress.lastPracticeTime = new Date();
      await unitProgress.save();
    }

    res.json({
      success: true,
      message: '练习次数统计已更新',
      data: {
        practiceCount: unitProgress.practiceCount,
        totalTimeSpent: unitProgress.totalTimeSpent
      }
    });

  } catch (error) {
    console.error('更新练习次数统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 