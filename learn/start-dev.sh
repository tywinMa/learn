#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 清理函数 - 用于终止所有相关进程
cleanup() {
  echo -e "\n${YELLOW}正在关闭所有服务...${NC}"
  
  # 关闭后端服务
  if [ -n "$SERVER_PID" ]; then
    echo -e "${YELLOW}终止后端服务进程: $SERVER_PID${NC}"
    kill -15 $SERVER_PID 2>/dev/null || kill -9 $SERVER_PID 2>/dev/null
  fi
  
  # 清理所有nodemon相关进程
  echo -e "${YELLOW}清理nodemon相关进程...${NC}"
  NODEMON_PIDS=$(pgrep -f "nodemon" 2>/dev/null)
  if [ -n "$NODEMON_PIDS" ]; then
    echo -e "${YELLOW}终止nodemon进程: $NODEMON_PIDS${NC}"
    echo "$NODEMON_PIDS" | xargs kill -15 2>/dev/null || echo "$NODEMON_PIDS" | xargs kill -9 2>/dev/null
  fi
  
  # 清理所有node相关的服务器进程
  echo -e "${YELLOW}清理node服务器进程...${NC}"
  NODE_SERVER_PIDS=$(pgrep -f "node.*src/index" 2>/dev/null)
  if [ -n "$NODE_SERVER_PIDS" ]; then
    echo -e "${YELLOW}终止node服务器进程: $NODE_SERVER_PIDS${NC}"
    echo "$NODE_SERVER_PIDS" | xargs kill -15 2>/dev/null || echo "$NODE_SERVER_PIDS" | xargs kill -9 2>/dev/null
  fi
  
  # 查找并终止所有占用相关端口的进程
  PORT_PIDS1=$(lsof -t -i:3000 2>/dev/null)
  if [ -n "$PORT_PIDS1" ]; then
    echo -e "${YELLOW}终止占用3000端口的进程: $PORT_PIDS1${NC}"
    kill -9 $PORT_PIDS1 2>/dev/null
  fi

  PORT_PIDS2=$(lsof -t -i:8082 2>/dev/null)
  if [ -n "$PORT_PIDS2" ]; then
    echo -e "${YELLOW}终止占用8082端口的进程: $PORT_PIDS2${NC}"
    kill -9 $PORT_PIDS2 2>/dev/null
  fi
  
  # 等待一下让进程完全终止
  sleep 1
  
  # 最后再检查一次是否还有残留的nodemon进程
  REMAINING_NODEMON=$(pgrep -f "nodemon" 2>/dev/null)
  if [ -n "$REMAINING_NODEMON" ]; then
    echo -e "${YELLOW}强制终止残留的nodemon进程: $REMAINING_NODEMON${NC}"
    echo "$REMAINING_NODEMON" | xargs kill -9 2>/dev/null
  fi
  
  echo -e "${GREEN}所有服务已关闭${NC}"
  exit 0
}

# 注册信号处理程序（捕获Ctrl+C和终止信号）
trap cleanup SIGINT SIGTERM

# 在启动前清理已有进程
echo -e "${YELLOW}清理启动前的残留进程...${NC}"

# 清理nodemon进程
EXISTING_NODEMON=$(pgrep -f "nodemon" 2>/dev/null)
if [ -n "$EXISTING_NODEMON" ]; then
  echo -e "${YELLOW}发现残留的nodemon进程: $EXISTING_NODEMON，正在终止...${NC}"
  echo "$EXISTING_NODEMON" | xargs kill -9 2>/dev/null
fi

# 清理端口占用
PORT_PIDS1=$(lsof -t -i:3000 2>/dev/null)
if [ -n "$PORT_PIDS1" ]; then
  echo -e "${YELLOW}发现占用3000端口的进程: $PORT_PIDS1，正在终止...${NC}"
  kill -9 $PORT_PIDS1 2>/dev/null
fi

PORT_PIDS2=$(lsof -t -i:8082 2>/dev/null)
if [ -n "$PORT_PIDS2" ]; then
  echo -e "${YELLOW}发现占用8082端口的进程: $PORT_PIDS2，正在终止...${NC}"
  kill -9 $PORT_PIDS2 2>/dev/null
fi

# 检查并终止已有的服务器进程
echo -e "${YELLOW}检查并终止已有的服务器进程...${NC}"
NODE_SERVER_PIDS=$(pgrep -f "node.*src/index" 2>/dev/null)
if [ -n "$NODE_SERVER_PIDS" ]; then
  echo -e "${YELLOW}发现残留的node服务器进程: $NODE_SERVER_PIDS，正在终止...${NC}"
  echo "$NODE_SERVER_PIDS" | xargs kill -9 2>/dev/null
fi

# 等待进程完全终止
sleep 2

# 启动后端服务器
echo -e "${GREEN}启动后端服务器...${NC}"
cd server && npm run dev &
SERVER_PID=$!

# 等待几秒钟让服务器启动
echo -e "${YELLOW}等待服务器启动...${NC}"
sleep 3

# 检查服务器是否成功启动
if ! lsof -i:3000 >/dev/null 2>&1; then
  echo -e "${RED}服务器启动失败，请检查日志${NC}"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# 返回项目根目录
cd "${0%/*}"

# 启动前端应用
echo -e "${GREEN}启动前端应用...${NC}"
npm run web

# 当前端应用自然结束时也清理所有进程
cleanup
