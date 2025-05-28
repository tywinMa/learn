const express = require('express');
const router = express.Router();
const { Subject, Unit, Course, Exercise, ExerciseGroup } = require('../models');
const { Op } = require('sequelize');

// 通过课程获取习题数量的辅助函数
const getExerciseCountByCourse = async (courseId) => {
  try {
    // 获取课程信息
    const course = await Course.findByPk(courseId);
    if (!course) {
      return 0;
    }
    
    const exerciseGroupIds = course.exerciseGroupIds || [];
    if (exerciseGroupIds.length === 0) {
      // 回退到原有逻辑：直接统计unitId关联的习题
      return await Exercise.count({
        where: { unitId: courseId }
      });
    }
    
    // 获取习题组
    const exerciseGroups = await ExerciseGroup.findAll({
      where: { 
        id: { [Op.in]: exerciseGroupIds },
        isActive: true
      }
    });
    
    // 合并所有习题组的习题ID并去重
    const exerciseIdsFromGroups = exerciseGroups.flatMap(group => group.exerciseIds || []);
    const allExerciseIds = [...new Set(exerciseIdsFromGroups)];
    
    if (allExerciseIds.length === 0) {
      return 0;
    }
    
    // 统计习题数量
    return await Exercise.count({
      where: { id: { [Op.in]: allExerciseIds } }
    });
  } catch (error) {
    console.error('通过课程获取习题数量出错:', error);
    // 出错时回退到原有逻辑
    return await Exercise.count({
      where: { unitId: courseId }
    });
  }
};

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

// 获取特定学科的单元结构
router.get('/:code/units', async (req, res) => {
  try {
    const { code } = req.params;

    // 查询学科
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
    const allCourses = await Course.findAll({
      where: { subject: subject.code }
    });

    // 构建结构化数据
    const structuredData = await Promise.all(units.map(async unit => {
      // 根据Unit的courseIds数组按顺序获取小单元
      const courseIds = unit.courseIds || [];
      const unitCourses = courseIds.map(courseId => 
        allCourses.find(course => course.id === courseId)
      ).filter(course => course !== undefined);

      // 为每个小单元添加练习题数量
      const courses = await Promise.all(unitCourses.map(async course => {
        const exercisesCount = await getExerciseCountByCourse(course.id);

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          unitType: course.unitType,
          position: course.position,
          exercisesCount
        };
      }));

      // 计算大单元总练习题数量
      const totalExercisesCount = courses.reduce((sum, course) => sum + course.exercisesCount, 0);

      return {
        id: unit.id,
        title: unit.title,
        description: unit.description,
        color: unit.color,
        secondaryColor: unit.secondaryColor,
        exercisesCount: totalExercisesCount,
        courses: courses
      };
    }));

    res.json({
      success: true,
      data: structuredData
    });
  } catch (error) {
    console.error('获取学科单元出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取特定单元详情
router.get('/units/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;

    // 首先尝试查找大单元
    let unit = await Unit.findByPk(unitId);
    
    if (unit) {
      // 处理大单元
      const courseIds = unit.courseIds || [];
      const allCourses = await Course.findAll({
        where: { unitId: unit.id }
      });
      
      // 按courseIds数组的顺序排列小单元
      const courses = courseIds.map(courseId => 
        allCourses.find(course => course.id === courseId)
      ).filter(course => course !== undefined);

      // 为每个小单元添加练习题数量
      const coursesWithExercises = await Promise.all(courses.map(async course => {
        const exercisesCount = await getExerciseCountByCourse(course.id);

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          unitType: course.unitType,
          position: course.position,
          exercisesCount
        };
      }));

      const totalExercisesCount = coursesWithExercises.reduce((sum, course) => sum + course.exercisesCount, 0);

      return res.json({
        success: true,
        data: {
          id: unit.id,
          title: unit.title,
          description: unit.description,
          color: unit.color,
          secondaryColor: unit.secondaryColor,
          exercisesCount: totalExercisesCount,
          courses: coursesWithExercises
        }
      });
    }

    // 尝试查找小单元
    const course = await Course.findByPk(unitId);
    if (course) {
      const exercisesCount = await getExerciseCountByCourse(course.id);

      return res.json({
        success: true,
        data: {
          id: course.id,
          title: course.title,
          description: course.description,
          unitType: course.unitType,
          position: course.position,
          exercisesCount
        }
      });
    }

    // 都没找到
    res.status(404).json({
      success: false,
      message: `未找到ID为 ${unitId} 的单元`
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

    // 根据大单元的courseIds数组按顺序获取小单元
    const courseIds = unit.courseIds || [];
    const allCourses = await Course.findAll({
      where: { unitId: unitId }
    });
    
    // 按courseIds数组的顺序排列小单元
    const courses = courseIds.map(courseId => 
      allCourses.find(course => course.id === courseId)
    ).filter(course => course !== undefined);

    // 为每个小单元添加练习题数量
    const coursesWithExercises = await Promise.all(courses.map(async course => {
      const exercisesCount = await getExerciseCountByCourse(course.id);

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        unitType: course.unitType,
        position: course.position,
        exercisesCount
      };
    }));

    res.json({
      success: true,
      data: coursesWithExercises
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