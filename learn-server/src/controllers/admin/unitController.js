const { Unit, SubjectGrade, Subject, Grade } = require('../../models');

// 获取所有单元
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      include: [
        {
          model: SubjectGrade,
          as: 'subjectGrade',
          include: [
            {
              model: Subject,
              as: 'subject'
            },
            {
              model: Grade,
              as: 'grade'
            }
          ]
        }
      ],
      order: [['subjectGrade', 'subjectCode', 'ASC'], ['subjectGrade', 'gradeId', 'ASC'], ['order', 'ASC']]
    });
    return res.status(200).json({
      err_no: 0,
      data: units || []
    });
  } catch (error) {
    console.error('获取单元失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 按学科年级获取单元
exports.getUnitsBySubjectGrade = async (req, res) => {
  try {
    const { subjectGradeId } = req.params;
    const units = await Unit.findAll({
      where: { subjectGradeId },
      include: [
        {
          model: SubjectGrade,
          as: 'subjectGrade',
          include: [
            {
              model: Subject,
              as: 'subject'
            },
            {
              model: Grade,
              as: 'grade'
            }
          ]
        }
      ],
      order: [['order', 'ASC']]
    });
    return res.status(200).json({
      err_no: 0,
      data: units || []
    });
  } catch (error) {
    console.error('获取单元失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 按学科获取单元 (兼容旧接口)
exports.getUnitsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const units = await Unit.findAll({
      include: [
        {
          model: SubjectGrade,
          as: 'subjectGrade',
          where: { subjectCode: subject },
          include: [
            {
              model: Subject,
              as: 'subject'
            },
            {
              model: Grade,
              as: 'grade'
            }
          ]
        }
      ],
      order: [['subjectGrade', 'gradeId', 'ASC'], ['order', 'ASC']]
    });
    return res.status(200).json({
      err_no: 0,
      data: units || []
    });
  } catch (error) {
    console.error('获取单元失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 获取单个单元
exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findByPk(id, {
      include: [
        {
          model: SubjectGrade,
          as: 'subjectGrade',
          include: [
            {
              model: Subject,
              as: 'subject'
            },
            {
              model: Grade,
              as: 'grade'
            }
          ]
        }
      ]
    });
    
    if (!unit) {
      return res.status(404).json({ 
        err_no: 404,
        message: '单元不存在',
        data: null
      });
    }
    
    return res.status(200).json({
      err_no: 0,
      data: unit
    });
  } catch (error) {
    console.error('获取单元详情失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 创建单元
exports.createUnit = async (req, res) => {
  try {
    const { 
      id, 
      subjectGradeId, 
      title, 
      description, 
      order, 
      isPublished, 
      color, 
      secondaryColor, 
      courseIds 
    } = req.body;
    
    const unit = await Unit.create({
      id,
      subjectGradeId,
      title,
      description,
      order,
      isPublished,
      color,
      secondaryColor,
      courseIds
    });
    
    // 返回包含关联信息的单元数据
    const unitWithAssociations = await Unit.findByPk(unit.id, {
      include: [
        {
          model: SubjectGrade,
          as: 'subjectGrade',
          include: [
            {
              model: Subject,
              as: 'subject'
            },
            {
              model: Grade,
              as: 'grade'
            }
          ]
        }
      ]
    });
    
    return res.status(200).json({
      err_no: 0,
      data: unitWithAssociations
    });
  } catch (error) {
    console.error('创建单元失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 更新单元
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      subjectGradeId, 
      title, 
      description, 
      order, 
      isPublished, 
      color, 
      secondaryColor, 
      courseIds 
    } = req.body;
    
    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ 
        err_no: 404,
        message: '单元不存在',
        data: null
      });
    }
    
    await unit.update({
      subjectGradeId,
      title,
      description,
      order,
      isPublished,
      color,
      secondaryColor,
      courseIds
    });
    
    // 返回包含关联信息的单元数据
    const unitWithAssociations = await Unit.findByPk(unit.id, {
      include: [
        {
          model: SubjectGrade,
          as: 'subjectGrade',
          include: [
            {
              model: Subject,
              as: 'subject'
            },
            {
              model: Grade,
              as: 'grade'
            }
          ]
        }
      ]
    });
    
    return res.status(200).json({
      err_no: 0,
      data: unitWithAssociations
    });
  } catch (error) {
    console.error('更新单元失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 删除单元
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({ 
        err_no: 404,
        message: '单元不存在',
        data: null
      });
    }
    
    await unit.destroy();
    return res.status(200).json({ 
      err_no: 0,
      message: '单元已删除',
      data: null
    });
  } catch (error) {
    console.error('删除单元失败:', error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 批量删除指定学科年级的所有单元
exports.deleteUnitsBySubjectGrade = async (req, res) => {
  try {
    const { subjectGradeId } = req.params;
    
    console.log(`开始批量删除学科年级${subjectGradeId}的所有单元`);
    
    // 删除该学科年级的所有单元
    const deletedCount = await Unit.destroy({
      where: { subjectGradeId }
    });
    
    console.log(`学科年级${subjectGradeId}删除了${deletedCount}个单元`);
    
    return res.status(200).json({ 
      err_no: 0,
      message: `成功删除${deletedCount}个单元`,
      data: { deletedCount, subjectGradeId }
    });
  } catch (error) {
    console.error(`批量删除学科年级${subjectGradeId}的单元失败:`, error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
};

// 批量删除指定学科的所有单元 (兼容旧接口)
exports.deleteUnitsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    
    console.log(`开始批量删除学科${subject}的所有单元`);
    
    // 查找该学科下的所有学科年级关联
    const subjectGrades = await SubjectGrade.findAll({
      where: { subjectCode: subject },
      attributes: ['id']
    });
    
    const subjectGradeIds = subjectGrades.map(sg => sg.id);
    
    // 删除这些学科年级关联下的所有单元
    const deletedCount = await Unit.destroy({
      where: { subjectGradeId: subjectGradeIds }
    });
    
    console.log(`学科${subject}删除了${deletedCount}个单元`);
    
    return res.status(200).json({ 
      err_no: 0,
      message: `成功删除${deletedCount}个单元`,
      data: { deletedCount, subject }
    });
  } catch (error) {
    console.error(`批量删除学科${subject}的单元失败:`, error);
    return res.status(500).json({ 
      err_no: 500,
      message: '服务器错误' 
    });
  }
}; 