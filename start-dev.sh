#!/bin/bash

PORT_PIDS1=$(lsof -t -i:3000 2>/dev/null)
if [ -n "$PORT_PIDS1" ]; then
  echo -e "${YELLOW}发现占用3000端口的进程: $PORT_PIDS1，正在终止...${NC}"
  kill -9 $PORT_PIDS1 2>/dev/null
fi

PORT_PIDS2=$(lsof -t -i:8082 2>/dev/null)
if [ -n "$PORT_PIDS2" ]; then
  echo -e "${YELLOW}发现占用3000端口的进程: $PORT_PIDS2，正在终止...${NC}"
  kill -9 $PORT_PIDS2 2>/dev/null
fi

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查并终止已有的服务器进程
echo -e "${YELLOW}检查并终止已有的服务器进程...${NC}"

# 等待进程完全终止
sleep 1

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

# 当前端应用关闭时，也关闭后端服务器

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
