const express = require('express');
const router = express.Router();
const { Subject, Unit, Exercise } = require('../models');
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

      // 添加图标名称映射（如果icon字段只存了图标名称而不是完整的Material Community Icons名称）
      subjectData.iconName = getIconNameByCode(subject.code, subject.icon);

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

    // 获取学科数据
    const subjectData = subject.toJSON();

    // 添加图标名称映射
    subjectData.iconName = getIconNameByCode(code, subject.icon);

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
    const whereClause = { subject: subject.code };

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

      // 添加单元图标URL
      unitData.iconUrl = getIconUrlByTitle(unit.title);

      // 处理颜色字段 - 优先使用数据库中存储的颜色，没有则生成默认颜色
      if (!unitData.color) {
        unitData.color = getDefaultUnitColor(unit.level, unit.order);
      }

      // 处理次要颜色 - 优先使用数据库中存储的次要颜色，没有则基于主颜色生成
      if (!unitData.secondaryColor && unitData.color) {
        unitData.secondaryColor = getLighterColor(unitData.color);
      }

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
        subject: code, // 使用subject字段替代subjectCode
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

    // 添加单元图标URL
    unitData.iconUrl = getIconUrlByTitle(unit.title);

    // 处理颜色字段 - 优先使用数据库中存储的颜色，没有则生成默认颜色
    if (!unitData.color) {
      unitData.color = getDefaultUnitColor(unit.level, unit.order);
    }

    // 处理次要颜色 - 优先使用数据库中存储的次要颜色，没有则基于主颜色生成
    if (!unitData.secondaryColor && unitData.color) {
      unitData.secondaryColor = getLighterColor(unitData.color);
    }

    // 添加额外信息
    const enhancedUnit = {
      ...unitData,
      exercisesCount,
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

      // 添加单元图标URL
      unitData.iconUrl = getIconUrlByTitle(unit.title);

      // 处理颜色字段 - 优先使用数据库中存储的颜色，没有则生成默认颜色
      if (!unitData.color) {
        unitData.color = getDefaultUnitColor(unit.level, unit.order);
      }

      // 处理次要颜色 - 优先使用数据库中存储的次要颜色，没有则基于主颜色生成
      if (!unitData.secondaryColor && unitData.color) {
        unitData.secondaryColor = getLighterColor(unitData.color);
      }

      // 添加额外信息
      return {
        ...unitData,
        exercisesCount,
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

// 更新单元颜色 - 添加新的API路由
router.put('/units/:unitId/color', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { color, secondaryColor } = req.body;

    // 验证颜色格式
    const isValidHexColor = (color) => /^#[0-9A-F]{6}$/i.test(color);

    if (color && !isValidHexColor(color)) {
      return res.status(400).json({
        success: false,
        message: '无效的主色值，请使用有效的HEX颜色（如 #FF5500）'
      });
    }

    if (secondaryColor && !isValidHexColor(secondaryColor)) {
      return res.status(400).json({
        success: false,
        message: '无效的次要色值，请使用有效的HEX颜色（如 #FF8855）'
      });
    }

    // 查找单元
    const unit = await Unit.findByPk(unitId);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${unitId} 的单元`
      });
    }

    // 准备更新数据
    const updateData = {};
    if (color) updateData.color = color;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;

    // 如果只提供了主色，自动生成次要色
    if (color && !secondaryColor) {
      updateData.secondaryColor = getLighterColor(color);
    }

    // 更新单元颜色
    await unit.update(updateData);

    // 查找所有同级单元并更新颜色（如果是父级单元，则同时更新所有子单元）
    if (unit.level === 1) {
      // 如果是大章节，同时更新其所有小节
      await Unit.update(updateData, {
        where: { parentId: unitId }
      });
    }

    // 返回更新后的单元数据
    const updatedUnit = await Unit.findByPk(unitId);

    res.json({
      success: true,
      message: '单元颜色更新成功',
      data: updatedUnit
    });
  } catch (error) {
    console.error('更新单元颜色出错:', error);
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

// 根据单元级别和顺序获取默认颜色
function getDefaultUnitColor(level, order) {
  // 默认颜色库
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

// 生成次要颜色
function getLighterColor(hexColor) {
  try {
    // 从十六进制颜色中提取RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // 计算较浅的颜色（混合白色）
    const lighterR = Math.min(255, r + 50);
    const lighterG = Math.min(255, g + 50);
    const lighterB = Math.min(255, b + 50);

    // 转回十六进制
    return `#${lighterR.toString(16).padStart(2, "0")}${lighterG.toString(16).padStart(2, "0")}${lighterB
      .toString(16)
      .padStart(2, "0")}`;
  } catch (error) {
    console.error('生成次要颜色出错:', error, hexColor);
    return '#FFFFFF'; // 默认返回白色
  }
}

// 根据学科代码获取图标名称
function getIconNameByCode(code, iconFromDb) {
  // 如果数据库中已有完整的图标名称，则直接使用
  if (iconFromDb) return iconFromDb;

  // 默认图标映射
  const iconMapping = {
    math: "calculator-variant",
    physics: "atom",
    chemistry: "flask",
    biology: "leaf",
    history: "book-open-page-variant",
    default: "school"
  };

  return iconMapping[code] || iconMapping.default;
}

module.exports = router; 