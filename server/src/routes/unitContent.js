const express = require('express');
const router = express.Router();
const { Course } = require('../models');

// 获取特定课程的学习内容
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // 检查courseId是否为undefined或无效值
    if (!courseId || courseId === 'undefined' || courseId === 'null') {
      return res.status(400).json({
        success: false,
        message: '无效的课程ID参数'
      });
    }

    console.log(`获取课程 ${courseId} 的学习内容`);

    // 查询课程学习内容
    const course = await Course.findByPk(courseId, {
      attributes: ['id', 'title', 'content', 'media', 'subject', 'description']
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `未找到课程 ${courseId}`
      });
    }

    // 如果课程没有学习内容
    if (!course.content && (!course.media || course.media.length === 0)) {
      return res.status(404).json({
        success: false,
        message: `课程 ${courseId} 没有学习内容`
      });
    }

    res.json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        content: course.content,
        media: course.media || [],
        subject: course.subject,
        description: course.description
      }
    });
  } catch (error) {
    console.error('获取课程学习内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 更新课程学习内容（需要管理员权限）
router.put('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, media } = req.body;

    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `未找到课程 ${courseId}`
      });
    }

    // 更新课程学习内容
    await course.update({
      content: content !== undefined ? content : course.content,
      media: media !== undefined ? media : course.media
    });

    res.json({
      success: true,
      message: '课程学习内容更新成功',
      data: {
        id: course.id,
        title: course.title,
        content: course.content,
        media: course.media,
        subject: course.subject,
        description: course.description
      }
    });
  } catch (error) {
    console.error('更新课程学习内容出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router; 