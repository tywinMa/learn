const express = require('express');
const router = express.Router();
const { Subject, Unit, LearningContent } = require('../models');
const { Op } = require('sequelize');

// 获取所有学科
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('获取学科列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定学科
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const subject = await Subject.findOne({
      where: { code }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: `未找到学科代码为 ${code} 的学科`
      });
    }

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('获取学科详情出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定学科的所有单元
router.get('/:code/units', async (req, res) => {
  try {
    const { code } = req.params;
    const { level } = req.query;

    // 先查询学科
    const subject = await Subject.findOne({
      where: { code }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: `未找到学科代码为 ${code} 的学科`
      });
    }

    // 查询条件
    const whereClause = { subjectId: subject.id };
    
    // 如果指定了level，只返回该层级的单元
    if (level) {
      whereClause.level = level;
    }

    // 查询单元
    const units = await Unit.findAll({
      where: whereClause,
      order: [['level', 'ASC'], ['order', 'ASC']]
    });

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('获取学科单元出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定单元
router.get('/units/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;

    const unit = await Unit.findByPk(unitId);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${unitId} 的单元`
      });
    }

    res.json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('获取单元详情出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取单元的子单元
router.get('/units/:unitId/children', async (req, res) => {
  try {
    const { unitId } = req.params;

    const childUnits = await Unit.findAll({
      where: { parentId: unitId },
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: childUnits
    });
  } catch (error) {
    console.error('获取子单元出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 