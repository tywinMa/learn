const { MediaResource, CourseMediaResource, User, Course, Grade, Subject, Unit, SubjectGrade } = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

// 获取媒体资源列表
const getMediaResources = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status, 
      resourceType,
      search,
      uploadUserId
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { isDeleted: false };

    // 基于用户角色的权限控制
    const userRole = req.user.role;
    const currentUserId = req.user.id;
    
    // 如果不是管理员或超级管理员，只能看到自己的媒体资源
    if (!['admin', 'superadmin'].includes(userRole)) {
      where.uploadUserId = currentUserId;
    }

    // 条件筛选
    if (type) where.type = type;
    if (status) where.status = status;
    if (resourceType) where.resourceType = resourceType;
    
    // 如果是管理员/超级管理员，且指定了uploadUserId参数，则按指定用户筛选
    if (uploadUserId && ['admin', 'superadmin'].includes(userRole)) {
      where.uploadUserId = uploadUserId;
    }
    
    // 搜索条件
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await MediaResource.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'name']
        },
        {
          model: Course,
          as: 'courses',
          through: {
            attributes: ['displayOrder', 'isActive', 'createdAt']
          },
          include: [
            {
              model: Grade,
              as: 'grade',
              attributes: ['id', 'name', 'order']
            },
            {
              model: Subject,
              as: 'subjectInfo',
              attributes: ['code', 'name', 'description']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      err_no: 0,
      data: {
        mediaResources: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取媒体资源列表失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '获取媒体资源列表失败',
      data: null
    });
  }
};

// 获取单个媒体资源详情
const getMediaResource = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaResource = await MediaResource.findOne({
      where: { id, isDeleted: false },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'name']
        },
        {
          model: Course,
          as: 'courses',
          through: {
            attributes: ['displayOrder', 'isActive', 'createdAt']
          },
          include: [
            {
              model: Grade,
              as: 'grade',
              attributes: ['id', 'name', 'order']
            },
            {
              model: Subject,
              as: 'subjectInfo',
              attributes: ['code', 'name', 'description']
            }
          ]
        }
      ]
    });

    if (!mediaResource) {
      return res.status(404).json({
        err_no: 500,
        message: '媒体资源不存在',
        data: null
      });
    }

    // 增加浏览量
    await mediaResource.increment('viewCount');

    res.json({
      err_no: 0,
      data: mediaResource
    });
  } catch (error) {
    console.error('获取媒体资源详情失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '获取媒体资源详情失败',
      data: null
    });
  }
};

// 创建媒体资源
const createMediaResource = async (req, res) => {
  try {
    const {
      type,
      resourceUrl,
      resourceType,
      title,
      description,
      fileSize,
      duration,
      thumbnailUrl,
      tags
    } = req.body;

    const uploadUserId = req.user.id;

    const mediaResource = await MediaResource.create({
      type,
      resourceUrl,
      resourceType,
      title,
      description,
      uploadUserId,
      fileSize,
      duration,
      thumbnailUrl,
      tags: tags || []
    });

    // 获取完整信息返回
    const fullMediaResource = await MediaResource.findByPk(mediaResource.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'name']
        }
      ]
    });

    res.status(201).json({
      err_no: 0,
      message: '媒体资源创建成功',
      data: fullMediaResource
    });
  } catch (error) {
    console.error('创建媒体资源失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '创建媒体资源失败',
      data: null
    });
  }
};

// 更新媒体资源
const updateMediaResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      resourceUrl,
      resourceType,
      title,
      description,
      status,
      fileSize,
      duration,
      thumbnailUrl,
      tags
    } = req.body;

    const mediaResource = await MediaResource.findOne({
      where: { id, isDeleted: false }
    });

    if (!mediaResource) {
      return res.status(404).json({
        err_no: 500,
        message: '媒体资源不存在',
        data: null
      });
    }

    // 检查权限（只有上传者或管理员可以修改）
    if (mediaResource.uploadUserId !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        err_no: 500,
        message: '没有权限修改此媒体资源'
      });
    }

    // 状态流转控制
    const currentStatus = mediaResource.status;
    
    // 检查是否可以编辑
    if (currentStatus === 'published' || currentStatus === 'under_review') {
      // 管理员可以修改任何状态，普通用户只能在特定状态下修改
      if (!['admin', 'superadmin'].includes(req.user.role)) {
        return res.status(403).json({
          err_no: 500,
          message: '当前状态下无法修改媒体资源',
          data: null
        });
      }
    }

    // 如果不是管理员，限制普通用户只能在draft和rejected状态下修改
    if (!['admin', 'superadmin'].includes(req.user.role) && !['draft', 'rejected'].includes(currentStatus)) {
      return res.status(403).json({
        err_no: 500,
        message: '只有草稿和退回状态的资源可以修改',
        data: null
      });
    }

    // 只有管理员和系统管理员可以修改状态
    const canModifyStatus = ['admin', 'superadmin'].includes(req.user.role);
    
    await mediaResource.update({
      type,
      resourceUrl,
      resourceType,
      title,
      description,
      status: canModifyStatus ? status : currentStatus, // 只有系统管理员和管理员可以修改状态
      fileSize,
      duration,
      thumbnailUrl,
      tags: tags || mediaResource.tags
    });

    // 获取更新后的完整信息
    const updatedMediaResource = await MediaResource.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'name']
        }
      ]
    });

    res.json({
      err_no: 0,
      message: '媒体资源更新成功',
      data: updatedMediaResource
    });
  } catch (error) {
    console.error('更新媒体资源失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '更新媒体资源失败',
      data: null
    });
  }
};

