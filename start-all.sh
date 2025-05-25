#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 服务PID变量
SERVER_PID=""
ADMIN_PID=""
APP_PID=""

# 清理函数 - 用于终止所有相关进程
cleanup() {
  echo -e "\n${YELLOW}正在关闭所有服务...${NC}"
  
  # 关闭后端服务
  if [ -n "$SERVER_PID" ]; then
    echo -e "${YELLOW}终止后端服务进程: $SERVER_PID${NC}"
    kill -15 $SERVER_PID 2>/dev/null || kill -9 $SERVER_PID 2>/dev/null
  fi
  
  # 关闭后台管理服务
  if [ -n "$ADMIN_PID" ]; then
    echo -e "${YELLOW}终止后台管理服务进程: $ADMIN_PID${NC}"
    kill -15 $ADMIN_PID 2>/dev/null || kill -9 $ADMIN_PID 2>/dev/null
  fi
  
  # 关闭App端服务
  if [ -n "$APP_PID" ]; then
    echo -e "${YELLOW}终止App端服务进程: $APP_PID${NC}"
    kill -15 $APP_PID 2>/dev/null || kill -9 $APP_PID 2>/dev/null
  fi
  
  # 清理所有相关进程
  echo -e "${YELLOW}清理相关进程...${NC}"
  
  # 清理nodemon进程
  NODEMON_PIDS=$(pgrep -f "nodemon" 2>/dev/null)
  if [ -n "$NODEMON_PIDS" ]; then
    echo -e "${YELLOW}终止nodemon进程: $NODEMON_PIDS${NC}"
    echo "$NODEMON_PIDS" | xargs kill -15 2>/dev/null || echo "$NODEMON_PIDS" | xargs kill -9 2>/dev/null
  fi
  
  # 清理vite进程
  VITE_PIDS=$(pgrep -f "vite" 2>/dev/null)
  if [ -n "$VITE_PIDS" ]; then
    echo -e "${YELLOW}终止vite进程: $VITE_PIDS${NC}"
    echo "$VITE_PIDS" | xargs kill -15 2>/dev/null || echo "$VITE_PIDS" | xargs kill -9 2>/dev/null
  fi
  
  # 清理expo进程
  EXPO_PIDS=$(pgrep -f "expo" 2>/dev/null)
  if [ -n "$EXPO_PIDS" ]; then
    echo -e "${YELLOW}终止expo进程: $EXPO_PIDS${NC}"
    echo "$EXPO_PIDS" | xargs kill -15 2>/dev/null || echo "$EXPO_PIDS" | xargs kill -9 2>/dev/null
  fi
  
  # 查找并终止所有占用相关端口的进程
  PORTS=(3000 5173 5174 8082)
  for PORT in "${PORTS[@]}"; do
    PORT_PIDS=$(lsof -t -i:$PORT 2>/dev/null)
    if [ -n "$PORT_PIDS" ]; then
      echo -e "${YELLOW}终止占用${PORT}端口的进程: $PORT_PIDS${NC}"
      kill -9 $PORT_PIDS 2>/dev/null
    fi
  done
  
  # 等待一下让进程完全终止
  sleep 2
  
  echo -e "${GREEN}所有服务已关闭${NC}"
  exit 0
}

# 注册信号处理程序（捕获Ctrl+C和终止信号）
trap cleanup SIGINT SIGTERM

# 显示帮助信息
show_help() {
  echo -e "${BLUE}Learn 项目启动脚本${NC}"
  echo -e "${YELLOW}用法:${NC}"
  echo -e "  ./start-all.sh                 # 启动所有服务"
  echo -e "  ./start-all.sh --help          # 显示此帮助信息"
  echo ""
  echo -e "${YELLOW}启动的服务:${NC}"
  echo -e "  ${GREEN}后端服务${NC}:     http://localhost:3000 (learn-server)"
  echo -e "  ${GREEN}后台管理${NC}:     http://localhost:5174 (learn-admin)"
  echo -e "  ${GREEN}App端${NC}:        http://localhost:8082 (learn)"
  echo ""
  echo -e "${YELLOW}注意事项:${NC}"
  echo -e "  - 请确保已安装所有依赖 (npm install)"
  echo -e "  - 按 Ctrl+C 可以停止所有服务"
  echo -e "  - 如果端口被占用，脚本会自动清理"
  echo ""
}

# 解析命令行参数
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  show_help
  exit 0
fi

# 在启动前清理已有进程
echo -e "${YELLOW}清理启动前的残留进程...${NC}"

# 清理各种进程
PROCESS_TYPES=("nodemon" "vite" "expo")
for PROCESS in "${PROCESS_TYPES[@]}"; do
  EXISTING_PIDS=$(pgrep -f "$PROCESS" 2>/dev/null)
  if [ -n "$EXISTING_PIDS" ]; then
    echo -e "${YELLOW}发现残留的${PROCESS}进程: $EXISTING_PIDS，正在终止...${NC}"
    echo "$EXISTING_PIDS" | xargs kill -9 2>/dev/null
  fi
done

