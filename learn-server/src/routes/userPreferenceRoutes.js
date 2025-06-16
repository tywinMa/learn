const express = require('express');
const router = express.Router();
const userPreferenceController = require('../controllers/userPreferenceController');

// 用户偏好管理路由 - APP端API
router.get('/students/:studentId/preferences', userPreferenceController.getUserPreferences);
router.get('/students/:studentId/preferences/:subjectCode', userPreferenceController.getUserSubjectGradePreference);
router.post('/preferences', userPreferenceController.setUserPreference);
router.delete('/students/:studentId/preferences/:subjectCode', userPreferenceController.deleteUserPreference);

// 学科年级查询路由 - APP端API
router.get('/subjects/:subjectCode/grades', userPreferenceController.getSubjectAvailableGrades);

module.exports = router; 