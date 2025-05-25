const { Exercise, Course, Unit } = require('../../models');

// 获取所有练习题
exports.getAllExercises = async (req, res) => {
  try {
    const exercises = await Exercise.findAll({
      include: [
        { 
          model: Course, 
          as: 'course',
          attributes: ['id', 'name', 'courseCode']
        },
        { 
          model: Unit, 
          as: 'unit',
          attributes: ['id', 'title']
        }
      ]
    });
    
    // 转换为前端期望的格式
    const formattedExercises = exercises.map(exercise => {
      // 使用自定义exerciseCode作为ID
      const uniqueId = exercise.exerciseCode || `exercise-${exercise.id}`;
      
      return {
        id: uniqueId,
        exerciseCode: exercise.exerciseCode,
        title: exercise.title,
        description: exercise.description,
        subject: exercise.subject,
        author: exercise.author || null,
        content: exercise.content,
        courseId: exercise.courseId,
        unitId: exercise.unitId,
        createdAt: exercise.createdAt.toISOString(),
        updatedAt: exercise.updatedAt.toISOString(),
        course: exercise.course ? {
          id: exercise.course.id,
          name: exercise.course.name
        } : undefined,
        unit: exercise.unit ? {
          id: exercise.unit.id,
          title: exercise.unit.title
        } : undefined
      };
    });
    
    return res.status(200).json({
      err_no: 0,
      data: formattedExercises
    });
  } catch (error) {
    console.error('获取练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message 
    });
  }
};

