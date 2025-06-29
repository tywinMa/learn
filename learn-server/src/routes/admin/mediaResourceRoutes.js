const express = require('express');
const router = express.Router();
const mediaResourceController = require('../../controllers/admin/mediaResourceController');
const courseMediaResourceController = require('../../controllers/admin/courseMediaResourceController');
const { authenticate } = require('../../middlewares/auth');

// 媒体资源管理路由
router.get('/', authenticate, mediaResourceController.getMediaResources);
router.get('/stats', authenticate, mediaResourceController.getMediaResourceStats);
router.get('/:id', authenticate, mediaResourceController.getMediaResource);
router.post('/', authenticate, mediaResourceController.createMediaResource);
router.put('/:id', authenticate, mediaResourceController.updateMediaResource);
router.post('/:id/submit', authenticate, mediaResourceController.submitForReview);
router.delete('/:id', authenticate, mediaResourceController.deleteMediaResource);
router.post('/batch-status', authenticate, mediaResourceController.batchUpdateStatus);
router.post('/:id/click', mediaResourceController.incrementClickCount);
router.delete('/:id/course-relations', authenticate, courseMediaResourceController.deleteAllCourseMediaResourcesByMediaId);

// 课程-媒体资源关联管理路由
router.get('/course/:courseId/media-resources', authenticate, courseMediaResourceController.getCourseMediaResources);
router.get('/:mediaResourceId/courses', authenticate, courseMediaResourceController.getMediaResourceCourses);
router.post('/course-media-resource', authenticate, courseMediaResourceController.createCourseMediaResource);
router.put('/course-media-resource/:id', authenticate, courseMediaResourceController.updateCourseMediaResource);
router.delete('/course-media-resource/:id', authenticate, courseMediaResourceController.deleteCourseMediaResource);
router.post('/course-media-resource/batch-create', authenticate, courseMediaResourceController.batchCreateCourseMediaResources);
router.post('/course-media-resource/batch-order', authenticate, courseMediaResourceController.batchUpdateDisplayOrder);

module.exports = router; 