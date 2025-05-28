const { Exercise, Course, Subject, ExerciseGroup } = require('../../models');

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
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['id', 'ASC']]
    });
    
    // 为每个习题查找相关的习题组和课程信息
    const formattedExercises = await Promise.all(exercises.map(async (exercise) => {
      // 查找包含此习题的习题组
      const exerciseGroups = await ExerciseGroup.findAll({
        where: {
          subject: exercise.subject,
          exerciseIds: {
            [require('sequelize').Op.like]: `%"${exercise.id}"%`
          }
        }
      });
      
      // 查找使用这些习题组的课程
      const relatedCourses = [];
      for (const group of exerciseGroups) {
        const courses = await Course.findAll({
          where: {
            exerciseGroupIds: {
              [require('sequelize').Op.like]: `%"${group.id}"%`
            }
          },
          attributes: ['id', 'title', 'subject', 'unitId']
        });
        relatedCourses.push(...courses);
      }
      
      return {
        id: exercise.id,
        subject: exercise.subject,
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
        // 新架构下的关联信息
        exerciseGroups: exerciseGroups.map(group => ({
          id: group.id,
          name: group.name,
          description: group.description
        })),
        relatedCourses: relatedCourses.map(course => ({
          id: course.id,
          title: course.title,
          subject: course.subject,
          unitId: course.unitId
        })),
        subjectInfo: exercise.Subject ? {
          id: exercise.Subject.id,
          name: exercise.Subject.name,
          code: exercise.Subject.code
        } : undefined
      };
    }));
    
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
    
    // 查找课程及其关联的习题组
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        err_no: 404,
        message: '课程不存在'
      });
    }
    
    const exerciseGroupIds = course.exerciseGroupIds || [];
    if (exerciseGroupIds.length === 0) {
      return res.status(200).json({
        err_no: 0,
        data: []
      });
    }
    
    // 获取习题组中的所有习题
    const exerciseGroups = await ExerciseGroup.findAll({
      where: {
        id: exerciseGroupIds,
        isActive: true
      }
    });
    
    const allExerciseIds = exerciseGroups.flatMap(group => group.exerciseIds || []);
    
    const exercises = await Exercise.findAll({
      where: {
        id: allExerciseIds
      },
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

// 按学科获取练习题
exports.getExercisesBySubject = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    const exercises = await Exercise.findAll({
      where: { subject: subjectCode },
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
    console.error('获取学科练习题失败:', error);
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
    
    // 使用getExercisesByCourse的逻辑，因为unitId实际上是courseId
    const course = await Course.findByPk(unitId);
    if (!course) {
      return res.status(404).json({
        err_no: 404,
        message: '课程不存在'
      });
    }
    
    const exerciseGroupIds = course.exerciseGroupIds || [];
    if (exerciseGroupIds.length === 0) {
      return res.status(200).json({
        err_no: 0,
        data: []
      });
    }
    
    // 获取习题组中的所有习题
    const exerciseGroups = await ExerciseGroup.findAll({
      where: {
        id: exerciseGroupIds,
        isActive: true
      }
    });
    
    const allExerciseIds = exerciseGroups.flatMap(group => group.exerciseIds || []);
    
    const exercises = await Exercise.findAll({
      where: {
        id: allExerciseIds
      },
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
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    if (!exercise) {
      return res.status(404).json({ 
        err_no: 404,
        message: '练习题不存在',
        data: null
      });
    }
    
    // 查找包含此习题的习题组和相关课程
    const exerciseGroups = await ExerciseGroup.findAll({
      where: {
        subject: exercise.subject,
        exerciseIds: {
          [require('sequelize').Op.like]: `%"${exercise.id}"%`
        }
      }
    });
    
    const relatedCourses = [];
    for (const group of exerciseGroups) {
      const courses = await Course.findAll({
        where: {
          exerciseGroupIds: {
            [require('sequelize').Op.like]: `%"${group.id}"%`
          }
        },
        attributes: ['id', 'title', 'subject', 'unitId']
      });
      relatedCourses.push(...courses);
    }
    
    // 返回单个练习题的数据
    const responseData = {
      id: exercise.id,
      subject: exercise.subject,
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
      exerciseGroups: exerciseGroups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description
      })),
      relatedCourses: relatedCourses.map(course => ({
        id: course.id,
        title: course.title,
        subject: course.subject,
        unitId: course.unitId
      })),
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
    if (!subject || !title || !question || !type) {
      return res.status(400).json({ 
        err_no: 400,
        message: '缺少必填字段：subject, title, question, type',
        data: null
      });
    }
    
    // 验证学科是否存在
    const subjectRecord = await Subject.findOne({ where: { code: subject } });
    if (!subjectRecord) {
      return res.status(404).json({ 
        err_no: 404,
        message: '学科不存在',
        data: null
      });
    }
    
    // 生成ID（如果没有提供）
    let exerciseId = id;
    if (!exerciseId) {
      // 查找该学科下最大的练习题序号
      const lastExercise = await Exercise.findOne({
        where: { subject },
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
      
      exerciseId = `${subject}-exercise-${nextNumber}`;
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
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    return res.status(201).json({
      err_no: 0,
      data: {
        id: createdExercise.id,
        subject: createdExercise.subject,
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
      'subject', 'title', 'question', 'options', 'correctAnswer',
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
    
    // 如果更新了学科，验证新学科是否存在
    if (updateData.subject && updateData.subject !== exercise.subject) {
      const subjectRecord = await Subject.findOne({ where: { code: updateData.subject } });
      if (!subjectRecord) {
        return res.status(404).json({ 
          err_no: 404,
          message: '学科不存在',
          data: null
        });
      }
    }
    
    await exercise.update(updateData);
    
    // 重新获取更新后的数据
    await exercise.reload({
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    return res.status(200).json({
      err_no: 0,
      data: {
        id: exercise.id,
        subject: exercise.subject,
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
  getExercisesBySubject: exports.getExercisesBySubject,
  getExercisesByUnit: exports.getExercisesByUnit,
  getExerciseById: exports.getExerciseById,
  createExercise: exports.createExercise,
  updateExercise: exports.updateExercise,
  deleteExercise: exports.deleteExercise
}; 