const express = require('express');
const { 
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProgress,
  getStudentWrongExercises,
  assignTeacherToStudent,
  batchImportStudents
} = require('../../controllers/admin/studentController');
const { authenticate, authorize } = require('../../middlewares/auth');

const router = express.Router();

// 所有学生管理路由都需要身份验证
router.use(authenticate);

// 获取所有学生
router.get('/', getAllStudents);

// 获取单个学生信息
router.get('/:id', getStudentById);

// 创建学生（仅管理员和教师）
router.post('/', authorize('admin', 'teacher', 'superadmin'), createStudent);

// 更新学生信息（仅管理员和教师）
router.put('/:id', authorize('admin', 'teacher', 'superadmin'), updateStudent);

// 删除学生（仅管理员）
router.delete('/:id', authorize('admin', 'superadmin'), deleteStudent);

// 获取学生学习进度
router.get('/:id/progress', getStudentProgress);

// 获取学生错题记录
router.get('/:id/wrong-exercises', getStudentWrongExercises);

// 分配教师给学生（仅管理员）
router.put('/:id/assign-teacher', authorize('admin', 'superadmin'), assignTeacherToStudent);

// 批量导入学生（仅管理员）
router.post('/batch-import', authorize('admin', 'superadmin'), batchImportStudents);

module.exports = router; 