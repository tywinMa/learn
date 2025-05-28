const { AnswerRecord, Exercise, UnitProgress, StudentPoints, sequelize } = require('../models');
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
      userId, // 注意：这里仍然使用userId作为参数名，但实际代表studentId
      exerciseId,
      unitId, // 现在这个unitId应该是课程ID，不是习题的unitId
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

      // 2. 计算难度调整系数 (基于练习模式和题目难度)
      const difficultyMultiplier = this.calculateDifficultyMultiplier(practiceMode, exercise.difficulty);

      // 3. 计算积分奖励
      let pointsEarned = 0;
      if (isCorrect) {
        pointsEarned = Math.floor(1 * difficultyMultiplier); // 基础1分，根据难度调整
        
        // 连续答对额外奖励
        const recentCorrectCount = await this.getRecentCorrectCount(userId, 5);
        if (recentCorrectCount >= 3) {
          pointsEarned += 1; // 连续答对3题额外1分
        }
      }

      // 4. 创建答题记录
      const answerRecord = await AnswerRecord.create({
        studentId: userId, // 实际是studentId
        exerciseId,
        unitId, // 使用传入的课程ID，而不是习题的unitId
        isCorrect,
        userAnswer: JSON.stringify(userAnswer),
        responseTime,
        sessionId: sessionId || uuidv4(),
        practiceMode,
        hintsUsed,
        helpRequested,
        confidence,
        knowledgePointsViewed: knowledgePointsViewed ? JSON.stringify(knowledgePointsViewed) : null,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        pointsEarned,
        submitTime: new Date(),
        subject: exercise.subject,
        isWrongAnswer: !isCorrect
      });

      // 5. 计算掌握程度
      const masteryLevel = await this.calculateUnitMastery(userId, unitId);

      // 6. 更新UnitProgress
      await this.updateUnitProgress(userId, unitId, isCorrect, responseTime, pointsEarned);

      // 7. 更新学生积分
      if (pointsEarned > 0) {
        await this.updateStudentPoints(userId, pointsEarned);
      }

      return {
        answerRecord,
        pointsEarned,
        masteryLevel,
        success: true
      };

    } catch (error) {
      console.error('提交答题记录失败:', error);
      throw error;
    }
  }

  /**
   * 计算难度调整系数
   */
  static calculateDifficultyMultiplier(practiceMode, difficulty = 'medium') {
    let multiplier = 1;

    // 根据练习模式调整
    switch (practiceMode) {
      case 'review':
        multiplier *= 0.8; // 复习模式较少积分
        break;
      case 'challenge':
        multiplier *= 1.5; // 挑战模式更多积分
        break;
      case 'wrong_redo':
        multiplier *= 1.2; // 错题重做有额外奖励
        break;
      default:
        multiplier *= 1;
    }

    // 根据题目难度调整
    switch (difficulty) {
      case 'easy':
        multiplier *= 0.8;
        break;
      case 'medium':
        multiplier *= 1;
        break;
      case 'hard':
        multiplier *= 1.5;
        break;
      default:
        multiplier *= 1;
    }

    return multiplier;
  }

  /**
   * 获取最近答对题目数量
   */
  static async getRecentCorrectCount(studentId, limit = 5) {
    const recentAnswers = await AnswerRecord.findAll({
      where: {
        studentId: studentId,
      },
      order: [['submitTime', 'DESC']],
      limit: limit,
    });

    return recentAnswers.filter(answer => answer.isCorrect).length;
  }

  /**
   * 更新学生积分
   */
  static async updateStudentPoints(studentId, pointsToAdd) {
    const [studentPoints, created] = await StudentPoints.findOrCreate({
      where: { studentId },
      defaults: { points: pointsToAdd }
    });

    if (!created) {
      studentPoints.points += pointsToAdd;
      await studentPoints.save();
    }

    return studentPoints;
  }

  /**
   * 获取学生学习统计
   */
  static async getStudentLearningStats(studentId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    return await AnswerRecord.findAll({
      where: {
        studentId: studentId,
        submitTime: {
          [Op.gte]: startDate
        }
      },
      order: [['submitTime', 'DESC']]
    });
  }

  /**
   * 获取学生错题列表
   */
  static async getWrongAnswers(studentId, filters = {}) {
    const whereClause = {
      studentId: studentId,
      isWrongAnswer: true
    };

    // 添加筛选条件
    if (filters.subject) {
      whereClause.subject = filters.subject;
    }
    if (filters.unitId) {
      whereClause.unitId = filters.unitId;
    }

    const wrongAnswers = await AnswerRecord.findAll({
      where: whereClause,
      include: [{
        model: Exercise
      }],
      order: [['submitTime', 'DESC']]
    });

    // 去重并检查最新答题状态
    const uniqueWrongAnswers = [];
    const processedExercises = new Set();

    for (const record of wrongAnswers) {
      if (!processedExercises.has(record.exerciseId)) {
        processedExercises.add(record.exerciseId);

        // 检查该题最新答题是否仍然错误
        const latestAnswer = await AnswerRecord.findOne({
          where: { 
            studentId: studentId, 
            exerciseId: record.exerciseId 
          },
          order: [['submitTime', 'DESC']]
        });

        // 只有最新答题仍然错误才加入错题列表
        if (latestAnswer && !latestAnswer.isCorrect) {
          uniqueWrongAnswers.push(record);
        }
      }
    }

    return uniqueWrongAnswers;
  }

  /**
   * 删除错题记录（当学生掌握后）
   */
  static async removeFromWrongAnswers(studentId, exerciseId) {
    const exercise = await Exercise.findByPk(exerciseId);
    if (!exercise) {
      throw new Error('练习题不存在');
    }

    // 提交一个正确答案记录
    return await this.submitAnswer({
      userId: studentId,
      exerciseId,
      unitId: exercise.unitId,
      isCorrect: true,
      userAnswer: null,
      responseTime: null,
      practiceMode: 'wrong_redo',
      sessionId: uuidv4()
    });
  }

  /**
   * 计算单元掌握程度
   */
  static async calculateUnitMastery(studentId, unitId) {
    const unitProgress = await UnitProgress.findOne({
      where: { studentId: studentId, unitId }
    });

    if (!unitProgress) {
      return 0;
    }

    // 基于正确率、完成度等计算掌握程度
    const completionRate = unitProgress.completedExercises / Math.max(unitProgress.totalExercises, 1);
    const correctnessRate = unitProgress.correctCount / Math.max(unitProgress.totalAnswerCount, 1);
    
    // 掌握程度计算：完成度 * 0.6 + 正确率 * 0.4
    const masteryLevel = (completionRate * 0.6) + (correctnessRate * 0.4);
    
    // 更新掌握程度到数据库
    unitProgress.masteryLevel = Math.min(1, masteryLevel);
    await unitProgress.save();

    return unitProgress.masteryLevel;
  }

  /**
   * 更新单元进度
   */
  static async updateUnitProgress(studentId, unitId, isCorrect, responseTime, pointsEarned) {
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { studentId: studentId, unitId },
      defaults: {
        totalExercises: 1,
        completedExercises: isCorrect ? 1 : 0,
        correctCount: isCorrect ? 1 : 0,
        incorrectCount: isCorrect ? 0 : 1,
        totalAnswerCount: 1,
        totalTimeSpent: responseTime || 0,
        masteryLevel: isCorrect ? 0.1 : 0,
        lastStudyTime: new Date()
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
      
      if (responseTime) {
        unitProgress.totalTimeSpent += responseTime;
      }
      
      unitProgress.lastStudyTime = new Date();
      
      // 重新计算完成度和掌握程度
      const correctnessRate = unitProgress.correctCount / unitProgress.totalAnswerCount;
      unitProgress.masteryLevel = Math.min(1, correctnessRate);
      
      await unitProgress.save();
    }

    return unitProgress;
  }

  /**
   * 获取学习模式分析
   */
  static async getLearningPatternAnalysis(studentId) {
    try {
      // 获取所有答题记录
      const allRecords = await AnswerRecord.findAll({
        where: { studentId: studentId },
        attributes: ['submitTime', 'practiceMode', 'responseTime'],
        order: [['submitTime', 'ASC']]
      });

      if (allRecords.length === 0) {
        return {
          timePattern: [],
          practiceModeAnalysis: []
        };
      }

      // 时间模式分析（按小时统计）
      const hourStats = {};
      allRecords.forEach(record => {
        const hour = new Date(record.submitTime).getHours();
        hourStats[hour] = (hourStats[hour] || 0) + 1;
      });

      const timePattern = Object.entries(hourStats)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour);

      // 练习模式分析
      const modeStats = {};
      const modeResponseTimes = {};
      
      allRecords.forEach(record => {
        const mode = record.practiceMode || 'normal';
        modeStats[mode] = (modeStats[mode] || 0) + 1;
        
        if (record.responseTime) {
          if (!modeResponseTimes[mode]) {
            modeResponseTimes[mode] = [];
          }
          modeResponseTimes[mode].push(record.responseTime);
        }
      });

      const practiceModeAnalysis = Object.entries(modeStats).map(([mode, count]) => {
        const responseTimes = modeResponseTimes[mode] || [];
        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
          : 0;
        
        return {
          practiceMode: mode,
          count,
          avgResponseTime: Math.round(avgResponseTime)
        };
      });

      return {
        timePattern,
        practiceModeAnalysis
      };
    } catch (error) {
      console.error('获取学习模式分析失败:', error);
      return {
        timePattern: [],
        practiceModeAnalysis: []
      };
    }
  }

  /**
   * 增加学习次数
   */
  static async incrementStudyCount(studentId, unitId, timeSpent = 0) {
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { studentId, unitId },
      defaults: {
        studyCount: 1,
        totalTimeSpent: timeSpent,
        lastStudyTime: new Date()
      }
    });

    if (!created) {
      unitProgress.studyCount = (unitProgress.studyCount || 0) + 1;
      unitProgress.totalTimeSpent = (unitProgress.totalTimeSpent || 0) + timeSpent;
      unitProgress.lastStudyTime = new Date();
      await unitProgress.save();
    }

    return unitProgress;
  }

  /**
   * 增加练习次数
   */
  static async incrementPracticeCount(studentId, unitId, timeSpent = 0) {
    const [unitProgress, created] = await UnitProgress.findOrCreate({
      where: { studentId, unitId },
      defaults: {
        practiceCount: 1,
        totalTimeSpent: timeSpent,
        lastPracticeTime: new Date()
      }
    });

    if (!created) {
      unitProgress.practiceCount = (unitProgress.practiceCount || 0) + 1;
      unitProgress.totalTimeSpent = (unitProgress.totalTimeSpent || 0) + timeSpent;
      unitProgress.lastPracticeTime = new Date();
      await unitProgress.save();
    }

    return unitProgress;
  }
}

module.exports = AnswerRecordService; 