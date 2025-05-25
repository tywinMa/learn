const { Subject } = require('../../models');

// 获取所有学科
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      attributes: ['id', 'name', 'code', 'description', 'color'],
      order: [['name', 'ASC']]
    });
    
    res.json({
      err_no: 0,
      data: subjects
    });
  } catch (error) {
    console.error('获取学科列表错误:', error);
    res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 获取单个学科
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findByPk(id, {
      attributes: ['id', 'name', 'code', 'description', 'color']
    });
    
    if (!subject) {
      return res.status(404).json({
        err_no: 404,
        message: '学科不存在',
        data: null
      });
    }
    
    res.json({
      err_no: 0,
      data: subject
    });
  } catch (error) {
    console.error('获取学科详情错误:', error);
    res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 创建学科
const createSubject = async (req, res) => {
  try {
    const { name, code, description, color } = req.body;
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        err_no: 400,
        message: '学科名称为必填项',
        data: null
      });
    }
    
    // 检查学科名称是否已存在
    const existingSubject = await Subject.findOne({
      where: { name }
    });
    
    if (existingSubject) {
      return res.status(400).json({
        err_no: 400,
        message: '学科名称已存在',
        data: null
      });
    }
    
    // 如果提供了code，检查是否已存在
    if (code) {
      const existingCode = await Subject.findOne({
        where: { code }
      });
      
      if (existingCode) {
        return res.status(400).json({
          err_no: 400,
          message: '学科代码已存在',
          data: null
        });
      }
    }
    
    const subject = await Subject.create({
      name,
      code,
      description,
      color
    });
    
    res.status(201).json({
      err_no: 0,
      message: '学科创建成功',
      data: subject
    });
  } catch (error) {
    console.error('创建学科错误:', error);
    res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 更新学科
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, color } = req.body;
    
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return res.status(404).json({
        err_no: 404,
        message: '学科不存在',
        data: null
      });
    }
    
    // 如果更改名称，检查是否已存在
    if (name && name !== subject.name) {
      const existingSubject = await Subject.findOne({
        where: { name }
      });
      
      if (existingSubject) {
        return res.status(400).json({
          err_no: 400,
          message: '学科名称已存在',
          data: null
        });
      }
    }
    
    // 如果更改代码，检查是否已存在
    if (code && code !== subject.code) {
      const existingCode = await Subject.findOne({
        where: { code }
      });
      
      if (existingCode) {
        return res.status(400).json({
          err_no: 400,
          message: '学科代码已存在',
          data: null
        });
      }
    }
    
    await subject.update({
      name: name || subject.name,
      code: code || subject.code,
      description: description !== undefined ? description : subject.description,
      color: color || subject.color
    });
    
    res.json({
      err_no: 0,
      message: '学科更新成功',
      data: subject
    });
  } catch (error) {
    console.error('更新学科错误:', error);
    res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 删除学科
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subject = await Subject.findByPk(id);
    
    if (!subject) {
      return res.status(404).json({
        err_no: 404,
        message: '学科不存在',
        data: null
      });
    }
    
    await subject.destroy();
    
    res.json({
      err_no: 0,
      message: '学科删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除学科错误:', error);
    res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
}; 