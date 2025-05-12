#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始重置数据...${NC}"

# 转到服务器目录
cd server

# 检查服务器是否正在运行
if pgrep -f "node.*server/src/index.js" > /dev/null; then
  echo -e "${YELLOW}检测到服务器正在运行，将会先停止服务器...${NC}"
  # 尝试优雅地结束服务器进程
  pkill -15 -f "node.*server/src/index.js"
  # 等待服务器关闭
  sleep 2
  # 如果仍在运行，强制终止
  if pgrep -f "node.*server/src/index.js" > /dev/null; then
    echo -e "${YELLOW}服务器未能优雅关闭，将强制终止...${NC}"
    pkill -9 -f "node.*server/src/index.js"
  fi
  echo -e "${YELLOW}服务器已停止${NC}"
fi

# 确认数据库连接
echo -e "${YELLOW}检查数据库连接...${NC}"
node -e "require('./src/config/database').testConnection().then(() => console.log('数据库连接正常')).catch(err => { console.error('数据库连接错误:', err); process.exit(1); })"

if [ $? -ne 0 ]; then
  echo -e "${RED}数据库连接失败，无法重置数据！${NC}"
  exit 1
fi

echo -e "${YELLOW}运行数据初始化脚本...${NC}"
# 运行服务器端的初始化脚本
node src/utils/initData.js

if [ $? -eq 0 ]; then
  echo -e "${GREEN}数据重置完成！${NC}"
  
  # 返回项目根目录
  cd "${0%/*}"
  
  echo -e "${YELLOW}建议: 您可以运行 ${GREEN}./start-dev.sh${YELLOW} 重启开发服务器${NC}"
else
  echo -e "${RED}数据重置失败！${NC}"
  exit 1
fi 