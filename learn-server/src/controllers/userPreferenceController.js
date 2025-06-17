const { UserGradeSubjectPreference, Grade, Subject, Student, SubjectGrade } = require('../models');

/**
 * 获取用户的年级学科偏好
 */
const getUserPreferences = async (req, res) => {
  try {
    const { studentId } = req.params;

    const preferences = await UserGradeSubjectPreference.findAll({
      where: { studentId },
      include: [{
        model: Grade,
        as: 'grade'
      }, {
        model: Subject,
        as: 'subject'
      }]
    });

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('获取用户偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户偏好失败',
      error: error.message
    });
  }
};

/**
 * 获取用户特定学科的年级偏好
 */
const getUserSubjectGradePreference = async (req, res) => {
  try {
    const { studentId, subjectCode } = req.params;

    const preference = await UserGradeSubjectPreference.findOne({
      where: { studentId, subjectCode },
      include: [{
        model: Grade,
        as: 'grade'
      }, {
        model: Subject,
        as: 'subject'
      }]
    });

    res.json({
      success: true,
      data: preference
    });
  } catch (error) {
    console.error('获取用户学科年级偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户学科年级偏好失败',
      error: error.message
    });
  }
};

/**
 * 设置或更新用户的年级学科偏好
 */
const setUserPreference = async (req, res) => {
  try {
    const { studentId, subjectCode, gradeId } = req.body;

    // 检查学生是否存在
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

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

    // 查找或创建偏好记录
    const [preference, created] = await UserGradeSubjectPreference.findOrCreate({
      where: { studentId, subjectCode },
      defaults: {
        studentId,
        subjectCode,
        gradeId,
        lastAccessTime: new Date()
      }
    });

    // 如果记录已存在，更新年级和访问时间
    if (!created) {
      await preference.update({
        gradeId,
        lastAccessTime: new Date()
      });
    }

    // 返回完整信息
    const result = await UserGradeSubjectPreference.findByPk(preference.id, {
      include: [{
        model: Grade,
        as: 'grade'
      }, {
        model: Subject,
        as: 'subject'
      }]
    });

    res.json({
      success: true,
      data: result,
      message: created ? '偏好设置成功' : '偏好更新成功'
    });
  } catch (error) {
    console.error('设置用户偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '设置用户偏好失败',
      error: error.message
    });
  }
};

/**
 * 删除用户的年级学科偏好
 */
const deleteUserPreference = async (req, res) => {
  try {
    const { studentId, subjectCode } = req.params;

    const preference = await UserGradeSubjectPreference.findOne({
      where: { studentId, subjectCode }
    });

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: '偏好记录不存在'
      });
    }

    await preference.destroy();

    res.json({
      success: true,
      message: '偏好记录删除成功'
    });
  } catch (error) {
    console.error('删除用户偏好失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户偏好失败',
      error: error.message
    });
  }
};

/**
 * 获取学科的可用年级列表（已关联的年级）
 */
const getSubjectAvailableGrades = async (req, res) => {
  try {
    const { subjectCode } = req.params;

    // 检查学科是否存在
    const subject = await Subject.findOne({ where: { code: subjectCode } });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: '学科不存在'
      });
    }

    // 获取该学科关联的所有年级
    const subjectGrades = await Grade.findAll({
      include: [{
        model: SubjectGrade,
        as: 'subjectGrades',
        where: { 
          subjectCode,
          isActive: true 
        },
        required: true
      }],
      where: { isActive: true },
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: subjectGrades
    });
  } catch (error) {
    console.error('获取学科可用年级失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学科可用年级失败',
      error: error.message
    });
  }
};

module.exports = {
  getUserPreferences,
  getUserSubjectGradePreference,
  setUserPreference,
  deleteUserPreference,
  getSubjectAvailableGrades
}; 