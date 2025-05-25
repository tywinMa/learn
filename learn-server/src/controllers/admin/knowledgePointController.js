const { KnowledgePoint, Subject } = require('../../models');
const { Op } = require('sequelize');

// 获取所有知识点
exports.getAllKnowledgePoints = async (req, res) => {
  try {
    const { page = 1, limit = 20, subject, type, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { isActive: true };
    
    if (subject) {
      whereClause.subject = subject;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: knowledgePoints } = await KnowledgePoint.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ],
      order: [['difficulty', 'ASC'], ['title', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 格式化响应数据
    const formattedKnowledgePoints = knowledgePoints.map(kp => ({
      id: kp.id,
      title: kp.title,
      content: kp.content,
      type: kp.type,
      mediaUrl: kp.mediaUrl,
      subject: kp.subject,
      difficulty: kp.difficulty,
      isActive: kp.isActive,
      createdAt: kp.createdAt,
      updatedAt: kp.updatedAt,
      subjectInfo: kp.Subject
    }));

    return res.status(200).json({
      err_no: 0,
      data: {
        knowledgePoints: formattedKnowledgePoints,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取知识点列表失败:', error);
    return res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 获取单个知识点
exports.getKnowledgePointById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const knowledgePoint = await KnowledgePoint.findByPk(id, {
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code'],
          required: false
        }
      ]
    });

    if (!knowledgePoint) {
      return res.status(404).json({
        err_no: 404,
        message: '知识点不存在'
      });
    }

    const responseData = {
      id: knowledgePoint.id,
      title: knowledgePoint.title,
      content: knowledgePoint.content,
      type: knowledgePoint.type,
      mediaUrl: knowledgePoint.mediaUrl,
      subject: knowledgePoint.subject,
      difficulty: knowledgePoint.difficulty,
      isActive: knowledgePoint.isActive,
      createdAt: knowledgePoint.createdAt,
      updatedAt: knowledgePoint.updatedAt,
      subjectInfo: knowledgePoint.Subject
    };

    return res.status(200).json({
      err_no: 0,
      data: responseData
    });
  } catch (error) {
    console.error('获取知识点详情失败:', error);
    return res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 创建知识点
exports.createKnowledgePoint = async (req, res) => {
  try {
    const { title, content, type = 'text', mediaUrl, subject, difficulty = 1 } = req.body;
    
    if (!title || !content || !subject) {
      return res.status(400).json({
        err_no: 400,
        message: '标题、内容和学科是必填项'
      });
    }

    const knowledgePoint = await KnowledgePoint.create({
      title,
      content,
      type,
      mediaUrl,
      subject,
      difficulty
    });

    return res.status(201).json({
      err_no: 0,
      data: knowledgePoint,
      message: '知识点创建成功'
    });
  } catch (error) {
    console.error('创建知识点失败:', error);
    return res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 更新知识点
exports.updateKnowledgePoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, mediaUrl, subject, difficulty, isActive } = req.body;

    const knowledgePoint = await KnowledgePoint.findByPk(id);

    if (!knowledgePoint) {
      return res.status(404).json({
        err_no: 404,
        message: '知识点不存在'
      });
    }

    await knowledgePoint.update({
      title: title || knowledgePoint.title,
      content: content || knowledgePoint.content,
      type: type || knowledgePoint.type,
      mediaUrl: mediaUrl !== undefined ? mediaUrl : knowledgePoint.mediaUrl,
      subject: subject || knowledgePoint.subject,
      difficulty: difficulty !== undefined ? difficulty : knowledgePoint.difficulty,
      isActive: isActive !== undefined ? isActive : knowledgePoint.isActive
    });

    return res.status(200).json({
      err_no: 0,
      data: knowledgePoint,
      message: '知识点更新成功'
    });
  } catch (error) {
    console.error('更新知识点失败:', error);
    return res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
};

// 删除知识点（软删除）
exports.deleteKnowledgePoint = async (req, res) => {
  try {
    const { id } = req.params;

    const knowledgePoint = await KnowledgePoint.findByPk(id);

    if (!knowledgePoint) {
      return res.status(404).json({
        err_no: 404,
        message: '知识点不存在'
      });
    }

    await knowledgePoint.update({ isActive: false });

    return res.status(200).json({
      err_no: 0,
      message: '知识点删除成功'
    });
  } catch (error) {
    console.error('删除知识点失败:', error);
    return res.status(500).json({
      err_no: 500,
      message: '服务器错误',
      error: error.message
    });
  }
}; 