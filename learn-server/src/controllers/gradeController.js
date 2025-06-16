const { Grade, SubjectGrade, Subject, Course, UserGradeSubjectPreference } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取所有年级列表
 */
const getAllGrades = async (req, res) => {
  try {
    const grades = await Grade.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']],
      include: [{
        model: SubjectGrade,
        as: 'subjectGrades',
        include: [{
          model: Subject,
          as: 'subject'
        }]
      }]
    });

    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('获取年级列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取年级列表失败',
      error: error.message
    });
  }
};

/**
 * 根据ID获取年级详情
 */
const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grade = await Grade.findByPk(id, {
      include: [{
        model: SubjectGrade,
        as: 'subjectGrades',
        include: [{
          model: Subject,
          as: 'subject'
        }]
      }]
    });

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '年级不存在'
      });
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    console.error('获取年级详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取年级详情失败',
      error: error.message
    });
  }
};

/**
 * 创建年级
 */
const createGrade = async (req, res) => {
  try {
    const { code, name, level, levelNumber, description, order } = req.body;

    // 检查年级代码是否已存在
    const existingGrade = await Grade.findOne({ where: { code } });
    if (existingGrade) {
      return res.status(400).json({
        success: false,
        message: '年级代码已存在'
      });
    }

    const grade = await Grade.create({
      code,
      name,
      level,
      levelNumber,
      description,
      order: order || 1
    });

    res.status(201).json({
      success: true,
      data: grade,
      message: '年级创建成功'
    });
  } catch (error) {
    console.error('创建年级失败:', error);
    res.status(500).json({
      success: false,
      message: '创建年级失败',
      error: error.message
    });
  }
};

/**
 * 更新年级
 */
const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, level, levelNumber, description, order, isActive } = req.body;

    const grade = await Grade.findByPk(id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '年级不存在'
      });
    }

    // 如果更新代码，检查是否与其他年级冲突
    if (code && code !== grade.code) {
      const existingGrade = await Grade.findOne({ 
        where: { 
          code,
          id: { [Op.ne]: id }
        } 
      });
      if (existingGrade) {
        return res.status(400).json({
          success: false,
          message: '年级代码已存在'
        });
      }
    }

    await grade.update({
      code: code || grade.code,
      name: name || grade.name,
      level: level || grade.level,
      levelNumber: levelNumber || grade.levelNumber,
      description: description !== undefined ? description : grade.description,
      order: order !== undefined ? order : grade.order,
      isActive: isActive !== undefined ? isActive : grade.isActive
    });

    res.json({
      success: true,
      data: grade,
      message: '年级更新成功'
    });
  } catch (error) {
    console.error('更新年级失败:', error);
    res.status(500).json({
      success: false,
      message: '更新年级失败',
      error: error.message
    });
  }
};

/**
 * 删除年级
 */
const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await Grade.findByPk(id);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '年级不存在'
      });
    }

    // 检查是否有关联的课程
    const courseCount = await Course.count({ where: { gradeId: id } });
    if (courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该年级下还有课程，无法删除'
      });
    }

    // 删除相关的学科年级关联
    await SubjectGrade.destroy({ where: { gradeId: id } });
    
    // 删除相关的用户偏好记录
    await UserGradeSubjectPreference.destroy({ where: { gradeId: id } });

    // 删除年级
    await grade.destroy();

    res.json({
      success: true,
      message: '年级删除成功'
    });
  } catch (error) {
    console.error('删除年级失败:', error);
    res.status(500).json({
      success: false,
      message: '删除年级失败',
      error: error.message
    });
  }
};

/**
 * 获取年级的学科关联
 */
const getGradeSubjects = async (req, res) => {
  try {
    const { id } = req.params;

    const subjectGrades = await SubjectGrade.findAll({
      where: { gradeId: id, isActive: true },
      include: [{
        model: Subject,
        as: 'subject'
      }],
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: subjectGrades
    });
  } catch (error) {
    console.error('获取年级学科关联失败:', error);
    res.status(500).json({
      success: false,
      message: '获取年级学科关联失败',
      error: error.message
    });
  }
};

/**
 * 添加年级学科关联
 */
const addGradeSubject = async (req, res) => {
  try {
    const { gradeId, subjectCode, order } = req.body;

    // 检查年级是否存在
    const grade = await Grade.findByPk(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '年级不存在'
      });
    }

    // 检查学科是否存在
    const subject = await Subject.findOne({ where: { code: subjectCode } });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: '学科不存在'
      });
    }

    // 检查关联是否已存在
    const existingRelation = await SubjectGrade.findOne({
      where: { gradeId, subjectCode }
    });
    if (existingRelation) {
      return res.status(400).json({
        success: false,
        message: '该年级学科关联已存在'
      });
    }

    const subjectGrade = await SubjectGrade.create({
      gradeId,
      subjectCode,
      order: order || 1
    });

    // 返回完整信息
    const result = await SubjectGrade.findByPk(subjectGrade.id, {
      include: [{
        model: Subject,
        as: 'subject'
      }, {
        model: Grade,
        as: 'grade'
      }]
    });

    res.status(201).json({
      success: true,
      data: result,
      message: '年级学科关联创建成功'
    });
  } catch (error) {
    console.error('添加年级学科关联失败:', error);
    res.status(500).json({
      success: false,
      message: '添加年级学科关联失败',
      error: error.message
    });
  }
};

/**
 * 删除年级学科关联
 */
const removeGradeSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subjectGrade = await SubjectGrade.findByPk(id);
    if (!subjectGrade) {
      return res.status(404).json({
        success: false,
        message: '年级学科关联不存在'
      });
    }

    await subjectGrade.destroy();

    res.json({
      success: true,
      message: '年级学科关联删除成功'
    });
  } catch (error) {
    console.error('删除年级学科关联失败:', error);
    res.status(500).json({
      success: false,
      message: '删除年级学科关联失败',
      error: error.message
    });
  }
};

module.exports = {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradeSubjects,
  addGradeSubject,
  removeGradeSubject
}; 