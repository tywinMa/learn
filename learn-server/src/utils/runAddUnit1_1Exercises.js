const addUnit1_1Exercises = require('./addUnit1_1Exercises');

console.log('开始执行添加单元1-1多样化练习题脚本...');

addUnit1_1Exercises()
  .then(() => {
    console.log('添加单元1-1练习题操作完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('添加单元1-1练习题失败:', error);
    process.exit(1);
  }); 