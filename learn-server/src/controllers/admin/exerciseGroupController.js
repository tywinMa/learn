const { ExerciseGroup, Subject, Exercise } = require('../../models');
const { Op } = require('sequelize');

// 获取习题组列表
const getExerciseGroups = async (req, res) => {
  try {
    const { 
      page = 1,
      limit = 10, 
      name, 
      subject,
      sort = 'id',
      order = 'ASC'
    } = req.query;
    
    const whereClause = {};
    
    if (name) {
      whereClause.name = { [Op.like]: `%${name}%` };
    }
    
    if (subject) {
      whereClause.subject = subject;
    }
    
    whereClause.isActive = true;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await ExerciseGroup.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sort, order]],
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    // 为每个习题组添加习题数量信息
    const groupsWithExerciseCount = await Promise.all(rows.map(async group => {
      const groupData = group.toJSON();
      
      // 计算习题数量
      const exerciseIds = groupData.exerciseIds || [];
      const exerciseCount = await Exercise.count({
        where: {
          id: { [Op.in]: exerciseIds }
        }
      });
      
      groupData.exerciseCount = exerciseCount;
      return groupData;
    }));
    
    res.json({
      err_no: 0,
      data: {
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
        currentPage: parseInt(page),
        exerciseGroups: groupsWithExerciseCount
      }
    });
  } catch (error) {
    console.error('获取习题组列表错误:', error);
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message 
    });
  }
};

// 获取习题组详情
const getExerciseGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exerciseGroup = await ExerciseGroup.findByPk(id, {
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code', 'color']
        }
      ]
    });
    
    if (!exerciseGroup) {
      return res.status(404).json({ 
        err_no: 404,
        message: '习题组不存在',
        data: null
      });
    }
    
    // 获取关联的习题详情
    const groupData = exerciseGroup.toJSON();
    const exerciseIds = groupData.exerciseIds || [];
    
    if (exerciseIds.length > 0) {
      const exercises = await Exercise.findAll({
        where: {
          id: { [Op.in]: exerciseIds }
        },
        attributes: ['id', 'title', 'type', 'difficulty', 'subject'],
        order: [['id', 'ASC']]
      });
      groupData.exercises = exercises;
    } else {
      groupData.exercises = [];
    }
    
    res.json({
      err_no: 0,
      data: groupData
    });
  } catch (error) {
    console.error('获取习题组详情错误:', error);
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message 
    });
  }
};

// 根据学科获取习题组列表
const getExerciseGroupsBySubject = async (req, res) => {
  try {
    const { subjectCode } = req.params;
    
    const exerciseGroups = await ExerciseGroup.findAll({
      where: { 
        subject: subjectCode,
        isActive: true
      },
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['id', 'ASC']]
    });
    
    // 为每个习题组添加习题数量信息
    const groupsWithExerciseCount = await Promise.all(exerciseGroups.map(async group => {
      const groupData = group.toJSON();
      
      // 计算习题数量
      const exerciseIds = groupData.exerciseIds || [];
      const exerciseCount = await Exercise.count({
        where: {
          id: { [Op.in]: exerciseIds }
        }
      });
      
      groupData.exerciseCount = exerciseCount;
      return groupData;
    }));
    
    res.json({
      err_no: 0,
      data: groupsWithExerciseCount
    });
  } catch (error) {
    console.error(`获取学科(${req.params.subjectCode})习题组列表错误:`, error);
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message 
    });
  }
};

