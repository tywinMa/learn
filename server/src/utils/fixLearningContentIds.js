const { LearningContent, Subject } = require('../models');
const { sequelize } = require('../config/database');

/**
 * 修复学习内容的unitId格式，确保与API调用匹配
 */
const fixLearningContentIds = async () => {
  try {
    console.log('开始修复学习内容unitId格式...');

    // 获取所有学习内容
    const contents = await LearningContent.findAll();
    console.log(`找到 ${contents.length} 条学习内容记录`);

    // 获取所有学科
    const subjects = await Subject.findAll();
    const subjectCodeMap = {};
    subjects.forEach(subject => {
      subjectCodeMap[subject.id] = subject.code;
    });

    // 计数器
    let updatedCount = 0;

    // 开始事务
    const transaction = await sequelize.transaction();

    try {
      // 检查并修复每条记录
      for (const content of contents) {
        const unitId = content.unitId;
        const subjectId = content.subjectId;
        const subjectCode = subjectCodeMap[subjectId];

        if (!subjectCode) {
          console.log(`警告: 找不到ID为 ${subjectId} 的学科`);
          continue;
        }

        // 检查unitId格式是否正确
        // 正确格式应为 "math-1-1" 或类似格式，以学科代码开头
        if (!unitId.startsWith(`${subjectCode}-`)) {
          // 构建正确的unitId
          let correctedUnitId;

          if (unitId.includes('-')) {
            // 如果已经有分隔符，直接添加学科前缀
            correctedUnitId = `${subjectCode}-${unitId}`;
          } else {
            // 如果没有分隔符，假设是单级ID
            correctedUnitId = `${subjectCode}-${unitId}`;
          }

          console.log(`修复记录 ${content.id}: ${unitId} -> ${correctedUnitId}`);

          // 更新记录
          await content.update({ unitId: correctedUnitId }, { transaction });
          updatedCount++;
        }
      }

      // 提交事务
      await transaction.commit();
      console.log(`成功修复 ${updatedCount} 条学习内容记录的unitId格式`);

    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('修复学习内容unitId格式出错:', error);
    throw error;
  }
};

// 如果直接运行该文件
if (require.main === module) {
  fixLearningContentIds().then(() => {
    console.log('修复脚本执行完毕');
    process.exit();
  }).catch(err => {
    console.error('修复脚本执行失败:', err);
    process.exit(1);
  });
}

module.exports = fixLearningContentIds; 