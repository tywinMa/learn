const { Course, Subject, User, Exercise } = require('../models');
const { Op } = require('sequelize');

// 获取课程列表（支持分页、按课程号/课程名称/学科分类查询）
const getCourses = async (req, res) => {
  try {
    const { 
      page = 1,
      limit = 10, 
      courseCode, 
      name, 
      subjectId,
      sort = 'id',
      order = 'ASC'
    } = req.query;
    
    const whereClause = {};
    
    if (courseCode) {
      whereClause.courseCode = { [Op.like]: `%${courseCode}%` };
    }
    
    if (name) {
      whereClause.name = { [Op.like]: `%${name}%` };
    }
    
    if (subjectId) {
      whereClause.subjectId = subjectId;
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
          as: 'subject',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        },
        {
          model: Exercise,
          as: 'relatedExercise',
          attributes: ['id', 'title', 'description', 'exerciseCode'],
          required: false
        }
      ],
      attributes: {
        include: ['id', 'courseCode', 'name', 'description', 'content', 'credits', 'hours', 'isVisible', 'sources', 'createdAt', 'updatedAt', 'subjectId', 'teacherId', 'related_exercise_id']
      }
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
          as: 'subject',
          attributes: ['id', 'name', 'code', 'color']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        },
        {
          model: Exercise,
          as: 'relatedExercise',
          attributes: ['id', 'title', 'description', 'exerciseCode'],
          required: false
        }
      ],
      attributes: {
        include: ['id', 'courseCode', 'name', 'description', 'content', 'credits', 'hours', 'isVisible', 'sources', 'createdAt', 'updatedAt', 'subjectId', 'teacherId', 'related_exercise_id']
      }
    });
    
    if (!course) {
      return res.status(404).json({ 
        err_no: 404,
        message: '课程不存在',
        data: null
      });
    }
    
    console.log(`返回课程数据 ID=${id}, 包含content字段: ${course.content ? '是' : '否'}, content长度: ${course.content ? course.content.length : 0}`);
    
    res.json({
      err_no: 0,
      data: course
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
    
    // 根据学科代码查找学科
    const subject = await Subject.findOne({ 
      where: { code: subjectCode.toUpperCase() }
    });
    
    if (!subject) {
      return res.status(404).json({ 
        err_no: 404,
        message: `学科代码 ${subjectCode} 不存在`,
        data: []
      });
    }
    
    // 查找该学科下的所有课程
    const courses = await Course.findAll({
      where: { subjectId: subject.id },
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        },
        {
          model: Exercise,
          as: 'relatedExercise',
          attributes: ['id', 'title', 'description', 'exerciseCode'],
          required: false
        }
      ],
      order: [['courseCode', 'ASC']]
    });
    
    res.json({
      err_no: 0,
      data: courses
    });
  } catch (error) {
    console.error(`获取学科(${subjectCode})课程列表错误:`, error);
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
      courseCode, 
      name, 
      description, 
      content,
      credits, 
      hours, 
      isVisible, 
      subjectId, 
      sources,
      relatedExerciseId
    } = req.body;
    
    // 调试日志：检查是否收到content字段
    console.log(`创建课程 - 收到content字段: ${content ? '是' : '否'}, 长度: ${content ? content.length : 0}`);
    console.log(`创建课程 - content样本: ${content ? content.substring(0, 100) + '...' : '无内容'}`);
    
    // 获取当前用户信息（通过auth中间件设置）
    const currentUser = req.user;
    
    // 使用当前用户ID作为教师ID
    const teacherId = currentUser ? currentUser.id : null;
    
    // 验证必填字段
    if (!courseCode || !name || !subjectId) {
      return res.status(400).json({
        err_no: 400, 
        message: '课程编号、课程名称和学科分类为必填项',
        data: null
      });
    }
    
    // 检查课程编号是否已存在
    const existingCourse = await Course.findOne({ where: { courseCode } });
    if (existingCourse) {
      return res.status(400).json({
        err_no: 400, 
        message: '课程编号已存在',
        data: null
      });
    }
    
    // 检查学科是否存在
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(400).json({
        err_no: 400, 
        message: '学科不存在',
        data: null
      });
    }
    
    // 检查教师是否存在（使用当前用户）
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher) {
        return res.status(400).json({
          err_no: 400, 
          message: '指定的教师不存在',
          data: null
        });
      }
    }
    
    // 检查关联习题是否存在（如果提供了）
    if (relatedExerciseId) {
      // 如果relatedExerciseId是exerciseCode格式（如E10001），则按exerciseCode查找
      // 如果是数字ID，则按主键查找
      let exercise;
      if (relatedExerciseId.toString().startsWith('E')) {
        exercise = await Exercise.findOne({ where: { exerciseCode: relatedExerciseId } });
      } else {
        exercise = await Exercise.findByPk(relatedExerciseId);
      }
      
      if (!exercise) {
        return res.status(400).json({
          err_no: 400, 
          message: `关联习题不存在: ${relatedExerciseId}`,
          data: null
        });
      }
    }
    
    // 验证sources是否为有效的数组格式
    let parsedSources = [];
    if (sources) {
      if (typeof sources === 'string') {
        try {
          parsedSources = JSON.parse(sources);
        } catch (e) {
          return res.status(400).json({
            err_no: 400,
            message: 'sources必须是有效的JSON数组',
            data: null
          });
        }
      } else if (Array.isArray(sources)) {
        parsedSources = sources;
      } else {
        return res.status(400).json({
          err_no: 400,
          message: 'sources必须是数组',
          data: null
        });
      }
      
      // 验证数组中的每个对象是否有效
      for (const item of parsedSources) {
        if (!item.type || !item.url || !['image', 'video'].includes(item.type)) {
          return res.status(400).json({
            err_no: 400,
            message: 'sources中每个项必须包含type(image或video)和url字段',
            data: null
          });
        }
      }
    }
    
    // 创建课程对象
    const courseData = {
      courseCode,
      name,
      description,
      content, // 确保content字段被包含
      credits,
      hours,
      isVisible,
      subjectId,
      teacherId,
      sources: parsedSources,
      relatedExerciseId
    };
    
    console.log("创建课程 - 最终数据:", {
      ...courseData,
      content: courseData.content ? `长度: ${courseData.content.length}` : '无内容'
    });
    
    const course = await Course.create(courseData);
    
    // 验证content是否成功保存
    const savedCourse = await Course.findByPk(course.id);
    console.log(`创建课程 - 保存后的content字段: ${savedCourse.content ? '有值' : '无值'}, 长度: ${savedCourse.content ? savedCourse.content.length : 0}`);
    console.log(`创建课程 - 保存后的content样本: ${savedCourse.content ? savedCourse.content.substring(0, 100) + '...' : '无内容'}`);
    
    // 获取包含关联数据的课程信息
    const courseWithRelations = await Course.findByPk(course.id, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name', 'code', 'color']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        },
        {
          model: Exercise,
          as: 'relatedExercise',
          attributes: ['id'],
          required: false
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
      courseCode, 
      name, 
      description, 
      content,
      credits, 
      hours, 
      isVisible, 
      subjectId, 
      teacherId,
      sources,
      relatedExerciseId
    } = req.body;
    
    // 调试日志：检查是否收到content字段
    console.log(`更新课程(ID:${id}) - 收到content字段: ${content ? '是' : '否'}, 长度: ${content ? content.length : 0}`);
    console.log(`更新课程(ID:${id}) - content样本: ${content ? content.substring(0, 100) + '...' : '无内容'}`);
    
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({
        err_no: 404, 
        message: '课程不存在',
        data: null
      });
    }
    
    // 如果更改了课程编号，检查是否已存在
    if (courseCode && courseCode !== course.courseCode) {
      const existingCourse = await Course.findOne({ where: { courseCode } });
      if (existingCourse) {
        return res.status(400).json({
          err_no: 400, 
          message: '课程编号已存在',
          data: null
        });
      }
    }
    
    // 检查学科是否存在（如果更改了）
    if (subjectId && subjectId !== course.subjectId) {
      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
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
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({
          err_no: 400, 
          message: '教师不存在或用户不是教师角色',
          data: null
        });
      }
    }
    
    // 检查关联习题是否存在（如果更改了）
    if (relatedExerciseId && relatedExerciseId !== course.relatedExerciseId) {
      // 如果relatedExerciseId是exerciseCode格式（如E10001），则按exerciseCode查找
      // 如果是数字ID，则按主键查找
      let exercise;
      if (relatedExerciseId.toString().startsWith('E')) {
        exercise = await Exercise.findOne({ where: { exerciseCode: relatedExerciseId } });
      } else {
        exercise = await Exercise.findByPk(relatedExerciseId);
      }
      
      if (!exercise) {
        return res.status(400).json({
          err_no: 400, 
          message: `关联习题不存在: ${relatedExerciseId}`,
          data: null
        });
      }
    }
    
    // 验证sources是否为有效的数组格式
    let parsedSources = undefined;
    if (sources !== undefined) {
      parsedSources = [];
      if (typeof sources === 'string') {
        try {
          parsedSources = JSON.parse(sources);
        } catch (e) {
          return res.status(400).json({
            err_no: 400,
            message: 'sources必须是有效的JSON数组',
            data: null
          });
        }
      } else if (Array.isArray(sources)) {
        parsedSources = sources;
      } else {
        return res.status(400).json({
          err_no: 400,
          message: 'sources必须是数组',
          data: null
        });
      }
      
      // 验证数组中的每个对象是否有效
      for (const item of parsedSources) {
        if (!item.type || !item.url || !['image', 'video'].includes(item.type)) {
          return res.status(400).json({
            err_no: 400,
            message: 'sources中每个项必须包含type(image或video)和url字段',
            data: null
          });
        }
      }
    }
    
    // 准备更新数据
    const updateData = {
      courseCode: courseCode || course.courseCode,
      name: name || course.name,
      description: description !== undefined ? description : course.description,
      content: content !== undefined ? content : course.content, // 确保content字段被正确处理
      credits: credits !== undefined ? credits : course.credits,
      hours: hours !== undefined ? hours : course.hours,
      isVisible: isVisible !== undefined ? isVisible : course.isVisible,
      subjectId: subjectId || course.subjectId,
      teacherId: teacherId !== undefined ? teacherId : course.teacherId,
      sources: parsedSources !== undefined ? parsedSources : course.sources,
      relatedExerciseId: relatedExerciseId !== undefined ? relatedExerciseId : course.relatedExerciseId
    };
    
    console.log("更新课程 - 最终数据:", {
      ...updateData,
      content: updateData.content ? `长度: ${updateData.content.length}` : '无内容'
    });
    
    // 更新课程
    await course.update(updateData);
    
    // 验证content是否成功保存
    const updatedCourseCheck = await Course.findByPk(id);
    console.log(`更新课程(ID:${id}) - 更新后的content字段: ${updatedCourseCheck.content ? '有值' : '无值'}, 长度: ${updatedCourseCheck.content ? updatedCourseCheck.content.length : 0}`);
    console.log(`更新课程(ID:${id}) - 更新后的content样本: ${updatedCourseCheck.content ? updatedCourseCheck.content.substring(0, 100) + '...' : '无内容'}`);
    
    // 获取更新后的课程（包含关联数据）
    const updatedCourse = await Course.findByPk(id, {
      include: [
        {
          model: Subject,
          as: 'subject',
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