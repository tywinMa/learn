const { Course, Subject, User, Exercise, ExerciseGroup } = require('../../models');
const { Op } = require('sequelize');



// 获取课程列表（支持分页、按课程号/课程名称/学科分类查询）
const getCourses = async (req, res) => {
  try {
    const { 
      page = 1,
      limit = 10, 
      courseCode, 
      name, 
      subject,
      sort = 'id',
      order = 'ASC'
    } = req.query;
    
    const whereClause = {};
    
    if (courseCode) {
      whereClause.id = { [Op.like]: `%${courseCode}%` };
    }
    
    if (name) {
      whereClause.title = { [Op.like]: `%${name}%` };
    }
    
    if (subject) {
      whereClause.subject = subject;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Course.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order]],
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.json({
      err_no: 0,
      data: {
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        courses: rows
      }
    });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message 
    });
  }
};

// 获取课程详情
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findByPk(id, {
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code', 'color']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!course) {
      return res.status(404).json({ 
        err_no: 404,
        message: '课程不存在',
        data: null
      });
    }
    
    const courseData = course.toJSON();
    
    // 获取关联的习题组详情（包含习题）
    const exerciseGroupIds = courseData.exerciseGroupIds || [];
    let exerciseGroups = [];
    let exercises = [];
    
    if (exerciseGroupIds.length > 0) {
      exerciseGroups = await ExerciseGroup.findAll({
        where: { 
          id: { [Op.in]: exerciseGroupIds },
          isActive: true
        },
        attributes: ['id', 'name', 'description', 'exerciseIds']
      });
      
      // 获取所有关联习题的详情，去重
      const allExerciseIds = [...new Set(exerciseGroups.flatMap(group => group.exerciseIds || []))];
      if (allExerciseIds.length > 0) {
        exercises = await Exercise.findAll({
          where: { id: { [Op.in]: allExerciseIds } },
          attributes: ['id', 'title', 'type', 'difficulty'],
          order: [['id', 'ASC']]
        });
      }
    }
    
    courseData.exerciseGroups = exerciseGroups;
    courseData.exercises = exercises;
    
    res.json({
      err_no: 0,
      data: courseData
    });
  } catch (error) {
    console.error('获取课程详情错误:', error);
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message 
    });
  }
};

// 根据学科代码获取课程列表
const getCoursesBySubject = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    
    // 查找该学科下的所有课程
    const courses = await Course.findAll({
      where: { subject: subjectCode },
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        }
      ],
      order: [['id', 'ASC']]
    });
    
    res.json({
      err_no: 0,
      data: courses
    });
  } catch (error) {
    console.error(`获取学科(${req.params.subjectCode})课程列表错误:`, error);
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message 
    });
  }
};

// 创建课程
const createCourse = async (req, res) => {
  try {
    const { 
      id,
      title, 
      description, 
      content,
      subject,
      isPublished = true,
      unitType = 'normal',
      position = 'default',
      media = [],
      exampleMedia = [],
      exerciseGroupIds = []
    } = req.body;
    
    // 获取当前用户信息（通过auth中间件设置）
    const currentUser = req.user;
    
    // 使用当前用户ID作为教师ID
    const teacherId = currentUser ? currentUser.id : null;
    
    // 验证必填字段
    if (!id || !title || !subject) {
      return res.status(400).json({
        err_no: 400, 
        message: '课程ID、课程标题和学科分类为必填项',
        data: null
      });
    }
    
    // 检查课程ID是否已存在
    const existingCourse = await Course.findByPk(id);
    if (existingCourse) {
      return res.status(400).json({
        err_no: 400, 
        message: '课程ID已存在',
        data: null
      });
    }
    
    // 检查学科是否存在
    const subjectRecord = await Subject.findOne({ where: { code: subject } });
    if (!subjectRecord) {
      return res.status(400).json({
        err_no: 400, 
        message: '学科不存在',
        data: null
      });
    }
    
    // 检查teacherId是否存在（如果提供了）
    if (teacherId) {
      const teacherRecord = await User.findByPk(teacherId);
      if (!teacherRecord) {
        return res.status(400).json({
          err_no: 400, 
          message: `教师ID "${teacherId}" 不存在`,
          data: null
        });
      }
    }
    
    // 验证习题组是否存在
    if (exerciseGroupIds.length > 0) {
      const exerciseGroups = await ExerciseGroup.findAll({
        where: { 
          id: { [Op.in]: exerciseGroupIds },
          isActive: true
        }
      });
      if (exerciseGroups.length !== exerciseGroupIds.length) {
        return res.status(400).json({
          err_no: 400, 
          message: '部分习题组不存在或已禁用',
          data: null
        });
      }
    }
    
    // 创建课程对象
    const courseData = {
      id,
      title,
      description,
      content,
      subject,
      isPublished,
      unitType,
      position,
      media,
      exampleMedia,
      teacherId,
      exerciseGroupIds
    };
    
    const course = await Course.create(courseData);
    
    // 获取包含关联数据的课程信息
    const courseWithRelations = await Course.findByPk(course.id, {
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code', 'color']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.status(201).json({
      err_no: 0,
      message: '课程创建成功',
      data: courseWithRelations
    });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(500).json({
      err_no: 500, 
      message: '服务器错误', 
      error: error.message
    });
  }
};