// 创建习题组
const createExerciseGroup = async (req, res) => {
  try {
    const { 
      id,
      name, 
      description,
      subject,
      exerciseIds = []
    } = req.body;
    
    // 验证必填字段
    if (!id || !name || !subject) {
      return res.status(400).json({
        err_no: 400, 
        message: '习题组ID、名称和学科分类为必填项',
        data: null
      });
    }
    
    // 检查习题组ID是否已存在
    const existingGroup = await ExerciseGroup.findByPk(id);
    if (existingGroup) {
      return res.status(400).json({
        err_no: 400, 
        message: '习题组ID已存在',
        data: null
      });
    }
    
    // 检查学科是否存在
    const subjectRecord = await Subject.findOne({ where: { code: subject } });
    if (!subjectRecord) {
      return res.status(400).json({
        err_no: 400, 
        message: '学科不存在',
        data: null
      });
    }
    
    // 验证习题是否存在
    if (exerciseIds.length > 0) {
      const exercises = await Exercise.findAll({
        where: { id: { [Op.in]: exerciseIds } }
      });
      if (exercises.length !== exerciseIds.length) {
        return res.status(400).json({
          err_no: 400, 
          message: '部分习题不存在',
          data: null
        });
      }
    }
    
    // 创建习题组
    const exerciseGroup = await ExerciseGroup.create({
      id,
      name,
      description,
      subject,
      exerciseIds
    });
    
    // 获取包含关联数据的习题组信息
    const groupWithRelations = await ExerciseGroup.findByPk(exerciseGroup.id, {
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code', 'color']
        }
      ]
    });
    
    const responseData = groupWithRelations.toJSON();
    responseData.exerciseCount = exerciseIds.length;
    
    res.status(201).json({
      err_no: 0,
      message: '习题组创建成功',
      data: responseData
    });
  } catch (error) {
    console.error('创建习题组错误:', error);
    res.status(500).json({
      err_no: 500, 
      message: '服务器错误', 
      error: error.message
    });
  }
};

// 更新习题组
const updateExerciseGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description,
      subject,
      exerciseIds,
      isActive
    } = req.body;
    
    const exerciseGroup = await ExerciseGroup.findByPk(id);
    
    if (!exerciseGroup) {
      return res.status(404).json({
        err_no: 404, 
        message: '习题组不存在',
        data: null
      });
    }
    
    // 检查学科是否存在（如果更改了）
    if (subject && subject !== exerciseGroup.subject) {
      const subjectRecord = await Subject.findOne({ where: { code: subject } });
      if (!subjectRecord) {
        return res.status(400).json({
          err_no: 400, 
          message: '学科不存在',
          data: null
        });
      }
    }
    
    // 验证习题是否存在（如果更改了）
    if (exerciseIds && exerciseIds.length > 0) {
      const exercises = await Exercise.findAll({
        where: { id: { [Op.in]: exerciseIds } }
      });
      if (exercises.length !== exerciseIds.length) {
        return res.status(400).json({
          err_no: 400, 
          message: '部分习题不存在',
          data: null
        });
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (exerciseIds !== undefined) updateData.exerciseIds = exerciseIds;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // 更新习题组
    await exerciseGroup.update(updateData);
    
    // 获取更新后的习题组（包含关联数据）
    const updatedGroup = await ExerciseGroup.findByPk(id, {
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });
    
    const responseData = updatedGroup.toJSON();
    const finalExerciseIds = responseData.exerciseIds || [];
    responseData.exerciseCount = finalExerciseIds.length;
    
    res.json({
      err_no: 0,
      message: '习题组更新成功',
      data: responseData
    });
  } catch (error) {
    console.error('更新习题组错误:', error);
    res.status(500).json({
      err_no: 500, 
      message: '服务器错误', 
      error: error.message
    });
  }
};

// 删除习题组
const deleteExerciseGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exerciseGroup = await ExerciseGroup.findByPk(id);
    
    if (!exerciseGroup) {
      return res.status(404).json({
        err_no: 404, 
        message: '习题组不存在',
        data: null
      });
    }
    
    // 软删除：设置isActive为false
    await exerciseGroup.update({ isActive: false });
    
    res.json({
      err_no: 0,
      message: '习题组删除成功'
    });
  } catch (error) {
    console.error('删除习题组错误:', error);
    res.status(500).json({
      err_no: 500, 
      message: '服务器错误', 
      error: error.message
    });
  }
};

module.exports = {
  getExerciseGroups,
  getExerciseGroupById,
  getExerciseGroupsBySubject,
  createExerciseGroup,
  updateExerciseGroup,
  deleteExerciseGroup
}; 