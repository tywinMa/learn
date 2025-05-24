const express = require('express');
const router = express.Router();
const { Subject, Unit, Course, Exercise } = require('../models');
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

// 根据学科代码设置图标名称
function getIconNameByCode(code, iconField) {
  // 如果数据库有存储icon字段，优先使用
  if (iconField) {
    return iconField;
  }

  // 否则根据学科代码返回默认图标
  const iconMap = {
    math: 'calculator',
    physics: 'flask',
    chemistry: 'atom',
    biology: 'leaf',
    history: 'book-outline',
    default: 'book'
  };

  return iconMap[code] || iconMap.default;
}

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

    const subjectData = subject.toJSON();
    subjectData.iconName = getIconNameByCode(subject.code, subject.icon);

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

// 获取特定学科的所有单元和小单元（新API，支持新的数据结构）
router.get('/:code/units', async (req, res) => {
  try {
    const { code } = req.params;

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

    // 获取该学科的所有大单元
    const units = await Unit.findAll({
      where: { subject: subject.code },
      order: [['order', 'ASC']]
    });

    // 获取该学科的所有小单元
    const courses = await Course.findAll({
      where: { subject: subject.code },
      order: [['level', 'ASC'], ['order', 'ASC']]
    });

    // 组合数据，将小单元按大单元分组
    const enhancedUnits = await Promise.all(units.map(async unit => {
      const unitData = unit.toJSON();

      // 获取属于该大单元的小单元
      const unitCourses = courses.filter(course => course.unitId === unit.id);

      // 为每个小单元添加练习题数量
      const enhancedCourses = await Promise.all(unitCourses.map(async course => {
        const courseData = course.toJSON();

        // 获取该小单元的练习题数量
        const exercisesCount = await Exercise.count({
          where: { unitId: course.id }
        });

        return {
          ...courseData,
          exercisesCount,
          // 保持与旧API兼容的字段
          isMajor: false,
        };
      }));

      // 添加大单元图标URL
      unitData.iconUrl = getIconUrlByTitle(unit.title);

      // 保持与旧API兼容的字段
      unitData.isMajor = true;
      unitData.level = enhancedCourses.length > 0 ? enhancedCourses[0].level : 1;
      unitData.position = 'default';
      unitData.unitType = 'normal';

      return {
        ...unitData,
        courses: enhancedCourses, // 包含的小单元
        exercisesCount: enhancedCourses.reduce((sum, course) => sum + course.exercisesCount, 0),
      };
    }));

    // 为了保持向后兼容，还需要返回扁平化的单元列表
    const flatUnits = [];

    enhancedUnits.forEach(unit => {
      // 添加大单元
      flatUnits.push({
        ...unit,
        courses: undefined, // 移除courses字段避免循环引用
      });

      // 添加小单元
      if (unit.courses) {
        unit.courses.forEach(course => {
          flatUnits.push(course);
        });
      }
    });

    res.json({
      success: true,
      data: flatUnits,
      structured: enhancedUnits, // 额外提供结构化数据
    });
  } catch (error) {
    console.error('获取学科单元出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 根据单元标题生成图标URL的辅助函数
function getIconUrlByTitle(title) {
  // 根据单元标题返回相应的图标
  if (title.includes('代数') || title.includes('方程') || title.includes('函数')) {
    return 'calculator';
  } else if (title.includes('几何') || title.includes('三角') || title.includes('圆')) {
    return 'triangle';
  } else if (title.includes('统计') || title.includes('概率')) {
    return 'chart-bar';
  } else if (title.includes('力学') || title.includes('运动')) {
    return 'car';
  } else if (title.includes('电') || title.includes('磁')) {
    return 'flash';
  } else if (title.includes('元素') || title.includes('周期')) {
    return 'atom';
  } else if (title.includes('细胞') || title.includes('生物')) {
    return 'leaf';
  }
  return 'book'; // 默认图标
}

// 根据级别和顺序生成默认单元颜色
function getDefaultUnitColor(level, order) {
  const colors = [
    '#58CC02', '#1CB0F6', '#FF9600', '#9E58FF', '#DD6154',
    '#8CB153', '#5EC0DE', '#FF4B4B', '#9069CD', '#32CD32'
  ];
  
  const index = ((level - 1) * 10 + (order - 1)) % colors.length;
  return colors[index];
}

// 生成较浅的颜色
function getLighterColor(hexColor) {
  // 从十六进制颜色中提取RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // 计算较浅的颜色（混合白色）
  const lighterR = Math.min(255, r + 50);
  const lighterG = Math.min(255, g + 50);
  const lighterB = Math.min(255, b + 50);

  // 转回十六进制
  return `#${lighterR.toString(16).padStart(2, "0")}${lighterG
    .toString(16)
    .padStart(2, "0")}${lighterB.toString(16).padStart(2, "0")}`;
}

// 获取特定单元（兼容性API，现在可以处理大单元或小单元）
router.get('/units/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;

    // 首先尝试查找大单元
    let unit = await Unit.findByPk(unitId);
    let isUnit = true;

    // 如果不是大单元，尝试查找小单元
    if (!unit) {
      unit = await Course.findByPk(unitId);
      isUnit = false;
    }

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${unitId} 的单元`
      });
    }

    let enhancedUnit;

    if (isUnit) {
      // 处理大单元
      const unitData = unit.toJSON();

      // 获取属于该大单元的小单元
      const courses = await Course.findAll({
        where: { unitId: unit.id },
        order: [['order', 'ASC']]
      });

      // 计算总练习题数量
      let totalExercisesCount = 0;
      for (const course of courses) {
        const exercisesCount = await Exercise.count({
          where: { unitId: course.id }
        });
        totalExercisesCount += exercisesCount;
      }

      unitData.iconUrl = getIconUrlByTitle(unit.title);
      unitData.isMajor = true;
      unitData.level = courses.length > 0 ? courses[0].level : 1;

      enhancedUnit = {
        ...unitData,
        exercisesCount: totalExercisesCount,
        courses: courses,
      };
    } else {
      // 处理小单元
      const courseData = unit.toJSON();

      // 获取该小单元的练习题数量
      const exercisesCount = await Exercise.count({
        where: { unitId: unit.id }
      });

      courseData.iconUrl = getIconUrlByTitle(unit.title);
      courseData.isMajor = false;

      enhancedUnit = {
        ...courseData,
        exercisesCount,
      };
    }

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

// 获取大单元的小单元列表
router.get('/units/:unitId/courses', async (req, res) => {
  try {
    const { unitId } = req.params;

    // 检查大单元是否存在
    const unit = await Unit.findByPk(unitId);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: `未找到ID为 ${unitId} 的大单元`
      });
    }

    // 获取该大单元的所有小单元
    const courses = await Course.findAll({
      where: { unitId: unitId },
      order: [['order', 'ASC']]
    });

    // 为每个小单元添加额外信息
    const enhancedCourses = await Promise.all(courses.map(async course => {
      const courseData = course.toJSON();

      // 获取该小单元的练习题数量
      const exercisesCount = await Exercise.count({
        where: { unitId: course.id }
      });

      courseData.iconUrl = getIconUrlByTitle(course.title);
      courseData.isMajor = false;

      return {
        ...courseData,
        exercisesCount,
      };
    }));

    res.json({
      success: true,
      data: enhancedCourses
    });
  } catch (error) {
    console.error('获取小单元列表出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 