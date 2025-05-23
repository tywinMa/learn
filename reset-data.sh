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

# 检查nodejs进程
echo -e "${YELLOW}检查并停止相关Node.js进程...${NC}"

# 查找并终止nodemon进程（包括使用npx运行的）
NODEMON_PIDS=$(ps aux | grep -E "nodemon|npx.*nodemon" | grep -v grep | awk '{print $2}')
if [ -n "$NODEMON_PIDS" ]; then
  echo -e "${YELLOW}终止nodemon进程: $NODEMON_PIDS${NC}"
  kill -9 $NODEMON_PIDS 2>/dev/null
fi

# 查找并终止可能的前端开发服务器进程（通常使用8081端口）
PORT_PIDS_8081=$(lsof -t -i:8081 2>/dev/null)
if [ -n "$PORT_PIDS_8081" ]; then
  echo -e "${YELLOW}终止占用8081端口的进程: $PORT_PIDS_8081${NC}"
  kill -9 $PORT_PIDS_8081 2>/dev/null
fi

# 查找并终止可能的后端服务器进程（通常使用3000端口）
PORT_PIDS_3000=$(lsof -t -i:3000 2>/dev/null)
if [ -n "$PORT_PIDS_3000" ]; then
  echo -e "${YELLOW}终止占用3000端口的进程: $PORT_PIDS_3000${NC}"
  kill -9 $PORT_PIDS_3000 2>/dev/null
fi

# 查找并终止可能占用8082端口的进程
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
  node -e "require('./src/models').syncDatabase().then(() => console.log('数据库模型同步完成')).catch(err => { console.error('同步失败:', err); process.exit(1); })"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}数据库模型同步完成！${NC}"
    
    # 初始化知识点数据
    echo -e "${BLUE}初始化知识点数据...${NC}"
    node init-knowledge-points.js
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}知识点数据初始化完成！${NC}"
      echo -e "${GREEN}==============================================${NC}"
      echo -e "${GREEN}数据重置完成！包含以下功能：${NC}"
      echo -e "${GREEN}✓ 学科和单元数据${NC}"
      echo -e "${GREEN}✓ 练习题数据${NC}"
      echo -e "${GREEN}✓ 数据库模型同步${NC}"
      echo -e "${GREEN}✓ 知识点数据和关联关系${NC}"
      echo -e "${GREEN}==============================================${NC}"
    else
      echo -e "${YELLOW}知识点数据初始化失败，但基础数据已重置成功${NC}"
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