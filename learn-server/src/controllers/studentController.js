const { Student } = require('../models');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');

// 学生登录
const studentLogin = async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
      return res.status(400).json({ 
        success: false,
        message: '学生账号和密码为必填项'
      });
    }
    
    const student = await Student.findOne({ where: { studentId } });
    
    if (!student) {
      return res.status(401).json({ 
        success: false,
        message: '学生账号或密码错误'
      });
    }
    
    if (student.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        message: '账户已被停用，请联系管理员'
      });
    }
    
    const isPasswordValid = await student.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: '学生账号或密码错误'
      });
    }
    
    // 更新最后登录时间
    await student.update({ lastLoginAt: new Date() });
    
    const token = generateToken({ id: student.id, type: 'student' });
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        student: {
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          nickname: student.nickname,
          avatar: student.avatar,
          email: student.email,
          phone: student.phone,
          grade: student.grade,
          school: student.school,
          totalPoints: student.totalPoints,
          currentLevel: student.currentLevel,
          consecutiveDays: student.consecutiveDays
        }
      }
    });
  } catch (error) {
    console.error('学生登录错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 学生注册
const studentRegister = async (req, res) => {
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
      parentPhone 
    } = req.body;
    
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
    
    // 创建学生
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
      status: 'active'
    });
    
    const token = generateToken({ id: student.id, type: 'student' });
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        token,
        student: {
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          nickname: student.nickname,
          avatar: student.avatar,
          email: student.email,
          phone: student.phone,
          grade: student.grade,
          school: student.school,
          totalPoints: student.totalPoints,
          currentLevel: student.currentLevel,
          consecutiveDays: student.consecutiveDays
        }
      }
    });
  } catch (error) {
    console.error('学生注册错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 获取学生个人信息
const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.student.id;
    
    const student = await Student.findByPk(studentId, {
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

// 更新学生个人信息
const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.student.id;
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
      avatar,
      settings
    } = req.body;
    
    const student = await Student.findByPk(studentId);
    
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
          id: { [require('sequelize').Op.ne]: studentId }
        }
      });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: '邮箱已被使用'
        });
      }
    }
    
    // 更新学生信息
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
      avatar,
      settings
    });
    
    res.json({
      success: true,
      message: '个人信息更新成功',
      data: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        nickname: student.nickname,
        avatar: student.avatar,
        email: student.email,
        phone: student.phone,
        grade: student.grade,
        school: student.school,
        totalPoints: student.totalPoints,
        currentLevel: student.currentLevel,
        consecutiveDays: student.consecutiveDays
      }
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

// 修改学生密码
const changeStudentPassword = async (req, res) => {
  try {
    const studentId = req.student.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: '当前密码和新密码为必填项'
      });
    }
    
    const student = await Student.findByPk(studentId);
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: '学生不存在'
      });
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await student.validatePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: '当前密码错误'
      });
    }
    
    // 更新密码
    await student.update({ password: newPassword });
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改学生密码错误:', error);
    res.status(500).json({ 
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
};

module.exports = {
  studentLogin,
  studentRegister,
  getStudentProfile,
  updateStudentProfile,
  changeStudentPassword
}; 