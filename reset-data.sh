#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 解析命令行参数
HELP_MODE=false
RUN_SERVER=false
NO_ADMIN=false
NO_KNOWLEDGE=false
FORCE_RESET=false
START_ALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -r|--run)
      RUN_SERVER=true
      shift
      ;;
    -s|--start-all)
      START_ALL=true
      shift
      ;;
    --no-admin)
      NO_ADMIN=true
      shift
      ;;
    --no-knowledge)
      NO_KNOWLEDGE=true
      shift
      ;;
    -f|--force)
      FORCE_RESET=true
      shift
      ;;
    -h|--help)
      HELP_MODE=true
      shift
      ;;
    *)
      echo -e "${RED}未知参数: $1${NC}"
      HELP_MODE=true
      shift
      ;;
  esac
done

# 显示帮助信息
if [ "$HELP_MODE" = true ]; then
  echo -e "${BLUE}Learn 项目数据重置脚本${NC}"
  echo -e "${YELLOW}用法:${NC}"
  echo -e "  ./reset-data.sh                 # 完整重置数据 (不启动服务)"
  echo -e "  ./reset-data.sh -r              # 完整重置数据并启动后端服务"
  echo -e "  ./reset-data.sh -s              # 完整重置数据并启动所有服务"
  echo -e "  ./reset-data.sh --run           # 完整重置数据并启动后端服务 (完整写法)"
  echo -e "  ./reset-data.sh --start-all     # 完整重置数据并启动所有服务 (完整写法)"
  echo -e "  ./reset-data.sh --no-admin      # 重置数据但不包含管理员数据"
  echo -e "  ./reset-data.sh --no-knowledge  # 重置数据但不包含知识点数据"
  echo -e "  ./reset-data.sh --force         # 强制重建数据库表结构"
  echo -e "  ./reset-data.sh --help          # 显示此帮助信息"
  echo ""
  echo -e "${YELLOW}参数说明:${NC}"
  echo -e "  ${GREEN}-r, --run${NC}:          重置完成后自动启动后端服务"
  echo -e "  ${GREEN}-s, --start-all${NC}:    重置完成后自动启动所有服务"
  echo -e "  ${GREEN}--no-admin${NC}:         不初始化管理员和教师账户"
  echo -e "  ${GREEN}--no-knowledge${NC}:     不初始化知识点数据"
  echo -e "  ${GREEN}--force${NC}:            强制重建数据库表（删除所有数据）"
  echo -e "  ${GREEN}-h, --help${NC}:         显示此帮助信息"
  echo ""
  echo -e "${YELLOW}功能说明:${NC}"
  echo -e "  ${GREEN}完整重置${NC}: 包含App端数据、Admin端数据、知识点数据"
  echo -e "  ${GREEN}App端数据${NC}: 学科、单元、课程、练习题、单元内容"
  echo -e "  ${GREEN}Admin端数据${NC}: 管理员和教师账户"
  echo -e "  ${GREEN}知识点数据${NC}: 知识点及与练习题的关联"
  echo ""
  echo -e "${YELLOW}示例:${NC}"
  echo -e "  ./reset-data.sh -s --no-admin   # 重置App端数据和知识点，不包含管理员，并启动所有服务"
  echo -e "  ./reset-data.sh -r --force      # 强制重建数据库并启动后端服务"
  echo ""
  exit 0
fi

# 显示重置模式
echo -e "${GREEN}🔄 Learn 项目数据重置${NC}"
echo -e "${YELLOW}配置:${NC}"
echo -e "  - 包含管理员数据: $([ "$NO_ADMIN" = false ] && echo "是" || echo "否")"
echo -e "  - 包含知识点数据: $([ "$NO_KNOWLEDGE" = false ] && echo "是" || echo "否")"
echo -e "  - 强制重建数据库: $([ "$FORCE_RESET" = true ] && echo "是" || echo "否")"
echo -e "  - 启动模式: $([ "$START_ALL" = true ] && echo "启动所有服务" || ([ "$RUN_SERVER" = true ] && echo "仅启动后端" || echo "不启动服务"))"
echo ""

