const sequelize = require('../config/database');

/**
 * 为exercises表添加习题组相关字段的迁移
 * 添加: exerciseCode, title, description, content字段
 * 修改: subject字段从VIRTUAL改为实际字段
 */
async function addExerciseGroupFields() {
  console.log('开始执行迁移: 添加习题组相关字段');
  
  try {
    // 获取表结构信息
    const tableInfo = await sequelize.query(
      "PRAGMA table_info(exercises);",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('当前exercises表结构:', tableInfo.map(col => col.name));
    
    // 检查exerciseCode字段是否已存在
    const hasExerciseCode = tableInfo.some(column => column.name === 'exercise_code');
    if (!hasExerciseCode) {
      console.log('添加exercise_code字段...');
      await sequelize.query(
        "ALTER TABLE exercises ADD COLUMN exercise_code TEXT;",
        { type: sequelize.QueryTypes.RAW }
      );
      console.log('exercise_code字段添加成功');
    }
    
    // 检查title字段是否已存在
    const hasTitle = tableInfo.some(column => column.name === 'title');
    if (!hasTitle) {
      console.log('添加title字段...');
      await sequelize.query(
        "ALTER TABLE exercises ADD COLUMN title TEXT;",
        { type: sequelize.QueryTypes.RAW }
      );
      console.log('title字段添加成功');
    }
    
    // 检查description字段是否已存在
    const hasDescription = tableInfo.some(column => column.name === 'description');
    if (!hasDescription) {
      console.log('添加description字段...');
      await sequelize.query(
        "ALTER TABLE exercises ADD COLUMN description TEXT;",
        { type: sequelize.QueryTypes.RAW }
      );
      console.log('description字段添加成功');
    }
    
    // 检查content字段是否已存在
    const hasContent = tableInfo.some(column => column.name === 'content');
    if (!hasContent) {
      console.log('添加content字段...');
      await sequelize.query(
        "ALTER TABLE exercises ADD COLUMN content TEXT;",
        { type: sequelize.QueryTypes.RAW }
      );
      console.log('content字段添加成功');
    }
    
    // 检查subject字段是否已存在（应该添加为实际字段）
    const hasSubject = tableInfo.some(column => column.name === 'subject');
    if (!hasSubject) {
      console.log('添加subject字段...');
      await sequelize.query(
        "ALTER TABLE exercises ADD COLUMN subject TEXT;",
        { type: sequelize.QueryTypes.RAW }
      );
      console.log('subject字段添加成功');
    }
    
    // 为现有记录生成exerciseCode（如果没有的话）
    console.log('为现有记录生成exerciseCode...');
    const exercisesWithoutCode = await sequelize.query(
      "SELECT id FROM exercises WHERE exercise_code IS NULL OR exercise_code = '';",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    for (let i = 0; i < exercisesWithoutCode.length; i++) {
      const exercise = exercisesWithoutCode[i];
      const code = `E${10001 + i}`;
      await sequelize.query(
        "UPDATE exercises SET exercise_code = ? WHERE id = ?;",
        { 
          replacements: [code, exercise.id],
          type: sequelize.QueryTypes.UPDATE 
        }
      );
    }
    
    // 为现有记录设置默认的title和subject
    console.log('为现有记录设置默认值...');
    await sequelize.query(
      "UPDATE exercises SET title = '习题 ' || exercise_code WHERE title IS NULL OR title = '';",
      { type: sequelize.QueryTypes.UPDATE }
    );
    
    await sequelize.query(
      "UPDATE exercises SET subject = 'general' WHERE subject IS NULL OR subject = '';",
      { type: sequelize.QueryTypes.UPDATE }
    );
    
    // 将现有的单个习题转换为content格式
    const existingExercises = await sequelize.query(
      "SELECT id, question, type, options, answer, difficulty, explanation FROM exercises WHERE content IS NULL OR content = '';",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    for (const exercise of existingExercises) {
      if (exercise.question) {
        const contentArray = [{
          question: exercise.question,
          type: exercise.type || 'choice',
          options: exercise.options ? JSON.parse(exercise.options) : null,
          correctAnswer: exercise.answer ? JSON.parse(exercise.answer) : null,
          difficulty: exercise.difficulty || '2',
          explanation: exercise.explanation
        }];
        
        await sequelize.query(
          "UPDATE exercises SET content = ? WHERE id = ?;",
          { 
            replacements: [JSON.stringify(contentArray), exercise.id],
            type: sequelize.QueryTypes.UPDATE 
          }
        );
      }
    }
    
    console.log('习题组字段添加完成');
    return true;
  } catch (error) {
    console.error('迁移执行失败:', error);
    throw error;
  }
}

module.exports = addExerciseGroupFields; 