// 按课程ID获取练习题
exports.getExercisesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const exercises = await Exercise.findAll({
      where: { courseId },
      include: [{ model: Unit, as: 'unit' }]
    });
    return res.status(200).json({
      err_no: 0,
      data: exercises || []
    });
  } catch (error) {
    console.error('获取课程练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 按单元ID获取练习题
exports.getExercisesByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const exercises = await Exercise.findAll({
      where: { unitId },
      include: [{ model: Course, as: 'course' }]
    });
    return res.status(200).json({
      err_no: 0,
      data: exercises || []
    });
  } catch (error) {
    console.error('获取单元练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 获取单个练习题
exports.getExerciseById = async (req, res) => {
  try {
    let { id } = req.params;
    
    let exercise;
    
    // 判断是否是exerciseCode格式（如E10001）
    if (typeof id === 'string' && id.match(/^E\d+$/)) {
      // 通过exerciseCode查询
      exercise = await Exercise.findOne({
        where: { exerciseCode: id },
        include: [
          { model: Course, as: 'course' },
          { model: Unit, as: 'unit' }
        ]
      });
    } else {
      // 处理exercise-前缀的ID格式，提取真实的数字ID
      if (typeof id === 'string' && id.startsWith('exercise-')) {
        id = id.replace('exercise-', '');
      }
      
      // 确保ID是数字
      const exerciseId = parseInt(id);
      if (isNaN(exerciseId)) {
        return res.status(400).json({ 
          err_no: 400,
          message: '无效的习题ID',
          data: null
        });
      }
      
      // 通过数字ID查询
      exercise = await Exercise.findByPk(exerciseId, {
        include: [
          { model: Course, as: 'course' },
          { model: Unit, as: 'unit' }
        ]
      });
    }
    
    if (!exercise) {
      return res.status(404).json({ 
        err_no: 404,
        message: '练习题不存在',
        data: null
      });
    }
    
    // 返回统一格式的数据
    const responseData = {
      id: exercise.exerciseCode || `exercise-${exercise.id}`,
      exerciseCode: exercise.exerciseCode,
      title: exercise.title,
      description: exercise.description,
      subject: exercise.subject,
      author: exercise.author || null,
      content: exercise.content,
      courseId: exercise.courseId,
      unitId: exercise.unitId,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      course: exercise.course,
      unit: exercise.unit
    };
    
    return res.status(200).json({
      err_no: 0,
      data: responseData
    });
  } catch (error) {
    console.error('获取练习题详情失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 创建练习题
exports.createExercise = async (req, res) => {
  try {
    const { 
      title,
      description,
      subject,
      content,
      courseId,
      unitId
    } = req.body;
    
    console.log('创建习题组:', { title, subject, contentCount: content?.length });
    
    // 验证必填字段
    if (!title || !title.trim()) {
      return res.status(400).json({ 
        err_no: 400,
        message: '习题标题不能为空',
        data: null
      });
    }
    
    if (!subject || !subject.trim()) {
      return res.status(400).json({ 
        err_no: 400,
        message: '所属学科不能为空',
        data: null
      });
    }
    
    // 验证content数组
    if (!Array.isArray(content) || content.length === 0) {
      return res.status(400).json({ 
        err_no: 400,
        message: '习题内容不能为空',
        data: null
      });
    }
    
    // 验证content中每个习题的必填字段
    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      if (!item.question || !item.type) {
        return res.status(400).json({ 
          err_no: 400,
          message: `第${i + 1}道题缺少必填字段`,
          data: null
        });
      }
    }
    
    // 如果提供了courseId，检查课程是否存在
    if (courseId) {
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ 
          err_no: 404,
          message: '课程不存在',
          data: null
        });
      }
    }
    
    // 如果提供了unitId，检查单元是否存在
    if (unitId) {
      const unit = await Unit.findByPk(unitId);
      if (!unit) {
        return res.status(404).json({ 
          err_no: 404,
          message: '单元不存在',
          data: null
        });
      }
      if (courseId && unit.courseId !== parseInt(courseId)) {
        return res.status(400).json({ 
          err_no: 400,
          message: '单元不属于指定课程',
          data: null
        });
      }
    }
    
    // 手动生成exerciseCode
    const prefix = 'E';
    const lastExercise = await Exercise.findOne({
      where: {
        exerciseCode: {
          [require('sequelize').Op.like]: `${prefix}%`
        }
      },
      order: [['exerciseCode', 'DESC']]
    });
    
    let nextNumber = 10001;
    if (lastExercise && lastExercise.exerciseCode) {
      const lastNumber = parseInt(lastExercise.exerciseCode.replace(prefix, ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    const exerciseCode = `${prefix}${nextNumber}`;
    
    // 获取当前登录用户作为作者（如果有认证信息的话）
    const author = req.user ? (req.user.username || req.user.name || req.user.id) : '系统';
    
    const exercise = await Exercise.create({
      exerciseCode: exerciseCode,
      title: title.trim(),
      description: description ? description.trim() : null,
      subject: subject.trim(),
      content: content,
      author: author,
      courseId,
      unitId
    });
    
    return res.status(201).json({
      err_no: 0,
      data: {
        id: exercise.exerciseCode,
        exerciseCode: exercise.exerciseCode,
        title: exercise.title,
        description: exercise.description,
        subject: exercise.subject,
        author: exercise.author,
        content: exercise.content,
        courseId: exercise.courseId,
        unitId: exercise.unitId,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt
      }
    });
    
  } catch (error) {
    console.error('创建练习题失败:', error);
    console.error('错误详情:', error.name, error.message);
    console.error('错误堆栈:', error.stack);
    if (error.errors) {
      console.error('验证错误详情:', error.errors);
      error.errors.forEach(err => {
        console.error('字段错误:', err.path, err.message, err.value);
      });
    }
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message,
      details: error.errors ? error.errors.map(e => ({ field: e.path, message: e.message, value: e.value })) : null
    });
  }
};

// 更新练习题
exports.updateExercise = async (req, res) => {
  try {
    let { id } = req.params;
    
    console.log('更新习题，收到的ID:', id);
    
    // 处理exercise-前缀的ID格式
    if (typeof id === 'string' && id.startsWith('exercise-')) {
      id = id.replace('exercise-', '');
    }
    
    let exercise;
    
    // 尝试通过exerciseCode查找（如果是字符串格式如E10001）
    if (typeof id === 'string' && id.match(/^E\d+$/)) {
      exercise = await Exercise.findOne({
        where: { exerciseCode: id }
      });
      console.log('通过exerciseCode查找:', id, exercise ? '找到' : '未找到');
    } else {
      // 尝试通过数字ID查找
      const exerciseId = parseInt(id);
      if (!isNaN(exerciseId)) {
        exercise = await Exercise.findByPk(exerciseId);
        console.log('通过数字ID查找:', exerciseId, exercise ? '找到' : '未找到');
      }
    }
    
    if (!exercise) {
      return res.status(404).json({ 
        err_no: 404,
        message: '练习题不存在',
        data: null
      });
    }
    
    const { 
      title,
      description,
      subject,
      content,
      question, 
      type, 
      options, 
      answer, 
      correctAnswer, 
      difficulty, 
      explanation, 
      unitId, 
      courseId 
    } = req.body;
    
    console.log('更新数据:', { title, description, subject, contentLength: content?.length });
    
    // 如果更改了课程，检查课程是否存在
    if (courseId && courseId !== exercise.courseId) {
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ 
          err_no: 404,
          message: '课程不存在',
          data: null
        });
      }
    }
    
    // 如果更改了单元，检查单元是否存在并属于正确的课程
    if (unitId && unitId !== exercise.unitId) {
      const unit = await Unit.findByPk(unitId);
      if (!unit) {
        return res.status(404).json({ 
          err_no: 404,
          message: '单元不存在',
          data: null
        });
      }
      
      const targetCourseId = courseId || exercise.courseId;
      if (targetCourseId && unit.courseId !== parseInt(targetCourseId)) {
        return res.status(400).json({ 
          err_no: 400,
          message: '单元不属于指定课程',
          data: null
        });
      }
    }
    
    // 准备更新数据，优先使用新格式的字段（title, description, subject, content）
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (content !== undefined) updateData.content = content;
    
    // 兼容旧格式的字段
    if (question !== undefined) updateData.question = question;
    if (type !== undefined) updateData.type = type;
    if (options !== undefined) updateData.options = options;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (unitId !== undefined) updateData.unitId = unitId;
    if (courseId !== undefined) updateData.courseId = courseId;
    
    // 处理答案字段，优先使用correctAnswer，如果没有则使用answer
    const finalAnswer = correctAnswer !== undefined ? correctAnswer : answer;
    if (finalAnswer !== undefined) updateData.answer = finalAnswer;
    
    await exercise.update(updateData);
    
    // 重新获取更新后的数据，确保返回最新的信息
    await exercise.reload();
    
    return res.status(200).json({
      err_no: 0,
      data: {
        id: exercise.exerciseCode,
        exerciseCode: exercise.exerciseCode,
        title: exercise.title,
        description: exercise.description,
        subject: exercise.subject,
        author: exercise.author,
        content: exercise.content,
        courseId: exercise.courseId,
        unitId: exercise.unitId,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt
      }
    });
  } catch (error) {
    console.error('更新练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 删除练习题
exports.deleteExercise = async (req, res) => {
  try {
    let { id } = req.params;
    
    console.log('删除习题，收到的ID:', id);
    
    // 处理exercise-前缀的ID格式
    if (typeof id === 'string' && id.startsWith('exercise-')) {
      id = id.replace('exercise-', '');
    }
    
    let exercise;
    
    // 尝试通过exerciseCode查找（如果是字符串格式如E10001）
    if (typeof id === 'string' && id.match(/^E\d+$/)) {
      exercise = await Exercise.findOne({
        where: { exerciseCode: id }
      });
      console.log('通过exerciseCode查找:', id, exercise ? '找到' : '未找到');
    } else {
      // 尝试通过数字ID查找
      const exerciseId = parseInt(id);
      if (!isNaN(exerciseId)) {
        exercise = await Exercise.findByPk(exerciseId);
        console.log('通过数字ID查找:', exerciseId, exercise ? '找到' : '未找到');
      }
    }
    
    if (!exercise) {
      return res.status(404).json({ 
        err_no: 404,
        message: '练习题不存在',
        data: null
      });
    }
    
    await exercise.destroy();
    return res.status(200).json({ 
      err_no: 0,
      message: '练习题已删除',
      data: null
    });
  } catch (error) {
    console.error('删除练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}; 