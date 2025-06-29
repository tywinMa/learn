const { CourseMediaResource, MediaResource, Course, User } = require('../../models');
const { Op } = require('sequelize');

// 获取课程的媒体资源列表
const getCourseMediaResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { type, isActive } = req.query;

    const where = { courseId };
    if (type) where['$mediaResource.type$'] = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const courseMediaResources = await CourseMediaResource.findAll({
      where,
      include: [
        {
          model: MediaResource,
          as: 'mediaResource',
          where: { isDeleted: false },
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'username', 'name']
            }
          ]
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        }
      ],
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      err_no: 0,
      data: courseMediaResources
    });
  } catch (error) {
    console.error('获取课程媒体资源失败:', error);
    res.status(500).json({
      err_no: 404,
      message: '获取课程媒体资源失败',
      data: null
    });
  }
};

// 获取媒体资源关联的课程列表
const getMediaResourceCourses = async (req, res) => {
  try {
    const { mediaResourceId } = req.params;

    const courseMediaResources = await CourseMediaResource.findAll({
      where: { mediaResourceId },
      include: [
        {
          model: Course,
          as: 'course'
        }
      ],
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
    });

    res.json({
      err_no: 0,
      data: courseMediaResources
    });
  } catch (error) {
    console.error('获取媒体资源关联课程失败:', error);
    res.status(500).json({
      err_no: 404,
      message: '获取媒体资源关联课程失败',
      data: null
    });
  }
};

// 创建课程-媒体资源关联
const createCourseMediaResource = async (req, res) => {
  try {
    const { courseId, mediaResourceId, displayOrder, isActive } = req.body;
    const createdBy = req.user.id;

    // 检查课程是否存在
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        err_no: 404,
        message: '课程不存在'
      });
    }

    // 检查媒体资源是否存在
    const mediaResource = await MediaResource.findOne({
      where: { id: mediaResourceId, isDeleted: false }
    });
    if (!mediaResource) {
      return res.status(404).json({
        err_no: 404,
        message: '媒体资源不存在'
      });
    }

    // 检查关联是否已存在
    const existingRelation = await CourseMediaResource.findOne({
      where: { courseId, mediaResourceId }
    });
    if (existingRelation) {
      return res.status(400).json({
        err_no: 404,
        message: '该媒体资源已关联到此课程'
      });
    }

    const courseMediaResource = await CourseMediaResource.create({
      courseId,
      mediaResourceId,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy
    });

    // 获取完整信息返回
    const fullCourseMediaResource = await CourseMediaResource.findByPk(courseMediaResource.id, {
      include: [
        {
          model: MediaResource,
          as: 'mediaResource',
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'username', 'name']
            }
          ]
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        }
      ]
    });

    res.status(201).json({
      err_no: 0,
      message: '课程媒体资源关联创建成功',
      data: fullCourseMediaResource
    });
  } catch (error) {
    console.error('创建课程媒体资源关联失败:', error);
    res.status(500).json({
      err_no: 404,
      message: '创建课程媒体资源关联失败',
      data: null
    });
  }
};

// 更新课程-媒体资源关联
const updateCourseMediaResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayOrder, isActive } = req.body;

    const courseMediaResource = await CourseMediaResource.findByPk(id);
    if (!courseMediaResource) {
      return res.status(404).json({
        err_no: 404,
        message: '关联记录不存在'
      });
    }

    await courseMediaResource.update({
      displayOrder: displayOrder !== undefined ? displayOrder : courseMediaResource.displayOrder,
      isActive: isActive !== undefined ? isActive : courseMediaResource.isActive
    });

    // 获取更新后的完整信息
    const updatedCourseMediaResource = await CourseMediaResource.findByPk(id, {
      include: [
        {
          model: MediaResource,
          as: 'mediaResource',
          include: [
            {
              model: User,
              as: 'uploader',
              attributes: ['id', 'username', 'name']
            }
          ]
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        }
      ]
    });

    res.json({
      err_no: 0,
      message: '课程媒体资源关联更新成功',
      data: updatedCourseMediaResource
    });
  } catch (error) {
    console.error('更新课程媒体资源关联失败:', error);
    res.status(500).json({
      err_no: 404,
      message: '更新课程媒体资源关联失败',
      data: null
    });
  }
};

