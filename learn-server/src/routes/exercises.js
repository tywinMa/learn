const express = require("express");
const router = express.Router();
const {
  Exercise,
  AnswerRecord,
  KnowledgePoint,
  Student,
  Course,
} = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * 获取学生的数字ID
 * @param {string} userId - 字符串形式的学生ID（如"student1"）
 * @returns {number|null} - 数字形式的学生ID，如果未找到则返回null
 */
const getStudentId = async (userId) => {
  if (!userId) return null;
  
  try {
    const student = await Student.findOne({
      where: { studentId: userId },
      attributes: ['id']
    });
    return student ? student.id : null;
  } catch (error) {
    console.error('查找学生ID失败:', error);
    return null;
  }
};

// 通过课程获取习题的函数
const getExercisesByCourse = async (courseId) => {
  try {
    console.log(`[DEBUG] getExercisesByCourse called with courseId: ${courseId}`);
    
    // 获取课程信息
    const course = await Course.findByPk(courseId);
    if (!course) {
      console.log(`[DEBUG] Course not found: ${courseId}`);
      return [];
    }
    
    console.log(`[DEBUG] Course found:`, course.toJSON());
    
    const exerciseIds = course.exerciseIds || [];
    console.log(`[DEBUG] Exercise IDs:`, exerciseIds);
    
    if (exerciseIds.length === 0) {
      console.log(`[DEBUG] No exercises found for course: ${courseId}`);
      return [];
    }
    
    // 获取习题详情
    const exercises = await Exercise.findAll({
      where: { id: { [Op.in]: exerciseIds } },
      order: [['id', 'ASC']]
    });
    
    console.log(`[DEBUG] Exercises found:`, exercises.length);
    
    return exercises;
  } catch (error) {
    console.error('[DEBUG] 通过课程获取习题出错:', error);
    return [];
  }
};



// 获取学科下的所有练习题
router.get("/", async (req, res) => {
  try {
    const { subject } = req.query;
    
    let whereClause = {};
    if (subject) {
      whereClause.subject = subject;
    }
    
    const exercises = await Exercise.findAll({
      where: whereClause,
      attributes: ['id', 'subject', 'title', 'type', 'difficulty'],
      order: [['subject', 'ASC'], ['id', 'ASC']]
    });

    res.json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    console.error("获取练习题出错:", error);
    res.status(500).json({
      success: false,
      message: "服务器错误",
    });
  }
});

