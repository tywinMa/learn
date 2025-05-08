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

# 执行初始化脚本
echo -e "${YELLOW}开始执行初始化脚本...${NC}"
node src/utils/initData.js

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