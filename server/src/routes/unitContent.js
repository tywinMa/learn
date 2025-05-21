const express = require('express');
const router = express.Router();
const { Unit } = require('../models');
const { Op } = require('sequelize');

// 获取特定单元的内容
router.get('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;

    // 检查unitId是否为undefined或无效值
    if (!unitId || unitId === 'undefined' || unitId === 'null') {
      return res.status(400).json({
        success: false,
        message: '无效的单元ID参数'
      });
    }

    console.log(`获取单元 ${unitId} 的内容`);

    // 查询单元内容
    const unit = await Unit.findByPk(unitId, {
      attributes: ['id', 'title', 'content', 'media', 'subject']
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId}`
      });
    }

    // 如果单元没有内容
    if (!unit.content && (!unit.media || unit.media.length === 0)) {
      return res.status(404).json({
        success: false,
        message: `单元 ${unitId} 没有学习内容`
      });
    }

    res.json({
      success: true,
      data: {
        id: unit.id,
        title: unit.title,
        content: unit.content,
        media: unit.media,
        subject: unit.subject
      }
    });
  } catch (error) {
    console.error('获取单元内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 根据学科和ID获取单元内容
router.get('/:subject/:id', async (req, res) => {
  try {
    const { subject, id } = req.params;

    // 验证参数
    if (!subject || !id) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    console.log(`获取学科 ${subject} 中单元 ${id} 的内容`);

    // 构建查询条件 - 假定id已经包含学科前缀或将其加上
    const formattedUnitId = id.includes('-') ? id : `${subject}-${id}`;

    // 查询单元内容
    const unit = await Unit.findByPk(formattedUnitId, {
      attributes: ['id', 'title', 'content', 'media', 'subject']
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: `未找到学科 ${subject} 中单元 ${formattedUnitId}`
      });
    }

    // 如果单元没有内容
    if (!unit.content && (!unit.media || unit.media.length === 0)) {
      return res.status(404).json({
        success: false,
        message: `单元 ${formattedUnitId} 没有学习内容`
      });
    }

    res.json({
      success: true,
      data: {
        id: unit.id,
        title: unit.title,
        content: unit.content,
        media: unit.media,
        subject: unit.subject
      }
    });
  } catch (error) {
    console.error('获取学科单元内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新单元内容（需要管理员权限）
router.put('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { content, media } = req.body;

    const unit = await Unit.findByPk(unitId);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId}`
      });
    }

    // 更新字段
    await unit.update({
      content: content !== undefined ? content : unit.content,
      media: media !== undefined ? media : unit.media
    });

    res.json({
      success: true,
      message: '单元内容更新成功',
      data: {
        id: unit.id,
        title: unit.title,
        content: unit.content,
        media: unit.media,
        subject: unit.subject
      }
    });
  } catch (error) {
    console.error('更新单元内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 