// 提交审核（将draft状态转为pending）
const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaResource = await MediaResource.findOne({
      where: { id, isDeleted: false }
    });

    if (!mediaResource) {
      return res.status(404).json({
        err_no: 500,
        message: '媒体资源不存在',
        data: null
      });
    }

    // 检查权限
    if (mediaResource.uploadUserId !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        err_no: 500,
        message: '没有权限操作此媒体资源'
      });
    }

    // 检查当前状态是否可以提交审核
    if (!['draft', 'rejected'].includes(mediaResource.status)) {
      return res.status(400).json({
        err_no: 500,
        message: '只有草稿或退回状态的资源可以提交审核'
      });
    }

    // 更新状态为pending
    await mediaResource.update({ status: 'pending' });

    // 获取更新后的完整信息
    const updatedMediaResource = await MediaResource.findByPk(id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'username', 'name']
        }
      ]
    });

    res.json({
      err_no: 0,
      message: '媒体资源已提交审核',
      data: updatedMediaResource
    });
  } catch (error) {
    console.error('提交审核失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '提交审核失败',
      data: null
    });
  }
};

// 删除媒体资源（软删除）
const deleteMediaResource = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaResource = await MediaResource.findOne({
      where: { id, isDeleted: false }
    });

    if (!mediaResource) {
      return res.status(404).json({
        err_no: 500,
        message: '媒体资源不存在',
        data: null
      });
    }

    // 检查权限
    if (mediaResource.uploadUserId !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        err_no: 500,
        message: '没有权限删除此媒体资源'
      });
    }

    // 软删除
    await mediaResource.update({ isDeleted: true });

    res.json({
      err_no: 0,
      message: '媒体资源删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除媒体资源失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '删除媒体资源失败',
      data: null
    });
  }
};

// 批量更新状态
const batchUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    // 检查权限：只有管理员和系统管理员可以批量更新状态
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        err_no: 403,
        message: '只有管理员和系统管理员可以修改媒体资源状态'
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        err_no: 500,
        message: '请选择要更新的媒体资源'
      });
    }

    await MediaResource.update(
      { status },
      {
        where: {
          id: { [Op.in]: ids },
          isDeleted: false
        }
      }
    );

    res.json({
      err_no: 0,
      message: '批量更新状态成功',
      data: null
    });
  } catch (error) {
    console.error('批量更新状态失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '批量更新状态失败',
      data: null
    });
  }
};

// 增加点击量
const incrementClickCount = async (req, res) => {
  try {
    const { id } = req.params;

    const mediaResource = await MediaResource.findOne({
      where: { id, isDeleted: false }
    });

    if (!mediaResource) {
      return res.status(404).json({
        err_no: 500,
        message: '媒体资源不存在'
      });
    }

    await mediaResource.increment('clickCount');

    res.json({
      err_no: 0,
      message: '点击量更新成功'
    });
  } catch (error) {
    console.error('更新点击量失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '更新点击量失败',
      data: null
    });
  }
};

// 获取媒体资源统计
const getMediaResourceStats = async (req, res) => {
  try {
    const totalCount = await MediaResource.count({ where: { isDeleted: false } });
    const draftCount = await MediaResource.count({ 
      where: { status: 'draft', isDeleted: false } 
    });
    const publishedCount = await MediaResource.count({ 
      where: { status: 'published', isDeleted: false } 
    });
    const pendingCount = await MediaResource.count({ 
      where: { status: 'pending', isDeleted: false } 
    });
    const underReviewCount = await MediaResource.count({ 
      where: { status: 'under_review', isDeleted: false } 
    });
    const rejectedCount = await MediaResource.count({ 
      where: { status: 'rejected', isDeleted: false } 
    });

    const typeStats = await MediaResource.findAll({
      where: { isDeleted: false },
      attributes: [
        'type',
        [MediaResource.sequelize.fn('COUNT', MediaResource.sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    const resourceTypeStats = await MediaResource.findAll({
      where: { isDeleted: false },
      attributes: [
        'resourceType',
        [MediaResource.sequelize.fn('COUNT', MediaResource.sequelize.col('id')), 'count']
      ],
      group: ['resourceType']
    });

    res.json({
      err_no: 0,
      data: {
        totalCount,
        draftCount,
        publishedCount,
        pendingCount,
        underReviewCount,
        rejectedCount,
        typeStats: typeStats.reduce((acc, item) => {
          acc[item.type] = item.dataValues.count;
          return acc;
        }, {}),
        resourceTypeStats: resourceTypeStats.reduce((acc, item) => {
          acc[item.resourceType] = item.dataValues.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('获取媒体资源统计失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '获取媒体资源统计失败',
      data: null
    });
  }
};

module.exports = {
  getMediaResources,
  getMediaResource,
  createMediaResource,
  updateMediaResource,
  submitForReview,
  deleteMediaResource,
  batchUpdateStatus,
  incrementClickCount,
  getMediaResourceStats
}; 