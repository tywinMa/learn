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

// 新增：根据学科和ID获取学习内容（推荐使用此API）
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

    console.log(`获取学科 ${subject} 中单元 ${id} 的学习内容`);

    // 构建查询条件 - 假定id已经包含学科前缀或将其加上
    const formattedUnitId = id.includes('-') ? id : `${subject}-${id}`;
    const whereClause = { unitId: formattedUnitId };

    console.log(`查询单元ID: ${formattedUnitId}`);

    // 查询学习内容
    const contents = await LearningContent.findAll({
      where: whereClause,
      order: [['order', 'ASC']]
    });

    if (contents.length === 0) {
      return res.status(404).json({
        success: false,
        message: `未找到学科 ${subject} 中单元 ${formattedUnitId} 的学习内容`
      });
    }

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('获取学科单元学习内容出错:', error);
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

    // 检查unitId是否为undefined或无效值
    if (!unitId || unitId === 'undefined' || unitId === 'null') {
      return res.status(400).json({
        success: false,
        message: '无效的单元ID参数'
      });
    }

    console.log(`获取单元 ${unitId} 的学习内容`);

    // 假定unitId已包含学科前缀，直接查询
    const whereClause = { unitId };

    // 查询学习内容
    const contents = await LearningContent.findAll({
      where: whereClause,
      order: [['order', 'ASC']]
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