const express = require('express');
const { upload, handleUploadError } = require('../../middlewares/upload');
const { uploadImage, uploadVideo, uploadCourseCover, uploadCourseVideo } = require('../../controllers/admin/uploadController');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

// 所有上传路由都需要身份验证
router.use(authenticate);

// 通用图片上传
router.post('/image', 
  authorize('admin', 'superadmin'), 
  upload.single('image'), 
  handleUploadError, 
  uploadImage
);

// 通用视频上传
router.post('/video', 
  authorize('admin', 'superadmin'), 
  upload.single('video'), 
  handleUploadError, 
  uploadVideo
);

// 课程封面图片上传
router.post('/course/cover', 
  authorize('admin', 'superadmin'), 
  upload.single('cover'), 
  handleUploadError, 
  uploadCourseCover
);

// 课程视频上传
router.post('/course/video', 
  authorize('admin', 'superadmin'), 
  upload.single('video'), 
  handleUploadError, 
  uploadCourseVideo
);

module.exports = router; 