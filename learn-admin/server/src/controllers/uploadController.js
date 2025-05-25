const { getFileUrl } = require('../middlewares/upload');

/**
 * 上传图片
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        err_no: 400,
        message: '没有文件被上传',
        data: null
      });
    }

    // 生成文件URL
    const fileUrl = getFileUrl(req, req.file.filename, 'image');

    return res.status(200).json({
      err_no: 0,
      message: '图片上传成功',
      data: {
        url: fileUrl,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    return res.status(500).json({
      err_no: 500,
      message: `图片上传过程中发生错误: ${error.message}`,
      data: null
    });
  }
};

/**
 * 上传视频
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const uploadVideo = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        err_no: 400,
        message: '没有文件被上传',
        data: null
      });
    }

    // 生成文件URL
    const fileUrl = getFileUrl(req, req.file.filename, 'video');

    return res.status(200).json({
      err_no: 0,
      message: '视频上传成功',
      data: {
        url: fileUrl,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    return res.status(500).json({
      err_no: 500,
      message: `视频上传过程中发生错误: ${error.message}`,
      data: null
    });
  }
};

/**
 * 上传课程封面图片
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const uploadCourseCover = (req, res) => {
  return uploadImage(req, res);
};

/**
 * 上传课程视频
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const uploadCourseVideo = (req, res) => {
  return uploadVideo(req, res);
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadCourseCover,
  uploadCourseVideo
}; 