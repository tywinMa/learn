const addMissingExercises = require('./addMissingExercises');

console.log('开始执行添加缺失练习题脚本...');

addMissingExercises()
  .then(() => {
    console.log('添加缺失练习题操作完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('添加缺失练习题失败:', error);
    process.exit(1);
  }); 