# 清理端口占用
PORTS=(3000 5173 5174 8082)
for PORT in "${PORTS[@]}"; do
  PORT_PIDS=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PORT_PIDS" ]; then
    echo -e "${YELLOW}发现占用${PORT}端口的进程: $PORT_PIDS，正在终止...${NC}"
    kill -9 $PORT_PIDS 2>/dev/null
  fi
done

# 等待进程完全终止
sleep 3

echo -e "${GREEN}==============================================${NC}"
echo -e "${BLUE}🚀 启动 Learn 项目所有服务${NC}"
echo -e "${GREEN}==============================================${NC}"

# 检查目录是否存在
if [ ! -d "learn-server" ]; then
  echo -e "${RED}错误: learn-server 目录不存在${NC}"
  exit 1
fi

if [ ! -d "learn-admin" ]; then
  echo -e "${RED}错误: learn-admin 目录不存在${NC}"
  exit 1
fi

if [ ! -d "learn" ]; then
  echo -e "${RED}错误: learn 目录不存在${NC}"
  exit 1
fi

# 1. 启动后端服务器 (learn-server)
echo -e "${GREEN}1. 启动后端服务器 (learn-server)...${NC}"
cd "$SCRIPT_DIR/learn-server"
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
echo -e "${CYAN}   后端服务PID: $SERVER_PID${NC}"

# 等待后端服务器启动
echo -e "${YELLOW}   等待后端服务器启动...${NC}"
sleep 5

# 检查后端服务器是否成功启动
if ! lsof -i:3000 >/dev/null 2>&1; then
  echo -e "${RED}   后端服务器启动失败，请检查日志: logs/server.log${NC}"
  cleanup
  exit 1
fi
echo -e "${GREEN}   ✅ 后端服务器启动成功: http://localhost:3000${NC}"

# 2. 启动后台管理系统 (learn-admin)
echo -e "${GREEN}2. 启动后台管理系统 (learn-admin)...${NC}"
cd "$SCRIPT_DIR/learn-admin"
npm run dev > ../logs/admin.log 2>&1 &
ADMIN_PID=$!
echo -e "${CYAN}   后台管理PID: $ADMIN_PID${NC}"

# 等待后台管理系统启动
echo -e "${YELLOW}   等待后台管理系统启动...${NC}"
sleep 8

# 检查后台管理系统是否成功启动
ADMIN_PORT_FOUND=false
for PORT in 5173 5174; do
  if lsof -i:$PORT >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ 后台管理系统启动成功: http://localhost:$PORT${NC}"
    ADMIN_PORT_FOUND=true
    break
  fi
done

if [ "$ADMIN_PORT_FOUND" = false ]; then
  echo -e "${RED}   后台管理系统启动失败，请检查日志: logs/admin.log${NC}"
  cleanup
  exit 1
fi

# 3. 启动App端 (learn)
echo -e "${GREEN}3. 启动App端 (learn)...${NC}"
cd "$SCRIPT_DIR/learn"
npm run web > ../logs/app.log 2>&1 &
APP_PID=$!
echo -e "${CYAN}   App端PID: $APP_PID${NC}"

# 等待App端启动
echo -e "${YELLOW}   等待App端启动...${NC}"
sleep 10

# 检查App端是否成功启动
if ! lsof -i:8082 >/dev/null 2>&1; then
  echo -e "${RED}   App端启动失败，请检查日志: logs/app.log${NC}"
  cleanup
  exit 1
fi
echo -e "${GREEN}   ✅ App端启动成功: http://localhost:8082${NC}"

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs"

echo -e "${GREEN}==============================================${NC}"
echo -e "${BLUE}🎉 所有服务启动成功！${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "${YELLOW}服务地址:${NC}"
echo -e "  ${GREEN}后端API${NC}:      http://localhost:3000"
echo -e "  ${GREEN}后台管理${NC}:      http://localhost:5174 (或 5173)"
echo -e "  ${GREEN}App端${NC}:         http://localhost:8082"
echo ""
echo -e "${YELLOW}日志文件:${NC}"
echo -e "  ${CYAN}后端日志${NC}:      logs/server.log"
echo -e "  ${CYAN}后台日志${NC}:      logs/admin.log"
echo -e "  ${CYAN}App端日志${NC}:     logs/app.log"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo -e "  - 按 ${RED}Ctrl+C${NC} 停止所有服务"
echo -e "  - 使用 ${CYAN}tail -f logs/*.log${NC} 查看实时日志"
echo -e "  - 如需重置数据，请使用 ${CYAN}./reset-data.sh${NC}"
echo -e "${GREEN}==============================================${NC}"

# 保持脚本运行，等待用户中断
echo -e "${BLUE}服务正在运行中... (按 Ctrl+C 停止)${NC}"
while true; do
  sleep 1
  
  # 检查服务是否还在运行
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}后端服务意外停止${NC}"
    cleanup
    exit 1
  fi
  
  if ! kill -0 $ADMIN_PID 2>/dev/null; then
    echo -e "${RED}后台管理服务意外停止${NC}"
    cleanup
    exit 1
  fi
  
  if ! kill -0 $APP_PID 2>/dev/null; then
    echo -e "${RED}App端服务意外停止${NC}"
    cleanup
    exit 1
  fi
done 