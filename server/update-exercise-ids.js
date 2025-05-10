const { Exercise } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function updateExerciseIds() {
  try {
    // 创建新的练习题ID
    const idMap = {
      '1-1-1-app': '1-1-app-1',
      '1-1-1-1': '1-1-app-2',
      '1-1-1-2': '1-1-app-3',
      '1-1-1-3': '1-1-app-4',
      '1-1-1-4': '1-1-app-5'
    };
    
    // 开始事务
    const transaction = await sequelize.transaction();
    
    try {
      for (const [oldId, newId] of Object.entries(idMap)) {
        // 检查是否存在对应id的练习题
        const exercise = await Exercise.findByPk(oldId, { transaction });
        
        if (exercise) {
          console.log(`找到练习题: ${oldId}，将更新为: ${newId}`);
          
          // 处理可能的外键约束
          const recordsUpdate = await sequelize.query(
            `UPDATE UserRecords SET exerciseId = '${newId}' WHERE exerciseId = '${oldId}'`,
            { transaction }
          );
          
          const wrongExUpdate = await sequelize.query(
            `UPDATE WrongExercises SET exerciseId = '${newId}' WHERE exerciseId = '${oldId}'`,
            { transaction }
          );
          
          // 创建新记录
          const newExercise = {...exercise.toJSON(), id: newId};
          await Exercise.create(newExercise, { transaction });
          
          // 删除旧记录
          await Exercise.destroy({ 
            where: { id: oldId },
            transaction
          });
          
          console.log(`成功更新练习题ID: ${oldId} -> ${newId}`);
        } else {
          console.log(`未找到练习题: ${oldId}, 跳过`);
        }
      }
      
      // 提交事务
      await transaction.commit();
      console.log('所有更新已完成');
      
    } catch (error) {
      // 如果出错，回滚事务
      await transaction.rollback();
      console.error('更新出错，已回滚所有更改:', error);
    }
  } catch (error) {
    console.error('执行过程出错:', error);
  }
}

updateExerciseIds().then(() => process.exit()); 