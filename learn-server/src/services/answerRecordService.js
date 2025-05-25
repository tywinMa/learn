const { AnswerRecord, Exercise, UnitProgress, UserPoints, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

/**
 * 答题记录服务类
 */
class AnswerRecordService {
  
  /**
   * 提交答题记录
   */
  static async submitAnswer(params) {
    const {
      userId,
      exerciseId,
      unitId,
      isCorrect,
      userAnswer,
      responseTime,
      sessionId,
      practiceMode = 'normal',
      hintsUsed = 0,
      helpRequested = false,
      confidence,
      knowledgePointsViewed = null,
      deviceInfo = null
    } = params;

    try {
      // 1. 获取练习题信息
      const exercise = await Exercise.findByPk(exerciseId);
      if (!exercise) {
        throw new Error('练习题不存在');
      }

      // 2. 查找该用户对该题的历史记录
      const previousRecords = await AnswerRecord.findAll({
        where: { userId, exerciseId },
        order: [['submitTime', 'DESC']],
        limit: 1
      });

      const previousRecord = previousRecords[0];
      const attemptNumber = previousRecord ? previousRecord.attemptNumber + 1 : 1;
      const isFirstAttempt = attemptNumber === 1;
      const previousResult = previousRecord ? previousRecord.isCorrect : null;

      // 3. 计算得分
      let score = 0;
      if (isCorrect) {
        score = isFirstAttempt ? 100 : Math.max(50, 100 - (attemptNumber - 1) * 10);
      }

      // 4. 计算积分奖励
      let pointsEarned = 0;
      if (isCorrect) {
        if (isFirstAttempt) {
          pointsEarned = 1; // 首次答对获得1积分
        } else if (previousRecord && !previousRecord.isCorrect) {
          pointsEarned = 1; // 从错误变为正确也获得积分
        }
      }

      // 5. 创建答题记录
      const answerRecord = await AnswerRecord.create({
        // 基础信息
        userId,
        exerciseId,
        unitId,
        subject: exercise.subject,
        
        // 答题结果
        isCorrect,
        userAnswer,
        correctAnswer: exercise.correctAnswer,
        score,
        
        // 时间数据
        responseTime,
        startTime: new Date(Date.now() - (responseTime || 0) * 1000),
        submitTime: new Date(),
        
        // 尝试相关
        attemptNumber,
        totalAttempts: attemptNumber,
        isFirstAttempt,
        previousResult,
        
        // 上下文信息
        sessionId: sessionId || uuidv4(),
        practiceMode,
        deviceInfo,
        
        // 学习行为
        hintsUsed,
        helpRequested,
        knowledgePointsViewed,
        
        // 题目属性
        exerciseType: exercise.type,
        difficultyLevel: exercise.difficulty || null,
        
        // 用户状态
        confidence,
        
        // 错题管理
        isWrongAnswer: !isCorrect,
        wrongAnswerType: !isCorrect ? 'unknown' : null,
        masteredAfterAttempts: isCorrect ? attemptNumber : null,
        
        // 成绩与进度
        pointsEarned,
        experienceGained: isCorrect ? 10 : 5,
        masteryContribution: isCorrect ? 0.1 : 0
      });

      // 6. 更新UnitProgress
      await this.updateUnitProgress(userId, unitId, isCorrect, responseTime, pointsEarned);

      // 7. 更新用户积分
      if (pointsEarned > 0) {
        await this.updateUserPoints(userId, pointsEarned);
      }

      // 8. 更新历史记录的totalAttempts
      if (previousRecord) {
        await AnswerRecord.update(
          { totalAttempts: attemptNumber },
          { 
            where: { 
              userId, 
              exerciseId,
              id: { [Op.ne]: answerRecord.id }
            }
          }
        );
      }

      return {
        success: true,
        data: {
          recordId: answerRecord.id,
          isCorrect,
          score,
          pointsEarned,
          attemptNumber,
          masteryLevel: await this.calculateUnitMastery(userId, unitId)
        }
      };

    } catch (error) {
      console.error('提交答题记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新单元进度
   */
  static async updateUnitProgress(userId, unitId, isCorrect, responseTime, pointsEarned) {
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { userId, unitId },
      defaults: {
        completed: false,
        stars: 0,
        studyCount: 0,
        practiceCount: 0,
        correctCount: isCorrect ? 1 : 0,
        incorrectCount: isCorrect ? 0 : 1,
        totalAnswerCount: 1,
        totalTimeSpent: responseTime || 0,
        lastPracticeTime: new Date(),
        averageResponseTime: responseTime || 0,
        masteryLevel: isCorrect ? 0.1 : 0
      }
    });

    if (!created) {
      // 更新现有记录
      unitProgress.totalAnswerCount += 1;
      
      if (isCorrect) {
        unitProgress.correctCount += 1;
      } else {
        unitProgress.incorrectCount += 1;
      }
      
      // 更新响应时间
      if (responseTime) {
        const totalResponseTime = unitProgress.averageResponseTime * (unitProgress.totalAnswerCount - 1) + responseTime;
        unitProgress.totalTimeSpent += responseTime;
        unitProgress.averageResponseTime = totalResponseTime / unitProgress.totalAnswerCount;
      }
      
      unitProgress.lastPracticeTime = new Date();
      
      // 重新计算掌握程度
      const correctRate = unitProgress.correctCount / (unitProgress.correctCount + unitProgress.incorrectCount);
      const attempts = Math.min(1, (unitProgress.practiceCount / 10));
      const studyFactor = Math.min(1, (unitProgress.studyCount / 5));
      
      unitProgress.masteryLevel = (correctRate * 0.6) + (attempts * 0.2) + (studyFactor * 0.2);
      unitProgress.masteryLevel = Math.min(1, Math.max(0, unitProgress.masteryLevel));
      
      await unitProgress.save();
    }

    return unitProgress;
  }

  /**
   * 更新用户积分
   */
  static async updateUserPoints(userId, pointsToAdd) {
    const [userPoints, created] = await UserPoints.findOrCreate({
      where: { userId },
      defaults: { points: pointsToAdd }
    });

    if (!created) {
      userPoints.points += pointsToAdd;
      await userPoints.save();
    }

    return userPoints;
  }

  /**
   * 计算单元掌握程度
   */
  static async calculateUnitMastery(userId, unitId) {
    const unitProgress = await UnitProgress.findOne({
      where: { userId, unitId }
    });
    
    return unitProgress ? unitProgress.masteryLevel : 0;
  }

  /**
   * 获取用户错题列表
   */
  static async getWrongAnswers(userId, filters = {}) {
    const whereClause = {
      userId,
      isWrongAnswer: true
    };

    if (filters.subject) {
      whereClause.subject = filters.subject;
    }

    if (filters.unitId) {
      whereClause.unitId = filters.unitId;
    }

    if (filters.exerciseType) {
      whereClause.exerciseType = filters.exerciseType;
    }

    // 获取每道错题的最新记录
    const wrongAnswers = await AnswerRecord.findAll({
      where: whereClause,
      include: [{ 
        model: Exercise,
        required: true
      }],
      order: [['submitTime', 'DESC']]
    });

    // 按exerciseId分组，只保留最新的错误记录
    const latestWrongAnswers = new Map();
    for (const record of wrongAnswers) {
      if (!latestWrongAnswers.has(record.exerciseId)) {
        // 检查该题最新答题是否仍然错误
        const latestAnswer = await AnswerRecord.findOne({
          where: { 
            userId, 
            exerciseId: record.exerciseId 
          },
          order: [['submitTime', 'DESC']]
        });
        
        if (latestAnswer && !latestAnswer.isCorrect) {
          latestWrongAnswers.set(record.exerciseId, record);
        }
      }
    }

    return Array.from(latestWrongAnswers.values()).map(record => ({
      exerciseData: record.Exercise,
      answerRecord: {
        id: record.id,
        attemptNumber: record.attemptNumber,
        wrongAnswerType: record.wrongAnswerType,
        submitTime: record.submitTime,
        responseTime: record.responseTime
      },
      unitId: record.unitId,
      attempts: record.totalAttempts,
      timestamp: record.submitTime.getTime()
    }));
  }

  /**
   * 获取用户学习统计
   */
  static async getUserLearningStats(userId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    return await AnswerRecord.findAll({
      where: {
        userId,
        submitTime: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('submitTime')), 'date'],
        [sequelize.fn('COUNT', '*'), 'totalAnswers'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isCorrect THEN 1 ELSE 0 END')), 'correctAnswers'],
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime'],
        [sequelize.fn('SUM', sequelize.col('pointsEarned')), 'totalPoints']
      ],
      group: [sequelize.fn('DATE', sequelize.col('submitTime'))],
      order: [[sequelize.fn('DATE', sequelize.col('submitTime')), 'ASC']],
      raw: true
    });
  }

  /**
   * 获取学习模式分析
   */
  static async getLearningPatternAnalysis(userId) {
    // 时间模式分析
    const timePattern = await AnswerRecord.findAll({
      where: { userId },
      attributes: [
        'timeOfDay',
        'weekday',
        [sequelize.fn('COUNT', '*'), 'answerCount'],
        [sequelize.fn('AVG', sequelize.literal('CASE WHEN isCorrect THEN 1.0 ELSE 0.0 END')), 'correctRate'],
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime']
      ],
      group: ['timeOfDay', 'weekday'],
      order: [['timeOfDay', 'ASC'], ['weekday', 'ASC']],
      raw: true
    });

    // 练习模式分析
    const practiceModeAnalysis = await AnswerRecord.findAll({
      where: { userId },
      attributes: [
        'practiceMode',
        [sequelize.fn('COUNT', '*'), 'count'],
        [sequelize.fn('AVG', sequelize.literal('CASE WHEN isCorrect THEN 1.0 ELSE 0.0 END')), 'correctRate'],
        [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime']
      ],
      group: ['practiceMode'],
      raw: true
    });

    return {
      timePattern,
      practiceModeAnalysis
    };
  }

  /**
   * 删除错题记录（当用户掌握后）
   */
  static async removeFromWrongAnswers(userId, exerciseId) {
    // 不实际删除，而是创建一个正确的新记录来表示掌握
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) {
      throw new Error('练习题不存在');
    }

    return await this.submitAnswer({
      userId,
      exerciseId,
      unitId: exercise.unitId,
      isCorrect: true,
      userAnswer: null,
      responseTime: null,
      practiceMode: 'wrong_redo',
      sessionId: uuidv4()
    });
  }
}

module.exports = AnswerRecordService; 