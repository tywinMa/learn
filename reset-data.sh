#!/bin/bash

# 输出颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}准备初始化数据...${NC}"

# 确保服务端代码目录存在
if [ ! -d "./server" ]; then
  echo -e "${RED}错误: 找不到服务端代码目录${NC}"
  exit 1
fi

# 进入服务端目录
cd server

# 确保node_modules存在
if [ ! -d "./node_modules" ]; then
  echo -e "${YELLOW}正在安装服务端依赖...${NC}"
  npm install
fi

# 执行数据库初始化
echo -e "${YELLOW}开始执行数据库初始化...${NC}"
node -e "require('./src/database/init')().then(() => console.log('数据库初始化完成')).catch(err => { console.error(err); process.exit(1); })"

# 执行初始化脚本 - 添加基础练习题
echo -e "${YELLOW}开始添加基础练习题...${NC}"
node src/utils/initData.js

# 添加缺失的练习题
echo -e "${YELLOW}开始添加缺失的练习题...${NC}"
node src/utils/runAddMissingExercises.js

# 添加新类型的多样化练习题
echo -e "${YELLOW}开始添加多样化练习题...${NC}"
node src/utils/addNewExerciseTypes.js

# 添加单元1-1的多样化练习题
echo -e "${YELLOW}开始添加单元1-1练习题...${NC}"
node src/utils/runAddUnit1_1Exercises.js

# 添加学习内容
echo -e "${YELLOW}开始添加学习内容...${NC}"
node -e "const initLearningContent = require('./src/utils/initLearningContent'); initLearningContent().then(() => console.log('学习内容初始化完成')).catch(err => { console.error(err); process.exit(1); })"

# 检查执行结果
if [ $? -eq 0 ]; then
  echo -e "${GREEN}数据初始化成功！${NC}"
  echo -e "${YELLOW}现在可以启动服务端: npm start${NC}"
else
  echo -e "${RED}数据初始化失败，请检查错误日志${NC}"
  exit 1
fi

cd ..
echo -e "${GREEN}完成！${NC}" 