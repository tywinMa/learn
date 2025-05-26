const { Exercise, Course, Subject } = require('../../models');

// 获取所有练习题
exports.getAllExercises = async (req, res) => {
  try {
    const { search, subject, difficulty, type } = req.query;
    const whereClause = {};
    
    // 添加搜索条件
    if (search) {
      const { Op } = require('sequelize');
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { question: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // 添加筛选条件
    if (subject) {
      whereClause.subject = subject;
    }
    
    if (difficulty) {
      whereClause.difficulty = parseInt(difficulty);
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    const exercises = await Exercise.findAll({
      where: whereClause,
      include: [
        { 
          model: Course, 
          attributes: ['id', 'title', 'subject', 'unitId']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['id', 'ASC']]
    });
    
    // 转换为前端期望的格式
    const formattedExercises = exercises.map(exercise => {
      return {
        id: exercise.id,
        subject: exercise.subject,
        unitId: exercise.unitId,
        title: exercise.title,
        question: exercise.question,
        options: exercise.options,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
        type: exercise.type,
        difficulty: exercise.difficulty,
        media: exercise.media,
        hints: exercise.hints,
        knowledgePointIds: exercise.knowledgePointIds || [],
        isAI: exercise.isAI,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        // 额外的关联信息
        course: exercise.Course ? {
          id: exercise.Course.id,
          title: exercise.Course.title,
          subject: exercise.Course.subject,
          unitId: exercise.Course.unitId
        } : undefined,
        subjectInfo: exercise.Subject ? {
          id: exercise.Subject.id,
          name: exercise.Subject.name,
          code: exercise.Subject.code
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
      where: { unitId: courseId }, // 注意：在app模型中，练习题通过unitId关联到Course
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['id', 'ASC']]
    });
    
    const formattedExercises = exercises.map(exercise => ({
      id: exercise.id,
      subject: exercise.subject,
      unitId: exercise.unitId,
      title: exercise.title,
      question: exercise.question,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation,
      type: exercise.type,
      difficulty: exercise.difficulty,
      media: exercise.media,
      hints: exercise.hints,
      knowledgePointIds: exercise.knowledgePointIds || [],
      isAI: exercise.isAI,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      subjectInfo: exercise.Subject
    }));
    
    return res.status(200).json({
      err_no: 0,
      data: formattedExercises
    });
  } catch (error) {
    console.error('获取课程练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 按单元ID获取练习题（实际上是按courseId）
exports.getExercisesByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const exercises = await Exercise.findAll({
      where: { unitId }, // 这里的unitId实际上是courseId
      include: [
        { model: Course },
        { model: Subject }
      ],
      order: [['id', 'ASC']]
    });
    
    const formattedExercises = exercises.map(exercise => ({
      id: exercise.id,
      subject: exercise.subject,
      unitId: exercise.unitId,
      title: exercise.title,
      question: exercise.question,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation,
      type: exercise.type,
      difficulty: exercise.difficulty,
      media: exercise.media,
      hints: exercise.hints,
      knowledgePointIds: exercise.knowledgePointIds || [],
      isAI: exercise.isAI,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      course: exercise.Course,
      subjectInfo: exercise.Subject
    }));
    
    return res.status(200).json({
      err_no: 0,
      data: formattedExercises
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
    const { id } = req.params;
    
    const exercise = await Exercise.findByPk(id, {
      include: [
        { model: Course },
        { model: Subject }
      ]
    });
    
    if (!exercise) {
      return res.status(404).json({ 
        err_no: 404,
        message: '练习题不存在',
        data: null
      });
    }
    
    // 返回单个练习题的数据
    const responseData = {
      id: exercise.id,
      subject: exercise.subject,
      unitId: exercise.unitId,
      title: exercise.title,
      question: exercise.question,
      options: exercise.options,
      correctAnswer: exercise.correctAnswer,
      explanation: exercise.explanation,
      type: exercise.type,
      difficulty: exercise.difficulty,
      media: exercise.media,
      hints: exercise.hints,
      knowledgePointIds: exercise.knowledgePointIds || [],
      isAI: exercise.isAI,
      createdAt: exercise.createdAt,
      updatedAt: exercise.updatedAt,
      course: exercise.Course,
      subjectInfo: exercise.Subject
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
      id,
      subject,
      unitId,
      title,
      question,
      options,
      correctAnswer,
      explanation,
      type,
      difficulty,
      media,
      hints,
      knowledgePointIds,
      isAI
    } = req.body;
    
    // 验证必填字段
    if (!subject || !unitId || !title || !question || !type) {
      return res.status(400).json({ 
        err_no: 400,
        message: '缺少必填字段：subject, unitId, title, question, type',
        data: null
      });
    }
    
    // 如果提供了unitId，验证课程是否存在
    const course = await Course.findByPk(unitId);
    if (!course) {
      return res.status(404).json({ 
        err_no: 404,
        message: '课程不存在',
        data: null
      });
    }
    
    // 生成ID（如果没有提供）
    let exerciseId = id;
    if (!exerciseId) {
      // 查找该课程下最大的练习题序号
      const lastExercise = await Exercise.findOne({
        where: { unitId },
        order: [['id', 'DESC']]
      });
      
      let nextNumber = 1;
      if (lastExercise && lastExercise.id) {
        // 从ID中提取序号部分
        const parts = lastExercise.id.split('-');
        const lastNumber = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      exerciseId = `${unitId}-${nextNumber}`;
    }
    
    // 处理选择题的选项格式
    let processedOptions = options;
    if (type === 'choice' && Array.isArray(options)) {
      processedOptions = options.map(option => {
        if (typeof option === 'object' && option.content !== undefined) {
          // 如果是对象格式 {content: "选项A", isCorrect: false}，提取content
          return option.content;
        } else if (typeof option === 'string') {
          // 如果已经是字符串，直接使用
          return option;
        } else {
          // 如果是其他格式，转换为字符串
          return String(option);
        }
      });
    }

    // 创建练习题数据
    const exerciseData = {
      id: exerciseId,
      subject,
      unitId,
      title,
      question,
      options: processedOptions || null,
      correctAnswer: correctAnswer || null,
      explanation: explanation || null,
      type: type || 'choice',
      difficulty: difficulty || 1,
      media: media || null,
      hints: hints || null,
      knowledgePointIds: knowledgePointIds || [],
      isAI: isAI || false
    };
    
    const exercise = await Exercise.create(exerciseData);
    
    // 重新获取创建的练习题，包含关联数据
    const createdExercise = await Exercise.findByPk(exercise.id, {
      include: [
        { model: Course },
        { model: Subject }
      ]
    });
    
    return res.status(201).json({
      err_no: 0,
      data: {
        id: createdExercise.id,
        subject: createdExercise.subject,
        unitId: createdExercise.unitId,
        title: createdExercise.title,
        question: createdExercise.question,
        options: createdExercise.options,
        correctAnswer: createdExercise.correctAnswer,
        explanation: createdExercise.explanation,
        type: createdExercise.type,
        difficulty: createdExercise.difficulty,
        media: createdExercise.media,
        hints: createdExercise.hints,
        knowledgePointIds: createdExercise.knowledgePointIds || [],
        isAI: createdExercise.isAI,
        createdAt: createdExercise.createdAt,
        updatedAt: createdExercise.updatedAt,
        course: createdExercise.Course,
        subjectInfo: createdExercise.Subject
      }
    });
    
  } catch (error) {
    console.error('创建练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message
    });
  }
};

// 更新练习题
exports.updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exercise = await Exercise.findByPk(id);
    
    if (!exercise) {
      return res.status(404).json({ 
        err_no: 404,
        message: '练习题不存在',
        data: null
      });
    }
    
    const updateData = {};
    const fields = [
      'subject', 'unitId', 'title', 'question', 'options', 'correctAnswer',
      'explanation', 'type', 'difficulty', 'media', 'hints',
      'knowledgePointIds', 'isAI'
    ];
    
    // 只更新提供的字段，并进行数据格式处理
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'options' && req.body.type === 'choice') {
          // 对选择题的选项进行格式处理
          if (Array.isArray(req.body[field])) {
            updateData[field] = req.body[field].map(option => {
              if (typeof option === 'object' && option.content !== undefined) {
                // 如果是对象格式 {content: "选项A", isCorrect: false}，提取content
                return option.content;
              } else if (typeof option === 'string') {
                // 如果已经是字符串，直接使用
                return option;
              } else {
                // 如果是其他格式，转换为字符串
                return String(option);
              }
            });
          } else {
            updateData[field] = req.body[field];
          }
        } else {
          updateData[field] = req.body[field];
        }
      }
    });
    
    // 如果更新了unitId，验证新课程是否存在
    if (updateData.unitId && updateData.unitId !== exercise.unitId) {
      const course = await Course.findByPk(updateData.unitId);
      if (!course) {
        return res.status(404).json({ 
          err_no: 404,
          message: '课程不存在',
          data: null
        });
      }
    }
    
    await exercise.update(updateData);
    
    // 重新获取更新后的数据
    await exercise.reload({
      include: [
        { model: Course },
        { model: Subject }
      ]
    });
    
    return res.status(200).json({
      err_no: 0,
      data: {
        id: exercise.id,
        subject: exercise.subject,
        unitId: exercise.unitId,
        question: exercise.question,
        options: exercise.options,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
        type: exercise.type,
        difficulty: exercise.difficulty,
        media: exercise.media,
        hints: exercise.hints,
        knowledgePointIds: exercise.knowledgePointIds || [],
        isAI: exercise.isAI,
        createdAt: exercise.createdAt,
        updatedAt: exercise.updatedAt,
        course: exercise.Course,
        subjectInfo: exercise.Subject
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
    const { id } = req.params;
    
    const exercise = await Exercise.findByPk(id);
    
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
      message: '练习题删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除练习题失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

module.exports = {
  getAllExercises: exports.getAllExercises,
  getExercisesByCourse: exports.getExercisesByCourse,
  getExercisesByUnit: exports.getExercisesByUnit,
  getExerciseById: exports.getExerciseById,
  createExercise: exports.createExercise,
  updateExercise: exports.updateExercise,
  deleteExercise: exports.deleteExercise
}; 