# 检查learn-server目录是否存在
if [ ! -d "$SCRIPT_DIR/learn-server" ]; then
  echo -e "${RED}错误: learn-server 目录不存在${NC}"
  echo -e "${YELLOW}请确保在项目根目录运行此脚本${NC}"
  exit 1
fi

# 停止现有服务
echo -e "${YELLOW}⏹️  停止现有服务...${NC}"

# 停止各种进程
PROCESS_TYPES=("nodemon" "vite" "expo")
for PROCESS in "${PROCESS_TYPES[@]}"; do
  PIDS=$(pgrep -f "$PROCESS" 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}终止${PROCESS}进程: $PIDS${NC}"
    echo "$PIDS" | xargs kill -15 2>/dev/null || echo "$PIDS" | xargs kill -9 2>/dev/null
  fi
done

# 查找并终止可能的服务器进程
PORTS=(3000 5173 5174 8082)
for PORT in "${PORTS[@]}"; do
  PORT_PIDS=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PORT_PIDS" ]; then
    echo -e "${YELLOW}终止占用${PORT}端口的进程: $PORT_PIDS${NC}"
    kill -9 $PORT_PIDS 2>/dev/null
  fi
done

echo -e "${GREEN}服务已停止${NC}"

# 转到learn-server目录
cd "$SCRIPT_DIR/learn-server"

# 清理数据库文件（如果指定了force参数）
if [ "$FORCE_RESET" = true ]; then
  echo -e "${YELLOW}清理数据库文件...${NC}"
  if [ -f "src/database/learn.sqlite" ]; then
    rm -f src/database/learn.sqlite
    echo -e "${GREEN}数据库文件已删除${NC}"
  else
    echo -e "${BLUE}数据库文件不存在，无需删除${NC}"
  fi
fi

# 确保database目录存在
mkdir -p src/database

# 构建初始化命令参数
INIT_ARGS=""
if [ "$NO_ADMIN" = true ]; then
  INIT_ARGS="$INIT_ARGS --no-admin"
fi
if [ "$NO_KNOWLEDGE" = true ]; then
  INIT_ARGS="$INIT_ARGS --no-knowledge"
fi
if [ "$FORCE_RESET" = true ]; then
  INIT_ARGS="$INIT_ARGS --force"
fi

# 运行数据初始化
echo -e "${YELLOW}🚀 运行数据初始化...${NC}"
node src/database/init.js $INIT_ARGS

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 数据重置完成！${NC}"
  
  # 根据参数决定启动模式
  if [ "$START_ALL" = true ]; then
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${BLUE}自动启动所有服务...${NC}"
    echo -e "${YELLOW}提示: 按 Ctrl+C 可以停止所有服务${NC}"
    echo -e "${GREEN}==============================================${NC}"
    
    # 返回项目根目录并启动所有服务
    cd "$SCRIPT_DIR"
    exec ./start-all.sh
    
  elif [ "$RUN_SERVER" = true ]; then
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${BLUE}自动启动后端服务...${NC}"
    echo -e "${YELLOW}提示: 按 Ctrl+C 可以停止服务器${NC}"
    echo -e "${GREEN}==============================================${NC}"
    
    # 启动后端服务器
    npm run dev
    
  else
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${GREEN}🎉 数据重置成功！${NC}"
    echo -e "${YELLOW}💡 提示:${NC}"
    echo -e "  - 使用 ${CYAN}'npm run dev'${NC} 启动后端服务器"
    echo -e "  - 使用 ${CYAN}'./start-all.sh'${NC} 启动所有服务"
    echo -e "  - 使用 ${CYAN}'./reset-data.sh -s'${NC} 重置并启动所有服务"
    echo -e "  - 使用 ${CYAN}'./reset-data.sh -r'${NC} 重置并启动后端服务"
    echo -e "${GREEN}==============================================${NC}"
  fi
else
  echo -e "${RED}❌ 数据重置失败！${NC}"
  exit 1
fi 