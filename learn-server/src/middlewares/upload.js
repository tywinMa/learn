const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 确保上传目录存在
const createUploadDirs = () => {
  const imageDir = path.join(__dirname, '../../uploads/images');
  const videoDir = path.join(__dirname, '../../uploads/videos');
  
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }
};

// 在中间件初始化时创建目录
createUploadDirs();

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 根据文件类型决定存储位置
    const isImage = file.mimetype.startsWith('image/');
    const uploadDir = isImage 
      ? path.join(__dirname, '../../uploads/images')
      : path.join(__dirname, '../../uploads/videos');
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的图片和视频类型
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型！只允许 JPG, PNG, GIF, WEBP, MP4, WEBM, MOV 格式'), false);
  }
};

// 创建上传中间件
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  // limits: {
  //   fileSize: 20 * 1024 * 1024, // 已移除文件大小限制
  // }
});

// 处理上传错误的中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // 文件大小限制已移除，不再检查 LIMIT_FILE_SIZE
    return res.status(400).json({
      err_no: 400,
      message: `上传失败：${err.message}`,
      data: null
    });
  } else if (err) {
    return res.status(400).json({
      err_no: 400,
      message: err.message,
      data: null
    });
  }
  next();
};

// 生成上传文件的URL
const getFileUrl = (req, filename, type) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const folder = type === 'image' ? 'images' : 'videos';
  return `${baseUrl}/uploads/${folder}/${filename}`;
};

module.exports = {
  upload,
  handleUploadError,
  getFileUrl
}; 