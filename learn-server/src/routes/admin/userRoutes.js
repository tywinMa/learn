const express = require('express');
const { getUserProfile, changePassword } = require('../../controllers/admin/userController');
const { authenticate } = require('../../middlewares/auth');
const { User, Student, UnitProgress, AnswerRecord, Unit, Course, Subject, Exercise } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

const router = express.Router();

// 所有用户路由都需要身份验证
router.use(authenticate);

// 获取当前用户信息
router.get('/profile', getUserProfile);

// 修改密码
router.put('/password', changePassword);

// 获取所有学生
router.get('/', async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取学生进度概览
router.get('/:studentId/progress-overview', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // 获取学生基本信息
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 获取学生的单元进度
    const unitProgress = await UnitProgress.findAll({
      where: { studentId },
      include: [
        {
          model: Course,
          include: [
            {
              model: Subject,
              attributes: ['code', 'name']
            }
          ]
        }
      ]
    });

    // 按课程分组进度数据
    const courseProgress = {};
    
    unitProgress.forEach(progress => {
      const courseId = progress.unitId; // 这里unitId实际是courseId
      const courseName = progress.Course.title;
      const subjectName = progress.Course.Subject.name;
      
      if (!courseProgress[courseId]) {
        courseProgress[courseId] = {
          courseId,
          courseName,
          subjectName,
          totalUnits: 0,
          completedUnits: 0,
          totalStars: 0,
          maxStars: 0,
          totalTimeSpent: 0,
          masteryLevel: 0,
          units: []
        };
      }
      
      courseProgress[courseId].totalUnits++;
      courseProgress[courseId].maxStars += 3; // 每个单元最多3星
      courseProgress[courseId].totalStars += progress.stars;
      courseProgress[courseId].totalTimeSpent += progress.totalTimeSpent;
      courseProgress[courseId].masteryLevel += progress.masteryLevel;
      
      if (progress.completed) {
        courseProgress[courseId].completedUnits++;
      }
      
      courseProgress[courseId].units.push({
        unitId: progress.unitId,
        unitName: progress.Course.title,
        completed: progress.completed,
        stars: progress.stars,
        masteryLevel: progress.masteryLevel,
        totalTimeSpent: progress.totalTimeSpent,
        correctCount: progress.correctCount,
        incorrectCount: progress.incorrectCount
      });
    });

    // 计算平均掌握程度
    Object.values(courseProgress).forEach(course => {
      if (course.totalUnits > 0) {
        course.masteryLevel = course.masteryLevel / course.totalUnits;
        course.progressPercentage = (course.completedUnits / course.totalUnits) * 100;
      }
    });

    res.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        teacher: student.teacher
      },
      courseProgress: Object.values(courseProgress)
    });
  } catch (error) {
    console.error('获取学生进度概览失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取学生错题分析
router.get('/:studentId/wrong-exercises', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, limit = 50 } = req.query;
    
    // 构建查询条件
    const whereCondition = {
      studentId,
      isWrongAnswer: true
    };
    
    if (courseId) {
      whereCondition.unitId = courseId;
    }

    // 获取错题记录
    const wrongAnswers = await AnswerRecord.findAll({
      where: whereCondition,
      include: [
        {
          model: Exercise,
          attributes: ['id', 'question', 'type', 'options', 'correctAnswer']
        },
        {
          model: Course,
          attributes: ['id', 'title']
        }
      ],
      order: [['submitTime', 'DESC']],
      limit: parseInt(limit)
    });

    // 按题目ID分组，统计错误次数和最后错误时间
    const exerciseErrorStats = {};
    
    wrongAnswers.forEach(record => {
      const exerciseId = record.exerciseId;
      
      if (!exerciseErrorStats[exerciseId]) {
        exerciseErrorStats[exerciseId] = {
          Exercise: record.Exercise,
          Course: record.Course,
          errorCount: 0,
          totalResponseTime: 0,
          lastErrorTime: null,
          errorTypes: [],
          userAnswers: []
        };
      }
      
      const stats = exerciseErrorStats[exerciseId];
      stats.errorCount++;
      stats.totalResponseTime += record.responseTime || 0;
      
      if (!stats.lastErrorTime || record.submitTime > stats.lastErrorTime) {
        stats.lastErrorTime = record.submitTime;
      }
      
      if (record.wrongAnswerType && !stats.errorTypes.includes(record.wrongAnswerType)) {
        stats.errorTypes.push(record.wrongAnswerType);
      }
      
      stats.userAnswers.push({
        userAnswer: record.userAnswer,
        submitTime: record.submitTime,
        responseTime: record.responseTime,
        wrongAnswerType: record.wrongAnswerType
      });
    });

    // 计算平均响应时间
    Object.values(exerciseErrorStats).forEach(stats => {
      if (stats.errorCount > 0) {
        stats.averageResponseTime = stats.totalResponseTime / stats.errorCount;
      }
    });

    res.json({
      studentId,
      totalWrongAnswers: wrongAnswers.length,
      uniqueWrongExercises: Object.keys(exerciseErrorStats).length,
      exerciseErrorStats: Object.values(exerciseErrorStats)
    });
  } catch (error) {
    console.error('获取学生错题分析失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取学生学习时间分析
router.get('/:studentId/time-analysis', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, courseId } = req.query;
    
    // 构建查询条件
    const whereCondition = { studentId };
    
    if (startDate && endDate) {
      whereCondition.submitTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (courseId) {
      whereCondition.unitId = courseId;
    }

    // 获取答题记录用于时间分析
    const answerRecords = await AnswerRecord.findAll({
      where: whereCondition,
      attributes: [
        'submitTime',
        'responseTime',
        'timeOfDay',
        'weekday',
        'unitId',
        'isCorrect',
        'studyTimeBeforeAnswer'
      ],
      include: [
        {
          model: Course,
          attributes: ['id', 'title']
        }
      ],
      order: [['submitTime', 'ASC']]
    });

    // 按日期分组学习时间
    const dailyStats = {};
    const hourlyStats = Array(24).fill(0).map(() => ({ count: 0, totalTime: 0 }));
    const weeklyStats = Array(7).fill(0).map(() => ({ count: 0, totalTime: 0 }));
    const courseTimeStats = {};

    answerRecords.forEach(record => {
      const date = record.submitTime.toISOString().split('T')[0];
      const hour = record.timeOfDay;
      const weekday = record.weekday;
      const courseId = record.Course.id;
      const courseName = record.Course.title;
      const responseTime = record.responseTime || 0;
      const studyTime = record.studyTimeBeforeAnswer || 0;

      // 日期统计
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          answerCount: 0,
          totalResponseTime: 0,
          totalStudyTime: 0,
          correctCount: 0
        };
      }
      dailyStats[date].answerCount++;
      dailyStats[date].totalResponseTime += responseTime;
      dailyStats[date].totalStudyTime += studyTime;
      if (record.isCorrect) {
        dailyStats[date].correctCount++;
      }

      // 小时统计
      if (hour >= 0 && hour < 24) {
        hourlyStats[hour].count++;
        hourlyStats[hour].totalTime += responseTime + studyTime;
      }

      // 星期统计
      if (weekday >= 0 && weekday < 7) {
        weeklyStats[weekday].count++;
        weeklyStats[weekday].totalTime += responseTime + studyTime;
      }

      // 课程时间统计
      if (!courseTimeStats[courseId]) {
        courseTimeStats[courseId] = {
          courseId,
          courseName,
          totalTime: 0,
          answerCount: 0,
          averageResponseTime: 0
        };
      }
      courseTimeStats[courseId].totalTime += responseTime + studyTime;
      courseTimeStats[courseId].answerCount++;
    });

    // 计算课程平均时间
    Object.values(courseTimeStats).forEach(stats => {
      if (stats.answerCount > 0) {
        stats.averageResponseTime = stats.totalTime / stats.answerCount;
      }
    });

    res.json({
      studentId,
      timeRange: { startDate, endDate },
      dailyStats: Object.values(dailyStats),
      hourlyStats: hourlyStats.map((stats, hour) => ({
        hour,
        ...stats,
        averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0
      })),
      weeklyStats: weeklyStats.map((stats, weekday) => ({
        weekday,
        weekdayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekday],
        ...stats,
        averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0
      })),
      courseTimeStats: Object.values(courseTimeStats)
    });
  } catch (error) {
    console.error('获取学生时间分析失败:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 