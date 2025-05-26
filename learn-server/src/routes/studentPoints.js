const express = require('express');
const router = express.Router();
const { StudentPoints } = require('../models');

// 获取学生积分
router.get('/:studentId/points', async (req, res) => {
  try {
    const { studentId } = req.params;

    // 查找或创建学生积分记录
    const [studentPoints, created] = await StudentPoints.findOrCreate({
      where: { studentId },
      defaults: {
        points: 0
      }
    });

    res.json({
      success: true,
      data: {
        studentId: studentPoints.studentId,
        points: studentPoints.points
      }
    });
  } catch (error) {
    console.error('获取学生积分出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 增加学生积分
router.post('/:studentId/points/add', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { points } = req.body;

    if (!points || isNaN(points) || points <= 0) {
      return res.status(400).json({
        success: false,
        message: '积分必须是正数'
      });
    }

    // 查找或创建学生积分记录
    const [studentPoints, created] = await StudentPoints.findOrCreate({
      where: { studentId },
      defaults: {
        points: 0
      }
    });

    // 增加积分
    studentPoints.points += parseInt(points);
    await studentPoints.save();

    res.json({
      success: true,
      data: {
        studentId: studentPoints.studentId,
        points: studentPoints.points
      },
      message: `成功增加 ${points} 积分`
    });
  } catch (error) {
    console.error('增加学生积分出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 减少学生积分（用于兑换礼品）
router.post('/:studentId/points/deduct', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { points } = req.body;

    if (!points || isNaN(points) || points <= 0) {
      return res.status(400).json({
        success: false,
        message: '积分必须是正数'
      });
    }

    // 查找学生积分记录
    const studentPoints = await StudentPoints.findOne({
      where: { studentId }
    });

    if (!studentPoints) {
      return res.status(404).json({
        success: false,
        message: '未找到学生积分记录'
      });
    }

    // 检查积分是否足够
    if (studentPoints.points < points) {
      return res.status(400).json({
        success: false,
        message: '积分不足'
      });
    }

    // 减少积分
    studentPoints.points -= parseInt(points);
    await studentPoints.save();

    res.json({
      success: true,
      data: {
        studentId: studentPoints.studentId,
        points: studentPoints.points
      },
      message: `成功扣除 ${points} 积分`
    });
  } catch (error) {
    console.error('扣除学生积分出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
