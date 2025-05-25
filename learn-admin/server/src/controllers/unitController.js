const { Unit } = require('../models');

// 获取所有单元
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      order: [['subject', 'ASC'], ['order', 'ASC']]
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

// 按学科获取单元
exports.getUnitsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const units = await Unit.findAll({
      where: { subject },
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

// 获取单个单元
exports.getUnitById = async (req, res) => {
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
      subject, 
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
      subject,
      title,
      description,
      order,
      isPublished,
      color,
      secondaryColor,
      courseIds
    });
    
    return res.status(200).json({
      err_no: 0,
      data: unit
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
      subject, 
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
      subject,
      title,
      description,
      order,
      isPublished,
      color,
      secondaryColor,
      courseIds
    });
    
    return res.status(200).json({
      err_no: 0,
      data: unit
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

// 批量删除指定学科的所有单元
exports.deleteUnitsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    
    console.log(`开始批量删除学科${subject}的所有单元`);
    
    // 删除该学科的所有单元
    const deletedCount = await Unit.destroy({
      where: { subject }
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