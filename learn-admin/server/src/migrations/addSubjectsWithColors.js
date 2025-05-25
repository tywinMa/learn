const sequelize = require('../config/database');
const { Subject } = require('../models');

/**
 * 添加学科color字段并插入常见学科数据
 */
async function addSubjectsWithColors() {
  console.log('执行学科数据迁移...');
  const transaction = await sequelize.transaction();
  
  try {
    // 1. 检查是否已经存在color字段
    const tableInfo = await sequelize.query(
      "PRAGMA table_info(Subjects);",
      { type: sequelize.QueryTypes.SELECT, transaction }
    );
    
    const hasColorColumn = tableInfo.some(column => column.name === 'color');
    
    // 2. 如果不存在color字段，添加该字段
    if (!hasColorColumn) {
      console.log('添加color字段到Subjects表...');
      await sequelize.query(
        "ALTER TABLE Subjects ADD COLUMN color TEXT;",
        { transaction }
      );
    }
    
    // 3. 预定义常见学科及其颜色
    const commonSubjects = [
      { name: '语文', code: 'chinese', color: '#1677ff', description: '语言文学基础课程' },
      { name: '数学', code: 'math', color: '#52c41a', description: '数学基础与应用' },
      { name: '英语', code: 'english', color: '#722ed1', description: '英语语言学习' },
      { name: '物理', code: 'physics', color: '#eb2f96', description: '物理学基础与实验' },
      { name: '化学', code: 'chemistry', color: '#fa8c16', description: '化学原理与实验' },
      { name: '生物', code: 'biology', color: '#13c2c2', description: '生物学与生命科学' },
      { name: '历史', code: 'history', color: '#faad14', description: '历史发展与文明演进' },
      { name: '地理', code: 'geography', color: '#cf1322', description: '地理环境与人文地理' },
      { name: '政治', code: 'politics', color: '#2f54eb', description: '政治理论与思想教育' },
      { name: '信息技术', code: 'it', color: '#08979c', description: '计算机与信息技术基础' },
      { name: '计算机科学', code: 'cs', color: '#0958d9', description: '计算机科学与编程' }
    ];
    
    // 4. 遍历学科列表，检查是否存在，不存在则创建，存在则更新颜色
    for (const subjectData of commonSubjects) {
      const [subject, created] = await Subject.findOrCreate({
        where: { name: subjectData.name },
        defaults: subjectData,
        transaction
      });
      
      if (!created && !subject.color) {
        // 如果学科已存在但没有颜色，更新颜色
        await subject.update({ color: subjectData.color }, { transaction });
        console.log(`更新学科 ${subjectData.name} 的颜色为 ${subjectData.color}`);
      } else if (created) {
        console.log(`创建新学科: ${subjectData.name}, 颜色: ${subjectData.color}`);
      }
    }
    
    // 提交事务
    await transaction.commit();
    console.log('学科数据迁移完成');
    return true;
  } catch (error) {
    // 发生错误时回滚事务
    await transaction.rollback();
    console.error('学科数据迁移失败:', error);
    throw error;
  }
}

module.exports = addSubjectsWithColors; 