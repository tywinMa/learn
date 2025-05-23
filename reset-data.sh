#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始重置数据...${NC}"

# 转到服务器目录
cd server

# 检查服务器是否正在运行
echo -e "${YELLOW}检查并停止所有相关服务...${NC}"

# 检查并停止server进程
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

# 清理所有nodemon相关进程
echo -e "${YELLOW}清理nodemon相关进程...${NC}"
NODEMON_PIDS=$(pgrep -f "nodemon" 2>/dev/null)
if [ -n "$NODEMON_PIDS" ]; then
  echo -e "${YELLOW}发现nodemon进程: $NODEMON_PIDS，正在终止...${NC}"
  echo "$NODEMON_PIDS" | xargs kill -15 2>/dev/null
  sleep 2
  # 检查是否还有残留进程
  REMAINING_NODEMON=$(pgrep -f "nodemon" 2>/dev/null)
  if [ -n "$REMAINING_NODEMON" ]; then
    echo -e "${YELLOW}强制终止残留的nodemon进程: $REMAINING_NODEMON${NC}"
    echo "$REMAINING_NODEMON" | xargs kill -9 2>/dev/null
  fi
  echo -e "${YELLOW}nodemon进程已清理${NC}"
else
  echo -e "${YELLOW}没有发现nodemon进程${NC}"
fi

# 清理所有占用相关端口的进程
echo -e "${YELLOW}清理端口占用...${NC}"
PORT_PIDS=$(lsof -t -i:3000 2>/dev/null)
if [ -n "$PORT_PIDS" ]; then
  echo -e "${YELLOW}终止占用3000端口的进程: $PORT_PIDS${NC}"
  kill -9 $PORT_PIDS 2>/dev/null
fi

PORT_PIDS_8082=$(lsof -t -i:8082 2>/dev/null)
if [ -n "$PORT_PIDS_8082" ]; then
  echo -e "${YELLOW}终止占用8082端口的进程: $PORT_PIDS_8082${NC}"
  kill -9 $PORT_PIDS_8082 2>/dev/null
fi

echo -e "${GREEN}所有相关服务已清理完成${NC}"

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
  echo -e "${GREEN}数据初始化完成！${NC}"
  
  # 数据库模型同步（确保数据库结构与模型定义一致）
  echo -e "${BLUE}同步数据库模型...${NC}"
  node sync-database.js
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}数据库模型同步完成！${NC}"
    
    # 添加知识点示例数据
    echo -e "${BLUE}添加知识点示例数据...${NC}"
    node add-sample-knowledge-points.js
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}知识点数据添加完成！${NC}"
      echo -e "${GREEN}==============================================${NC}"
      echo -e "${GREEN}数据重置完成！包含以下功能：${NC}"
      echo -e "${GREEN}✓ 学科和单元数据${NC}"
      echo -e "${GREEN}✓ 练习题数据${NC}"
      echo -e "${GREEN}✓ 数据库模型同步${NC}"
      echo -e "${GREEN}✓ 知识点示例数据${NC}"
      echo -e "${GREEN}==============================================${NC}"
    else
      echo -e "${YELLOW}知识点数据添加失败，但基础数据已重置成功${NC}"
    fi
  else
    echo -e "${YELLOW}数据库模型同步失败，但基础数据已重置成功${NC}"
  fi
  
  # 返回项目根目录
  cd "${0%/*}"
  
  echo -e "${YELLOW}建议: 您可以运行 ${GREEN}./start-dev.sh${YELLOW} 重启开发服务器${NC}"
else
  echo -e "${RED}数据重置失败！${NC}"
  exit 1
fi 