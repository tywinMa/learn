#!/bin/bash

# 显示彩色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${YELLOW}=== 学习应用开发环境启动脚本 ===${NC}"
echo -e "${BLUE}本脚本将构建前端应用并启动后端服务${NC}"
echo ""

# 检查目录结构
if [ ! -d "app" ]; then
  echo -e "${YELLOW}警告: 未找到app目录，请确保您在项目根目录下运行此脚本${NC}"
fi

if [ ! -d "server" ]; then
  echo -e "${YELLOW}警告: 未找到server目录，请确保您在项目根目录下运行此脚本${NC}"
fi

# 安装依赖
echo -e "${GREEN}正在安装项目依赖...${NC}"
npm install

# 构建前端
echo -e "${GREEN}正在构建前端应用...${NC}"
npx expo export -p web

# 确认前端构建成功
if [ $? -eq 0 ]; then
  echo -e "${GREEN}前端构建成功！${NC}"
else
  echo -e "${YELLOW}前端构建失败，请检查错误信息${NC}"
  exit 1
fi

# 启动后端
echo -e "${GREEN}正在启动后端服务...${NC}"
cd server
npm install
npm start &
SERVER_PID=$!

# 等待后端启动
echo -e "${BLUE}等待后端服务启动...${NC}"
sleep 3

# 检查后端是否成功启动
if ps -p $SERVER_PID > /dev/null; then
  echo -e "${GREEN}后端服务启动成功！${NC}"
else
  echo -e "${YELLOW}后端服务启动失败，请检查错误信息${NC}"
  exit 1
fi

# 返回根目录
cd ..

# 提供开发环境信息
echo ""
echo -e "${GREEN}开发环境已启动:${NC}"
echo -e "${BLUE}后端服务运行在: ${GREEN}http://localhost:3000${NC}"
echo -e "${BLUE}前端应用路径: ${GREEN}./app${NC}"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo -e " - 使用 ${GREEN}npm run start${NC} 启动Expo开发服务器"
echo -e " - 按 ${GREEN}Ctrl+C${NC} 停止所有服务"

# 添加清理函数
cleanup() {
  echo ""
  echo -e "${YELLOW}正在关闭服务...${NC}"
  kill $SERVER_PID 2>/dev/null
  echo -e "${GREEN}服务已停止，再见！${NC}"
  exit 0
}

# 捕获中断信号
trap cleanup SIGINT

# 保持脚本运行，等待用户中断
echo ""
echo -e "${BLUE}服务运行中...按 Ctrl+C 停止${NC}"
wait
