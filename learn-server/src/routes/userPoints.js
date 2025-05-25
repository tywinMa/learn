const express = require('express');
const router = express.Router();
const { UserPoints } = require('../models');

// 获取用户积分
router.get('/:userId/points', async (req, res) => {
  try {
    const { userId } = req.params;

    // 查找或创建用户积分记录
    const [userPoints, created] = await UserPoints.findOrCreate({
      where: { userId },
      defaults: {
        points: 0
      }
    });

    res.json({
      success: true,
      data: {
        userId: userPoints.userId,
        points: userPoints.points
      }
    });
  } catch (error) {
    console.error('获取用户积分出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 增加用户积分
router.post('/:userId/points/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    if (!points || isNaN(points) || points <= 0) {
      return res.status(400).json({
        success: false,
        message: '积分必须是正数'
      });
    }

    // 查找或创建用户积分记录
    const [userPoints, created] = await UserPoints.findOrCreate({
      where: { userId },
      defaults: {
        points: 0
      }
    });

    // 增加积分
    userPoints.points += parseInt(points);
    await userPoints.save();

    res.json({
      success: true,
      data: {
        userId: userPoints.userId,
        points: userPoints.points
      },
      message: `成功增加 ${points} 积分`
    });
  } catch (error) {
    console.error('增加用户积分出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 减少用户积分（用于兑换礼品）
router.post('/:userId/points/deduct', async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;

    if (!points || isNaN(points) || points <= 0) {
      return res.status(400).json({
        success: false,
        message: '积分必须是正数'
      });
    }

    // 查找用户积分记录
    const userPoints = await UserPoints.findOne({
      where: { userId }
    });

    if (!userPoints) {
      return res.status(404).json({
        success: false,
        message: '未找到用户积分记录'
      });
    }

    // 检查积分是否足够
    if (userPoints.points < points) {
      return res.status(400).json({
        success: false,
        message: '积分不足'
      });
    }

    // 减少积分
    userPoints.points -= parseInt(points);
    await userPoints.save();

    res.json({
      success: true,
      data: {
        userId: userPoints.userId,
        points: userPoints.points
      },
      message: `成功扣除 ${points} 积分`
    });
  } catch (error) {
    console.error('扣除用户积分出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
