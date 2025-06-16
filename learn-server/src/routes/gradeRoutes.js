const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');

// 年级管理路由 - 后台管理API
router.get('/admin/grades', gradeController.getAllGrades);
router.get('/admin/grades/:id', gradeController.getGradeById);
router.post('/admin/grades', gradeController.createGrade);
router.put('/admin/grades/:id', gradeController.updateGrade);
router.delete('/admin/grades/:id', gradeController.deleteGrade);

// 年级学科关联管理路由 - 后台管理API
router.get('/admin/grades/:id/subjects', gradeController.getGradeSubjects);
router.post('/admin/grade-subjects', gradeController.addGradeSubject);
router.delete('/admin/grade-subjects/:id', gradeController.removeGradeSubject);

module.exports = router; 