// 根据课程ID获取练习题（主要API）
router.get("/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, filterCompleted, types } = req.query;

    console.log(`获取课程 ${courseId} 的练习题`);

    // 通过课程获取习题
    let exercises = await getExercisesByCourse(courseId);

    // 根据题型筛选
    if (types) {
      const typesList = types.split(",");
      if (typesList.length > 0) {
        exercises = exercises.filter(exercise => typesList.includes(exercise.type));
      }
    }

    // 如果需要过滤已完成的题目，且提供了用户ID
    let completedExerciseIds = [];
    if (userId) {
      // 获取学生的数字ID
      const studentId = await getStudentId(userId);
      if (studentId) {
        // 查询具体的练习题ID
        const exerciseIds = exercises.map(ex => ex.id);
        if (exerciseIds.length > 0) {
          const completedExercises = await AnswerRecord.findAll({
            where: {
              studentId,
              exerciseId: { [Op.in]: exerciseIds },
              isCorrect: true,
            },
            attributes: ["exerciseId"],
            raw: true,
          });
          
          completedExerciseIds = completedExercises.map(record => record.exerciseId);
          console.log(
            `用户 ${userId} (studentId: ${studentId}) 已完成的练习题: ${
              completedExerciseIds.join(", ") || "无"
            }`
          );
        }
      } else {
        console.warn(`未找到用户: ${userId}`);
      }
    }

    console.log(`找到 ${exercises.length} 道练习题`);

    if (exercises.length === 0) {
      console.log(`未找到课程 ${courseId} 的练习题`);
      return res.status(404).json({
        success: false,
        message: `未找到课程 ${courseId} 的练习题`,
      });
    }

    // 处理附加信息，格式化返回数据
    const formattedExercises = await Promise.all(
      exercises.map(async (ex) => {
        // 创建基本题目对象
        const exercise = ex.toJSON();

        // 添加是否已完成标志
        exercise.completed = completedExerciseIds.includes(ex.id);

        // 查询关联的知识点
        if (
          exercise.knowledgePointIds &&
          exercise.knowledgePointIds.length > 0
        ) {
          const knowledgePoints = await KnowledgePoint.findAll({
            where: {
              id: { [Op.in]: exercise.knowledgePointIds },
              isActive: true,
            },
            attributes: ["id", "title", "content", "type", "mediaUrl"],
            order: [["id", "ASC"]],
          });
          exercise.knowledgePoints = knowledgePoints;
        } else {
          exercise.knowledgePoints = [];
        }

        // 处理不同题型的特殊格式化
        switch (exercise.type) {
          case "matching":
            // 匹配题需要在前端才能看到正确答案
            if (!exercise.completed) {
              exercise.correctAnswer = null;
            }
            break;
          case "application":
            // 应用题总是隐藏正确答案，因为需要老师批改
            exercise.correctAnswer = null;
            break;
          case "math":
            // 数学题型保留正确答案的值，但隐藏解题步骤
            if (
              !exercise.completed &&
              exercise.correctAnswer &&
              exercise.correctAnswer.steps
            ) {
              exercise.correctAnswer = { value: exercise.correctAnswer.value };
            }
            break;
        }

        return exercise;
      })
    );

    // 检查是否所有题目都已完成
    const allCompleted =
      exercises.length > 0 &&
      completedExerciseIds.length >= exercises.length &&
      exercises.every((ex) => completedExerciseIds.includes(ex.id));

    // 如果所有题目都已完成且需要过滤已完成的题目
    if (allCompleted && filterCompleted === "true") {
      console.log(`用户 ${userId} 已完成课程 ${courseId} 的所有练习题`);
      return res.status(200).json({
        success: true,
        data: [],
        message: "所有练习题已完成",
        allCompleted: true,
      });
    }

    // 如果需要过滤已完成的题目
    let filteredExercises = formattedExercises;
    if (filterCompleted === "true" && completedExerciseIds.length > 0) {
      filteredExercises = formattedExercises.filter(
        (ex) => !completedExerciseIds.includes(ex.id)
      );
      console.log(`过滤后剩余 ${filteredExercises.length} 道练习题`);
    }

    // 获取题型统计信息
    const typeStats = {};
    exercises.forEach((ex) => {
      const type = ex.type || "choice";
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: filteredExercises,
      allCompleted: allCompleted,
      typeStats: typeStats,
    });
  } catch (error) {
    console.error("获取课程练习题出错:", error);
    res.status(500).json({
      success: false,
      message: "获取练习题时发生服务器错误",
      error: error.message,
    });
  }
});

