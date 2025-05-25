const express = require('express');
const router = express.Router();
const { KnowledgePoint, Exercise, Subject } = require('../models');
const { Op } = require('sequelize');

// 获取所有知识点（支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, subject, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { isActive: true };
    
    if (subject) {
      whereClause.subject = subject;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows: knowledgePoints } = await KnowledgePoint.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          attributes: ['name', 'code']
        }
      ],
      order: [['difficulty', 'ASC'], ['title', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: knowledgePoints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取知识点列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 根据ID获取知识点详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const knowledgePoint = await KnowledgePoint.findByPk(id, {
      include: [
        {
          model: Subject,
          attributes: ['name', 'code']
        }
      ]
    });
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }
    
    res.json({
      success: true,
      data: knowledgePoint
    });
  } catch (error) {
    console.error('获取知识点详情出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 创建新知识点
router.post('/', async (req, res) => {
  try {
    const { title, content, type = 'text', mediaUrl, subject, difficulty = 1 } = req.body;
    
    if (!title || !content || !subject) {
      return res.status(400).json({
        success: false,
        message: '标题、内容和学科是必填项'
      });
    }
    
    const knowledgePoint = await KnowledgePoint.create({
      title,
      content,
      type,
      mediaUrl,
      subject,
      difficulty
    });
    
    res.status(201).json({
      success: true,
      data: knowledgePoint,
      message: '知识点创建成功'
    });
  } catch (error) {
    console.error('创建知识点出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新知识点
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, mediaUrl, subject, difficulty, isActive } = req.body;
    
    const knowledgePoint = await KnowledgePoint.findByPk(id);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }
    
    await knowledgePoint.update({
      title: title || knowledgePoint.title,
      content: content || knowledgePoint.content,
      type: type || knowledgePoint.type,
      mediaUrl: mediaUrl !== undefined ? mediaUrl : knowledgePoint.mediaUrl,
      subject: subject || knowledgePoint.subject,
      difficulty: difficulty || knowledgePoint.difficulty,
      isActive: isActive !== undefined ? isActive : knowledgePoint.isActive
    });
    
    res.json({
      success: true,
      data: knowledgePoint,
      message: '知识点更新成功'
    });
  } catch (error) {
    console.error('更新知识点出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 删除知识点（软删除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const knowledgePoint = await KnowledgePoint.findByPk(id);
    
    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }
    
    await knowledgePoint.update({ isActive: false });
    
    res.json({
      success: true,
      message: '知识点删除成功'
    });
  } catch (error) {
    console.error('删除知识点出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 