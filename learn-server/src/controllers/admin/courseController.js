const { Course, Subject, User, Exercise, Grade } = require('../../models');
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
          as: 'subjectInfo',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        },
        {
          model: Grade,
          as: 'grade',
          attributes: ['id', 'name', 'order']
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
          as: 'subjectInfo',
          attributes: ['id', 'name', 'code', 'color']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        },
        {
          model: Grade,
          as: 'grade',
          attributes: ['id', 'name', 'order']
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
    
    // 获取关联的习题详情
    const exerciseIds = courseData.exerciseIds || [];
    let exercises = [];
    
    if (exerciseIds.length > 0) {
      exercises = await Exercise.findAll({
        where: { id: { [Op.in]: exerciseIds } },
        attributes: ['id', 'title', 'type', 'difficulty', 'question', 'options', 'correctAnswer', 'explanation'],
        order: [['id', 'ASC']]
      });
    }
    
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
          as: 'subjectInfo',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        },
        {
          model: Grade,
          as: 'grade',
          attributes: ['id', 'name', 'order']
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
      exerciseIds = []
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
    
    // 验证习题是否存在
    if (exerciseIds.length > 0) {
      const exercises = await Exercise.findAll({
        where: { 
          id: { [Op.in]: exerciseIds }
        }
      });
      if (exercises.length !== exerciseIds.length) {
        return res.status(400).json({
          err_no: 400, 
          message: '部分习题不存在',
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
      teacherId,
      exerciseIds
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
      teacherId,
      exerciseIds
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
    
    // 验证习题是否存在（如果更改了）
    if (exerciseIds && exerciseIds.length > 0) {
      const exercises = await Exercise.findAll({
        where: { 
          id: { [Op.in]: exerciseIds }
        }
      });
      if (exercises.length !== exerciseIds.length) {
        return res.status(400).json({
          err_no: 400, 
          message: '部分习题不存在',
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
    if (teacherId !== undefined) updateData.teacherId = teacherId;
    if (exerciseIds !== undefined) updateData.exerciseIds = exerciseIds;
    
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