// 删除课程-媒体资源关联
const deleteCourseMediaResource = async (req, res) => {
  try {
    const { id } = req.params;

    const courseMediaResource = await CourseMediaResource.findByPk(id);
    if (!courseMediaResource) {
      return res.status(404).json({
        err_no: 404,
        message: '关联记录不存在'
      });
    }

    await courseMediaResource.destroy();

    res.json({
      err_no: 0,
      message: '课程媒体资源关联删除成功'
    });
  } catch (error) {
    console.error('删除课程媒体资源关联失败:', error);
    res.status(500).json({
      err_no: 404,
      message: '删除课程媒体资源关联失败',
      data: null
    });
  }
};

// 批量关联媒体资源到课程
const batchCreateCourseMediaResources = async (req, res) => {
  try {
    const { courseId, mediaResourceIds } = req.body;
    const createdBy = req.user.id;

    if (!mediaResourceIds || !Array.isArray(mediaResourceIds) || mediaResourceIds.length === 0) {
      return res.status(400).json({
        err_no: 404,
        message: '请选择要关联的媒体资源'
      });
    }

    // 检查课程是否存在
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        err_no: 404,
        message: '课程不存在'
      });
    }

    // 检查媒体资源是否存在
    const mediaResources = await MediaResource.findAll({
      where: { 
        id: { [Op.in]: mediaResourceIds },
        isDeleted: false 
      }
    });

    if (mediaResources.length !== mediaResourceIds.length) {
      return res.status(400).json({
        err_no: 404,
        message: '部分媒体资源不存在或已删除'
      });
    }

    // 检查已存在的关联
    const existingRelations = await CourseMediaResource.findAll({
      where: { 
        courseId,
        mediaResourceId: { [Op.in]: mediaResourceIds }
      }
    });

    const existingMediaResourceIds = existingRelations.map(r => r.mediaResourceId);
    const newMediaResourceIds = mediaResourceIds.filter(id => !existingMediaResourceIds.includes(id));

    if (newMediaResourceIds.length === 0) {
      return res.status(400).json({
        err_no: 404,
        message: '所选媒体资源都已关联到此课程'
      });
    }

    // 批量创建关联
    const courseMediaResources = await CourseMediaResource.bulkCreate(
      newMediaResourceIds.map((mediaResourceId, index) => ({
        courseId,
        mediaResourceId,
        displayOrder: index,
        isActive: true,
        createdBy
      }))
    );

    res.json({
      err_no: 0,
      message: `成功关联 ${newMediaResourceIds.length} 个媒体资源到课程`,
      data: {
        created: courseMediaResources.length,
        skipped: existingMediaResourceIds.length
      }
    });
  } catch (error) {
    console.error('批量创建课程媒体资源关联失败:', error);
    res.status(500).json({
      err_no: 404,
      message: '批量创建课程媒体资源关联失败',
      data: null
    });
  }
};

// 批量更新关联顺序
const batchUpdateDisplayOrder = async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, displayOrder }, ...]

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        err_no: 404,
        message: '请提供要更新的关联记录'
      });
    }

    // 批量更新
    for (const update of updates) {
      await CourseMediaResource.update(
        { displayOrder: update.displayOrder },
        { where: { id: update.id } }
      );
    }

    res.json({
      err_no: 0,
      message: `成功更新 ${updates.length} 个关联记录的显示顺序`
    });
  } catch (error) {
    console.error('批量更新显示顺序失败:', error);
    res.status(500).json({
      err_no: 404,
      message: '批量更新显示顺序失败',
      data: null
    });
  }
};

// 删除媒体资源的所有课程关联
const deleteAllCourseMediaResourcesByMediaId = async (req, res) => {
  try {
    const { id } = req.params; // 媒体资源ID

    // 检查媒体资源是否存在
    const mediaResource = await MediaResource.findOne({
      where: { id, isDeleted: false }
    });

    if (!mediaResource) {
      return res.status(404).json({
        err_no: 404,
        message: '媒体资源不存在'
      });
    }

    // 删除该媒体资源的所有课程关联
    const deletedCount = await CourseMediaResource.destroy({
      where: { mediaResourceId: id }
    });

    res.json({
      err_no: 0,
      message: `成功删除 ${deletedCount} 个课程关联`,
      data: { deletedCount }
    });
  } catch (error) {
    console.error('删除媒体资源课程关联失败:', error);
    res.status(500).json({
      err_no: 500,
      message: '删除媒体资源课程关联失败',
      data: null
    });
  }
};

module.exports = {
  getCourseMediaResources,
  getMediaResourceCourses,
  createCourseMediaResource,
  updateCourseMediaResource,
  deleteCourseMediaResource,
  deleteAllCourseMediaResourcesByMediaId,
  batchCreateCourseMediaResources,
  batchUpdateDisplayOrder
}; 