// 根据学科和ID获取练习题（保持兼容性）
router.get("/:subject/:unitId", async (req, res) => {
  try {
    const { subject, unitId } = req.params;
    
    // 构建课程ID格式
    const courseId = `${subject}-${unitId}`;
    
    // 直接调用主要的课程API逻辑
    const { userId, filterCompleted, types } = req.query;

    console.log(`获取课程 ${courseId} 的练习题`);

    // 通过课程获取习题
    let exercises = await getExercisesByCourse(courseId);

    // 根据题型筛选
    if (types) {
      const typesList = types.split(",");
      if (typesList.length > 0) {
        exercises = exercises.filter(exercise => typesList.includes(exercise.type));
      }
    }

    // 如果需要过滤已完成的题目，且提供了用户ID
    let completedExerciseIds = [];
    if (userId) {
      // 获取学生的数字ID
      const studentId = await getStudentId(userId);
      if (studentId) {
        // 查询具体的练习题ID
        const exerciseIds = exercises.map(ex => ex.id);
        if (exerciseIds.length > 0) {
          const completedExercises = await AnswerRecord.findAll({
            where: {
              studentId,
              exerciseId: { [Op.in]: exerciseIds },
              isCorrect: true,
            },
            attributes: ["exerciseId"],
            raw: true,
          });
          
          completedExerciseIds = completedExercises.map(record => record.exerciseId);
          console.log(
            `用户 ${userId} (studentId: ${studentId}) 已完成的练习题: ${
              completedExerciseIds.join(", ") || "无"
            }`
          );
        }
      } else {
        console.warn(`未找到用户: ${userId}`);
      }
    }

    console.log(`找到 ${exercises.length} 道练习题`);

    if (exercises.length === 0) {
      console.log(`未找到课程 ${courseId} 的练习题`);
      return res.status(404).json({
        success: false,
        message: `未找到课程 ${courseId} 的练习题`,
      });
    }

    // 处理附加信息，格式化返回数据
    const formattedExercises = await Promise.all(
      exercises.map(async (ex) => {
        // 创建基本题目对象
        const exercise = ex.toJSON();

        // 添加是否已完成标志
        exercise.completed = completedExerciseIds.includes(ex.id);

        // 查询关联的知识点
        if (
          exercise.knowledgePointIds &&
          exercise.knowledgePointIds.length > 0
        ) {
          const knowledgePoints = await KnowledgePoint.findAll({
            where: {
              id: { [Op.in]: exercise.knowledgePointIds },
              isActive: true,
            },
            attributes: ["id", "title", "content", "type", "mediaUrl"],
            order: [["id", "ASC"]],
          });
          exercise.knowledgePoints = knowledgePoints;
        } else {
          exercise.knowledgePoints = [];
        }

        // 处理不同题型的特殊格式化
        switch (exercise.type) {
          case "matching":
            // 匹配题需要在前端才能看到正确答案
            if (!exercise.completed) {
              exercise.correctAnswer = null;
            }
            break;
          case "application":
            // 应用题总是隐藏正确答案，因为需要老师批改
            exercise.correctAnswer = null;
            break;
          case "math":
            // 数学题型保留正确答案的值，但隐藏解题步骤
            if (
              !exercise.completed &&
              exercise.correctAnswer &&
              exercise.correctAnswer.steps
            ) {
              exercise.correctAnswer = { value: exercise.correctAnswer.value };
            }
            break;
        }

        return exercise;
      })
    );

    // 检查是否所有题目都已完成
    const allCompleted =
      exercises.length > 0 &&
      completedExerciseIds.length >= exercises.length &&
      exercises.every((ex) => completedExerciseIds.includes(ex.id));

    // 如果所有题目都已完成且需要过滤已完成的题目
    if (allCompleted && filterCompleted === "true") {
      console.log(`用户 ${userId} 已完成课程 ${courseId} 的所有练习题`);
      return res.status(200).json({
        success: true,
        data: [],
        message: "所有练习题已完成",
        allCompleted: true,
      });
    }

    // 如果需要过滤已完成的题目
    let filteredExercises = formattedExercises;
    if (filterCompleted === "true" && completedExerciseIds.length > 0) {
      filteredExercises = formattedExercises.filter(
        (ex) => !completedExerciseIds.includes(ex.id)
      );
      console.log(`过滤后剩余 ${filteredExercises.length} 道练习题`);
    }

    // 获取题型统计信息
    const typeStats = {};
    exercises.forEach((ex) => {
      const type = ex.type || "choice";
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    res.json({
      success: true,
      data: filteredExercises,
      allCompleted: allCompleted,
      typeStats: typeStats,
    });
  } catch (error) {
    console.error("获取学科练习题出错:", error);
    res.status(500).json({
      success: false,
      message: "获取练习题时发生服务器错误",
      error: error.message,
    });
  }
});

// 获取特定练习题
router.get("/:courseId/:exerciseId", async (req, res) => {
  try {
    const { exerciseId } = req.params;

    const exercise = await Exercise.findOne({
      where: {
        id: exerciseId,
      },
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: `未找到练习题 ${exerciseId}`,
      });
    }

    res.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error("获取练习题出错:", error);
    res.status(500).json({
      success: false,
      message: "服务器错误",
    });
  }
});

module.exports = router;
