const express = require('express');
const router = express.Router();
const { Subject, Unit, LearningContent, Exercise } = require('../models');
const { Op } = require('sequelize');

// 获取所有学科 - 增加颜色和图标信息
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      order: [['order', 'ASC']]
    });

    // 为每个学科添加默认的颜色和图标信息
    const enhancedSubjects = subjects.map(subject => {
      const subjectData = subject.toJSON();

      // 根据学科代码设置颜色
      const colors = {
        math: "#58CC02",
        physics: "#5EC0DE",
        chemistry: "#FF9600",
        biology: "#9069CD",
        history: "#DD6154",
        default: "#1CB0F6"
      };

      // 添加颜色字段
      subjectData.color = colors[subject.code] || colors.default;

      return subjectData;
    });

    res.json({
      success: true,
      data: enhancedSubjects
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

    // 添加颜色信息
    const subjectData = subject.toJSON();

    // 根据学科代码设置颜色
    const colors = {
      math: "#58CC02",
      physics: "#5EC0DE",
      chemistry: "#FF9600",
      biology: "#9069CD",
      history: "#DD6154",
      default: "#1CB0F6"
    };

    subjectData.color = colors[code] || colors.default;

    res.json({
      success: true,
      data: subjectData
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

    // 获取每个单元相关的练习题数量
    const enhancedUnits = await Promise.all(units.map(async unit => {
      const unitData = unit.toJSON();

      // 获取当前单元的练习题数量
      const exercisesCount = await Exercise.count({
        where: { unitId: unit.id }
      });

      // 判断是否为挑战级别
      const isChallenge = unit.title.includes('挑战') ||
        unit.title.includes('测试') ||
        unit.title.includes('考试') ||
        unit.difficulty > 7;

      // 添加单元图标URL
      unitData.iconUrl = getIconUrlByTitle(unit.title);

      // 添加单元颜色信息
      unitData.color = getUnitColor(unit.level, unit.order);

      // 确保每个单元都有code字段，并且遵循学科前缀命名规则
      if (!unitData.code) {
        unitData.code = `${unit.level}-${unit.order}`;
      }

      // 确保code字段不包含学科前缀，这样前端可以自己添加
      if (unitData.code.startsWith(`${code}-`)) {
        unitData.code = unitData.code.substring(code.length + 1);
      }

      // 添加额外信息
      return {
        ...unitData,
        exercisesCount,
        isChallenge,
        subjectCode: code, // 添加学科代码，帮助前端构建完整ID
      };
    }));

    res.json({
      success: true,
      data: enhancedUnits
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

    // 获取单元相关的练习题数量
    const exercisesCount = await Exercise.count({
      where: { unitId: unit.id }
    });

    // 获取单元数据
    const unitData = unit.toJSON();

    // 判断是否为挑战级别
    const isChallenge = unit.title.includes('挑战') ||
      unit.title.includes('测试') ||
      unit.title.includes('考试') ||
      unit.difficulty > 7;

    // 添加单元图标URL
    unitData.iconUrl = getIconUrlByTitle(unit.title);

    // 添加单元颜色信息
    unitData.color = getUnitColor(unit.level, unit.order);

    // 添加额外信息
    const enhancedUnit = {
      ...unitData,
      exercisesCount,
      isChallenge
    };

    res.json({
      success: true,
      data: enhancedUnit
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

    // 为每个子单元添加额外信息
    const enhancedChildUnits = await Promise.all(childUnits.map(async unit => {
      const unitData = unit.toJSON();

      // 获取当前单元的练习题数量
      const exercisesCount = await Exercise.count({
        where: { unitId: unit.id }
      });

      // 判断是否为挑战级别
      const isChallenge = unit.title.includes('挑战') ||
        unit.title.includes('测试') ||
        unit.title.includes('考试') ||
        unit.difficulty > 7;

      // 添加单元图标URL
      unitData.iconUrl = getIconUrlByTitle(unit.title);

      // 添加单元颜色信息
      unitData.color = getUnitColor(unit.level, unit.order);

      // 添加额外信息
      return {
        ...unitData,
        exercisesCount,
        isChallenge
      };
    }));

    res.json({
      success: true,
      data: enhancedChildUnits
    });
  } catch (error) {
    console.error('获取子单元出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 根据单元标题获取适合的图标URL
function getIconUrlByTitle(title) {
  // 默认图标
  let defaultIcon = "https://i.imgur.com/QgQQXTI.png";

  // 根据标题关键词选择不同的图标
  if (title.includes('方程') || title.includes('代数')) {
    return "https://i.imgur.com/QgQQXTI.png"; // 方程/代数图标
  } else if (title.includes('函数') || title.includes('图像')) {
    return "https://i.imgur.com/vAMCb0f.png"; // 函数/图像图标
  } else if (title.includes('概率') || title.includes('统计')) {
    return "https://i.imgur.com/yjcbqsP.png"; // 概率/统计图标
  } else if (title.includes('几何') || title.includes('三角')) {
    return "https://i.imgur.com/vAMCb0f.png"; // 几何图标
  } else if (title.includes('力学') || title.includes('物理')) {
    return "https://i.imgur.com/GUKf7P1.png"; // 力学/物理图标
  } else if (title.includes('挑战') || title.includes('测试')) {
    return "https://i.imgur.com/h3pFJG3.png"; // 挑战/测试图标
  }

  return defaultIcon;
}

// 根据单元级别和顺序获取颜色
function getUnitColor(level, order) {
  // 颜色库
  const colors = [
    "#58CC02", // 绿色
    "#5EC0DE", // 蓝色
    "#FF9600", // 橙色
    "#9069CD", // 紫色
    "#DD6154", // 红色
    "#1CB0F6"  // 浅蓝色
  ];

  // 根据级别和顺序选择颜色
  // 同一级别的单元使用相同颜色
  const colorIndex = (level - 1) % colors.length;
  return colors[colorIndex];
}

module.exports = router; 