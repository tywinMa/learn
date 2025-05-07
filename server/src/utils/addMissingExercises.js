const { Exercise, sequelize } = require('../models');

// 添加缺失的练习题
const addMissingExercises = async () => {
  try {
    console.log('开始添加缺失的练习题...');
    
    // 需要添加的单元ID
    const missingUnitIds = ['2-3', '2-4', '3-3'];
    
    // 检查这些单元是否已存在练习题
    for (const unitId of missingUnitIds) {
      const existingCount = await Exercise.count({ where: { unitId } });
      if (existingCount > 0) {
        console.log(`单元 ${unitId} 已有 ${existingCount} 道练习题，跳过添加`);
        continue;
      }
      
      // 为该单元添加练习题
      let exercisesToAdd = [];
      
      // 根据单元ID准备不同的练习题
      switch (unitId) {
        case '2-3':
          exercisesToAdd = [
            {
              id: '2-3-1',
              unitId,
              question: '平行四边形的定义是什么？',
              options: [
                '对边平行且相等的四边形',
                '四条边都相等的四边形',
                '有一组对边平行的四边形',
                '对角线互相平分的四边形'
              ],
              correctAnswer: 0,
            },
            {
              id: '2-3-2',
              unitId,
              question: '平行四边形的对角线互相平分，这句话的正确性是？',
              options: ['正确', '错误', '部分正确', '无法判断'],
              correctAnswer: 0,
            },
            {
              id: '2-3-3',
              unitId,
              question: '如果一个四边形的对边分别平行，那么这个四边形一定是？',
              options: ['平行四边形', '菱形', '矩形', '正方形'],
              correctAnswer: 0,
            }
          ];
          break;
          
        case '2-4':
          exercisesToAdd = [
            {
              id: '2-4-1',
              unitId,
              question: '圆的切线与半径的夹角是多少度？',
              options: ['90度', '60度', '45度', '30度'],
              correctAnswer: 0,
            },
            {
              id: '2-4-2',
              unitId,
              question: '如果两个圆相交，它们最多有几个交点？',
              options: ['1个', '2个', '3个', '4个'],
              correctAnswer: 1,
            },
            {
              id: '2-4-3',
              unitId,
              question: '圆内接四边形的对角之和是多少度？',
              options: ['180度', '270度', '360度', '540度'],
              correctAnswer: 2,
            },
            {
              id: '2-4-4',
              unitId,
              question: '一个圆的面积是64π平方厘米，则它的半径是多少厘米？',
              options: ['4', '8', '16', '32'],
              correctAnswer: 0,
            }
          ];
          break;
          
        case '3-3':
          exercisesToAdd = [
            {
              id: '3-3-1',
              unitId,
              question: '如果事件A和事件B互斥，则 P(A∩B) 等于多少？',
              options: ['0', 'P(A)×P(B)', 'P(A)+P(B)', '1-P(A)-P(B)'],
              correctAnswer: 0,
            },
            {
              id: '3-3-2',
              unitId,
              question: '如果事件A和事件B独立，则 P(A|B) 等于多少？',
              options: ['P(A)', 'P(B)', 'P(A)×P(B)', 'P(A)/P(B)'],
              correctAnswer: 0,
            },
            {
              id: '3-3-3',
              unitId,
              question: '一个袋子里有3个红球和2个蓝球，随机取出2个球，取出的两个球都是红球的概率是多少？',
              options: ['3/10', '3/5', '9/25', '6/25'],
              correctAnswer: 0,
            },
            {
              id: '3-3-4',
              unitId,
              question: '如果一个随机变量X服从标准正态分布，则 P(X > 0) 等于多少？',
              options: ['0.5', '0.6827', '0.9545', '0.9973'],
              correctAnswer: 0,
            }
          ];
          break;
      }
      
      // 批量创建练习题
      await Exercise.bulkCreate(exercisesToAdd);
      console.log(`成功为单元 ${unitId} 添加 ${exercisesToAdd.length} 道练习题`);
    }
    
    console.log('缺失练习题添加完成！');
  } catch (error) {
    console.error('添加缺失练习题时出错:', error);
  }
};

// 如果直接运行该文件
if (require.main === module) {
  addMissingExercises().then(() => {
    console.log('脚本执行完毕');
    process.exit();
  }).catch(err => {
    console.error('脚本执行失败:', err);
    process.exit(1);
  });
}

module.exports = addMissingExercises; 