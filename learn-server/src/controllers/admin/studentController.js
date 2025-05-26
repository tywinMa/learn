const { Student, User, UnitProgress, AnswerRecord, Unit, Course, Subject, Exercise } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

// 获取所有学生
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, status, teacherId } = req.query;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (teacherId) {
      whereClause.teacherId = teacherId;
    }
    
    const { count, rows: students } = await Student.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: { exclude: ['password'] },
      offset: parseInt(offset),
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        students,
        pagination: {
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 获取单个学生信息
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: { exclude: ['password'] }
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: '学生不存在' 
      });
    }
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('获取学生信息错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 创建学生
const createStudent = async (req, res) => {
  try {
    const {
      studentId,
      password,
      name,
      nickname,
      email,
      phone,
      gender,
      birthDate,
      grade,
      school,
      parentName,
      parentPhone,
      teacherId,
      remarks
    } = req.body;
    
    // 验证必填字段
    if (!studentId || !password || !name) {
      return res.status(400).json({ 
        success: false,
        message: '学生账号、密码和姓名为必填项' 
      });
    }
    
    // 检查学生账号是否已存在
    const existingStudent = await Student.findOne({ where: { studentId } });
    if (existingStudent) {
      return res.status(400).json({ 
        success: false,
        message: '学生账号已存在' 
      });
    }
    
    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await Student.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: '邮箱已被使用' 
        });
      }
    }
    
    // 如果指定了教师，验证教师是否存在
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ 
          success: false,
          message: '指定的教师不存在或无效' 
        });
      }
    }
    
    const student = await Student.create({
      studentId,
      password,
      name,
      nickname,
      email,
      phone,
      gender,
      birthDate,
      grade,
      school,
      parentName,
      parentPhone,
      teacherId,
      remarks,
      status: 'active'
    });
    
    // 获取完整的学生信息（包括教师信息）
    const fullStudent = await Student.findByPk(student.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: { exclude: ['password'] }
    });
    
    res.status(201).json({
      success: true,
      message: '学生创建成功',
      data: fullStudent
    });
  } catch (error) {
    console.error('创建学生错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 更新学生信息
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      nickname,
      email,
      phone,
      gender,
      birthDate,
      grade,
      school,
      parentName,
      parentPhone,
      teacherId,
      status,
      remarks
    } = req.body;
    
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: '学生不存在' 
      });
    }
    
    // 检查邮箱是否被其他学生使用
    if (email && email !== student.email) {
      const existingEmail = await Student.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: id }
        }
      });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: '邮箱已被使用' 
        });
      }
    }
    
    // 如果指定了教师，验证教师是否存在
    if (teacherId && teacherId !== student.teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ 
          success: false,
          message: '指定的教师不存在或无效' 
        });
      }
    }
    
    await student.update({
      name,
      nickname,
      email,
      phone,
      gender,
      birthDate,
      grade,
      school,
      parentName,
      parentPhone,
      teacherId,
      status,
      remarks
    });
    
    // 获取更新后的完整学生信息
    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      success: true,
      message: '学生信息更新成功',
      data: updatedStudent
    });
  } catch (error) {
    console.error('更新学生信息错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 删除学生
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findByPk(id);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: '学生不存在' 
      });
    }
    
    // 删除学生相关的数据
    await Promise.all([
      UnitProgress.destroy({ where: { studentId: id } }),
      AnswerRecord.destroy({ where: { studentId: id } })
    ]);
    
    // 删除学生
    await student.destroy();
    
    res.json({
      success: true,
      message: '学生删除成功'
    });
  } catch (error) {
    console.error('删除学生错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 获取学生学习进度
const getStudentProgress = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    
    // 获取学生基本信息
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: { exclude: ['password'] }
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: '学生不存在' 
      });
    }
    
    // 获取学生的单元进度
    const unitProgress = await UnitProgress.findAll({
      where: { studentId },
      include: [
        {
          model: Unit,
          include: [
            {
              model: Course,
              include: [
                {
                  model: Subject,
                  attributes: ['code', 'name', 'color']
                }
              ]
            }
          ]
        }
      ]
    });
    
    // 按学科分组进度数据
    const progressBySubject = {};
    unitProgress.forEach(progress => {
      const unit = progress.Unit;
      if (unit && unit.Course && unit.Course.Subject) {
        const subject = unit.Course.Subject;
        const subjectCode = subject.code;
        
        if (!progressBySubject[subjectCode]) {
          progressBySubject[subjectCode] = {
            subject: subject,
            totalUnits: 0,
            completedUnits: 0,
            totalStars: 0,
            totalTime: 0,
            units: []
          };
        }
        
        progressBySubject[subjectCode].totalUnits++;
        if (progress.completed) {
          progressBySubject[subjectCode].completedUnits++;
        }
        progressBySubject[subjectCode].totalStars += progress.stars || 0;
        progressBySubject[subjectCode].totalTime += progress.totalTimeSpent || 0;
        progressBySubject[subjectCode].units.push({
          unitId: unit.id,
          unitName: unit.title,
          courseName: unit.Course.title,
          completed: progress.completed,
          stars: progress.stars,
          totalTimeSpent: progress.totalTimeSpent,
          masteryLevel: progress.masteryLevel,
          lastStudyTime: progress.lastStudyTime
        });
      }
    });
    
    res.json({
      success: true,
      data: {
        student,
        progressBySubject
      }
    });
  } catch (error) {
    console.error('获取学生进度错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 获取学生错题记录
const getStudentWrongExercises = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const { page = 1, pageSize = 20, subject } = req.query;
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    const whereClause = {
      studentId,
      isCorrect: false
    };
    
    // 查询错题记录
    const wrongAnswers = await AnswerRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Exercise,
          include: [
            {
              model: Course,
              include: [
                {
                  model: Subject,
                  attributes: ['code', 'name', 'color']
                }
              ]
            }
          ]
        }
      ],
      offset: parseInt(offset),
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });
    
    // 按练习题分组，统计错误次数
    const exerciseErrors = {};
    wrongAnswers.rows.forEach(record => {
      const exerciseId = record.exerciseId;
      if (!exerciseErrors[exerciseId]) {
        exerciseErrors[exerciseId] = {
          exercise: record.Exercise,
          errorCount: 0,
          records: []
        };
      }
      exerciseErrors[exerciseId].errorCount++;
      exerciseErrors[exerciseId].records.push({
        id: record.id,
        userAnswer: record.userAnswer,
        responseTime: record.responseTime,
        createdAt: record.createdAt
      });
    });
    
    res.json({
      success: true,
      data: {
        wrongExercises: Object.values(exerciseErrors),
        pagination: {
          total: wrongAnswers.count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(wrongAnswers.count / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取学生错题记录错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 分配教师给学生
const assignTeacherToStudent = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const { teacherId } = req.body;
    
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: '学生不存在' 
      });
    }
    
    // 验证教师是否存在且有效
    if (teacherId) {
      const teacher = await User.findByPk(teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return res.status(400).json({ 
          success: false,
          message: '指定的教师不存在或无效' 
        });
      }
    }
    
    await student.update({ teacherId });
    
    res.json({
      success: true,
      message: '教师分配成功'
    });
  } catch (error) {
    console.error('分配教师错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

// 批量导入学生
const batchImportStudents = async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: '请提供有效的学生数据' 
      });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const studentData of students) {
      try {
        const { studentId, password, name } = studentData;
        
        if (!studentId || !password || !name) {
          results.failed.push({
            data: studentData,
            reason: '学生账号、密码和姓名为必填项'
          });
          continue;
        }
        
        // 检查学生账号是否已存在
        const existingStudent = await Student.findOne({ where: { studentId } });
        if (existingStudent) {
          results.failed.push({
            data: studentData,
            reason: '学生账号已存在'
          });
          continue;
        }
        
        const student = await Student.create({
          ...studentData,
          status: 'active'
        });
        
        results.success.push(student);
      } catch (error) {
        results.failed.push({
          data: studentData,
          reason: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: '批量导入完成',
      data: {
        total: students.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        results
      }
    });
  } catch (error) {
    console.error('批量导入学生错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message 
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProgress,
  getStudentWrongExercises,
  assignTeacherToStudent,
  batchImportStudents
}; 