// 更新课程
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      content,
      subject,
      isPublished,
      unitType,
      position,
      media,
      exampleMedia,
      teacherId,
      exerciseGroupIds
    } = req.body;
    
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({
        err_no: 404, 
        message: '课程不存在',
        data: null
      });
    }
    
    // 检查学科是否存在（如果更改了）
    if (subject && subject !== course.subject) {
      const subjectRecord = await Subject.findOne({ where: { code: subject } });
      if (!subjectRecord) {
        return res.status(400).json({
          err_no: 400, 
          message: '学科不存在',
          data: null
        });
      }
    }
    
    // 检查教师是否存在（如果更改了）
    if (teacherId && teacherId !== course.teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher) {
        return res.status(400).json({
          err_no: 400, 
          message: '教师不存在',
          data: null
        });
      }
    }
    
    // 验证习题组是否存在（如果更改了）
    if (exerciseGroupIds && exerciseGroupIds.length > 0) {
      const exerciseGroups = await ExerciseGroup.findAll({
        where: { 
          id: { [Op.in]: exerciseGroupIds },
          isActive: true
        }
      });
      if (exerciseGroups.length !== exerciseGroupIds.length) {
        return res.status(400).json({
          err_no: 400, 
          message: '部分习题组不存在或已禁用',
          data: null
        });
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (subject !== undefined) updateData.subject = subject;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (unitType !== undefined) updateData.unitType = unitType;
    if (position !== undefined) updateData.position = position;
    if (media !== undefined) updateData.media = media;
    if (exampleMedia !== undefined) updateData.exampleMedia = exampleMedia;
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (exerciseGroupIds !== undefined) updateData.exerciseGroupIds = exerciseGroupIds;
    
    // 调试：输出例题媒体资源的更新情况
    console.log('后端收到的例题媒体资源数据:', exampleMedia);
    console.log('例题媒体资源是否会被更新:', exampleMedia !== undefined);
    console.log('准备更新的数据字段:', Object.keys(updateData));
    
    // 更新课程
    await course.update(updateData);
    
    // 获取更新后的课程（包含关联数据）
    const updatedCourse = await Course.findByPk(id, {
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.json({
      err_no: 0,
      message: '课程更新成功',
      data: updatedCourse
    });
  } catch (error) {
    console.error('更新课程错误:', error);
    res.status(500).json({
      err_no: 500, 
      message: '服务器错误', 
      error: error.message
    });
  }
};

// 删除课程
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({
        err_no: 404,
        message: '课程不存在',
        data: null
      });
    }
    
    // 注意：课程现在是独立存在的，Exercise模型没有unitId字段
    // 如果需要检查关联，应该检查是否有Unit引用了这个课程ID
    // 这里先简化处理，允许直接删除
    
    await course.destroy();
    
    res.json({
      err_no: 0,
      message: '课程删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除课程错误:', error);
    res.status(500).json({
      err_no: 500,
      message: '服务器错误', 
      error: error.message
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  getCoursesBySubject,
  createCourse,
  updateCourse,
  deleteCourse
}; 