const express = require('express');
const router = express.Router();
const { LearningContent } = require('../models');
const { Op } = require('sequelize');

// 获取所有单元的学习内容（不包含详细内容，仅标题和单元ID）
router.get('/', async (req, res) => {
  try {
    const contents = await LearningContent.findAll({
      attributes: ['id', 'unitId', 'title', 'type', 'order'],
      order: [['unitId', 'ASC'], ['order', 'ASC']]
    });

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('获取学习内容列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定单元的学习内容
router.get('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    
    console.log(`获取单元 ${unitId} 的学习内容`);
    
    // 查询条件
    const whereClause = {};
    
    // 支持获取子单元内容
    if (unitId.split('-').length === 2) {
      // 如果是主单元ID (如1-1)，需要获取这个单元及其子单元的内容
      console.log(`主单元ID: ${unitId}，同时获取子单元内容`);
      whereClause[Op.or] = [
        { unitId }, // 精确匹配unitId
        { unitId: { [Op.like]: `${unitId}-%` } } // unitId前缀匹配（获取子单元的内容）
      ];
    } else {
      // 只获取指定单元的内容
      whereClause.unitId = unitId;
    }

    // 查询学习内容
    const contents = await LearningContent.findAll({
      where: whereClause,
      order: [['unitId', 'ASC'], ['order', 'ASC']]
    });
    
    console.log(`找到 ${contents.length} 条学习内容`);
    
    if (contents.length === 0) {
      return res.status(404).json({
        success: false,
        message: `未找到单元 ${unitId} 的学习内容`
      });
    }

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('获取单元学习内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定ID的学习内容
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const content = await LearningContent.findByPk(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${id} 的学习内容`
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('获取学习内容详情出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建新的学习内容（需要管理员权限，可以后续添加鉴权）
router.post('/', async (req, res) => {
  try {
    const { unitId, title, content, order, type, mediaUrl, metadata } = req.body;

    if (!unitId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const newContent = await LearningContent.create({
      unitId,
      title,
      content,
      order: order || 1,
      type: type || 'text',
      mediaUrl,
      metadata
    });

    res.status(201).json({
      success: true,
      message: '学习内容创建成功',
      data: newContent
    });
  } catch (error) {
    console.error('创建学习内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新学习内容（需要管理员权限）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { unitId, title, content, order, type, mediaUrl, metadata } = req.body;

    const learningContent = await LearningContent.findByPk(id);

    if (!learningContent) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${id} 的学习内容`
      });
    }

    // 更新字段
    await learningContent.update({
      unitId: unitId || learningContent.unitId,
      title: title || learningContent.title,
      content: content || learningContent.content,
      order: order || learningContent.order,
      type: type || learningContent.type,
      mediaUrl: mediaUrl !== undefined ? mediaUrl : learningContent.mediaUrl,
      metadata: metadata !== undefined ? metadata : learningContent.metadata
    });

    res.json({
      success: true,
      message: '学习内容更新成功',
      data: learningContent
    });
  } catch (error) {
    console.error('更新学习内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除学习内容（需要管理员权限）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const learningContent = await LearningContent.findByPk(id);

    if (!learningContent) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${id} 的学习内容`
      });
    }

    await learningContent.destroy();

    res.json({
      success: true,
      message: '学习内容删除成功'
    });
  } catch (error) {
    console.error('删除学习内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 