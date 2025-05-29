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
FORCE_RESET=true
START_ALL=false
START_APP=false
START_ADMIN=false

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
    -a|--start-app)
      START_APP=true
      shift
      ;;
    -b|--start-admin)
      START_ADMIN=true
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
  echo -e "  ./reset-data.sh -a              # 完整重置数据并启动服务端+App端"
  echo -e "  ./reset-data.sh -b              # 完整重置数据并启动服务端+后台管理"
  echo -e "  ./reset-data.sh --run           # 完整重置数据并启动后端服务 (完整写法)"
  echo -e "  ./reset-data.sh --start-all     # 完整重置数据并启动所有服务 (完整写法)"
  echo -e "  ./reset-data.sh --start-app     # 完整重置数据并启动服务端+App端 (完整写法)"
  echo -e "  ./reset-data.sh --start-admin   # 完整重置数据并启动服务端+后台管理 (完整写法)"
  echo -e "  ./reset-data.sh --no-admin      # 重置数据但不包含管理员数据"
  echo -e "  ./reset-data.sh --no-knowledge  # 重置数据但不包含知识点数据"
  echo -e "  ./reset-data.sh --force         # 强制重建数据库表结构"
  echo -e "  ./reset-data.sh --help          # 显示此帮助信息"
  echo ""
  echo -e "${YELLOW}参数说明:${NC}"
  echo -e "  ${GREEN}-r, --run${NC}:          重置完成后自动启动后端服务"
  echo -e "  ${GREEN}-s, --start-all${NC}:    重置完成后自动启动所有服务"
  echo -e "  ${GREEN}-a, --start-app${NC}:    重置完成后自动启动服务端+App端"
  echo -e "  ${GREEN}-b, --start-admin${NC}:  重置完成后自动启动服务端+后台管理"
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
  echo -e "  ./reset-data.sh -a --force      # 强制重建数据库并启动服务端+App端"
  echo -e "  ./reset-data.sh -b --no-knowledge # 重置基础数据，不包含知识点，并启动服务端+后台管理"
  echo ""
  exit 0
fi

# 显示重置模式
echo -e "${GREEN}🔄 Learn 项目数据重置${NC}"
echo -e "${YELLOW}配置:${NC}"
echo -e "  - 包含管理员数据: $([ "$NO_ADMIN" = false ] && echo "是" || echo "否")"
echo -e "  - 包含知识点数据: $([ "$NO_KNOWLEDGE" = false ] && echo "是" || echo "否")"
echo -e "  - 强制重建数据库: $([ "$FORCE_RESET" = true ] && echo "是" || echo "否")"
echo -e "  - 启动模式: $([ "$START_ALL" = true ] && echo "启动所有服务" || ([ "$START_APP" = true ] && echo "服务端+App端" || ([ "$START_ADMIN" = true ] && echo "服务端+后台管理" || ([ "$RUN_SERVER" = true ] && echo "仅启动后端" || echo "不启动服务"))))"
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

# 创建日志目录（确保日志能正常写入）
mkdir -p "$SCRIPT_DIR/logs"

# 清理数据库文件（如果指定了force参数）
if [ "$FORCE_RESET" = true ]; then
  echo -e "${YELLOW}清理数据库文件...${NC}"
  if [ -f "/Users/maxin/maxin/learn/learn-server/src/database/learn.sqlite" ]; then
    rm -rf /Users/maxin/maxin/learn/logs
    rm -rf /Users/maxin/maxin/learn/learn-server/src/database/learn.sqlite
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
node src/database/completeInit.js $INIT_ARGS

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
    
  elif [ "$START_APP" = true ]; then
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${BLUE}自动启动服务端+App端 (并发模式)...${NC}"
    echo -e "${YELLOW}提示: 按 Ctrl+C 可以停止服务端+App端${NC}"
    echo -e "${GREEN}==============================================${NC}"
    
    # 定义清理函数
    cleanup_app() {
        echo -e "\n${YELLOW}🛑 正在停止服务端+App端...${NC}"
        
        # 终止所有后台任务
        jobs -p | xargs -r kill 2>/dev/null
        
        # 终止指定端口的进程
        PORTS=(3000 8082)
        for PORT in "${PORTS[@]}"; do
            PORT_PIDS=$(lsof -t -i:$PORT 2>/dev/null)
            if [ -n "$PORT_PIDS" ]; then
                echo -e "${YELLOW}终止占用${PORT}端口的进程${NC}"
                kill -9 $PORT_PIDS 2>/dev/null
            fi
        done
        
        echo -e "${GREEN}✅ 服务端+App端已停止${NC}"
        exit 0
    }
    
    # 设置信号处理
    trap cleanup_app SIGINT SIGTERM
    
    # 验证目录结构
    cd "$SCRIPT_DIR"
    if [ ! -d "learn" ]; then
        echo -e "${RED}❌ 错误: learn (App) 目录不存在${NC}"
        exit 1
    fi
    
    # 检查App依赖
    if [ ! -d "learn/node_modules" ]; then
        echo -e "${YELLOW}⏳ 安装App依赖...${NC}"
        cd learn
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ App依赖安装失败${NC}"
            exit 1
        fi
        cd "$SCRIPT_DIR"
    fi
    
    # 🚀 并发启动服务
    echo -e "${BLUE}🚀 并发启动服务端+App端...${NC}"
    
    # 启动后端服务
    echo -e "${BLUE}🔧 启动后端服务...${NC}"
    cd learn-server
    npm run dev > ../logs/server-app.log 2>&1 &
    SERVER_PID=$!
    
    # 启动App端
    echo -e "${BLUE}📱 启动App端...${NC}"
    cd "$SCRIPT_DIR/learn"
    npm run web > ../logs/app.log 2>&1 &
    APP_PID=$!
    
    echo -e "${YELLOW}⏳ 等待服务启动完成...${NC}"
    
    # 健康检查函数
    check_service() {
        local service_name="$1"
        local port="$2"
        local max_attempts="$3"
        
        for i in $(seq 1 $max_attempts); do
            if lsof -i:$port >/dev/null 2>&1; then
                echo -e "${GREEN}✅ $service_name 启动成功: http://localhost:$port${NC}"
                return 0
            fi
            sleep 1
        done
        
        echo -e "${RED}❌ $service_name 启动失败${NC}"
        return 1
    }
    
    # 并发健康检查
    check_service "后端服务" 3000 15 &
    HEALTH_CHECK_SERVER=$!
    
    check_service "App端" 8082 20 &
    HEALTH_CHECK_APP=$!
    
    # 等待健康检查结果
    wait $HEALTH_CHECK_SERVER
    SERVER_OK=$?
    
    wait $HEALTH_CHECK_APP
    APP_OK=$?
    
    # 检查启动结果
    if [ $SERVER_OK -ne 0 ] || [ $APP_OK -ne 0 ]; then
        echo -e "${RED}❌ 部分服务启动失败，请检查日志${NC}"
        cleanup_app
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}🎉 服务端+App端启动完成！${NC}"
    echo -e "${CYAN}服务地址:${NC}"
    echo -e "  📱 Learn App: ${YELLOW}http://localhost:8082${NC}"
    echo -e "  🔧 后端API: ${YELLOW}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}💡 使用说明:${NC}"
    echo -e "  - App端会自动连接到后端API"
    echo -e "  - 可以在App端进行学习和练习"
    echo -e "  - 按 ${RED}Ctrl+C${NC} 停止所有服务"
    echo ""
    
    # 等待所有后台进程
    wait
    
  elif [ "$START_ADMIN" = true ]; then
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${BLUE}自动启动服务端+后台管理 (并发模式)...${NC}"
    echo -e "${YELLOW}提示: 按 Ctrl+C 可以停止服务端+后台管理${NC}"
    echo -e "${GREEN}==============================================${NC}"
    
    # 定义清理函数
    cleanup_admin() {
        echo -e "\n${YELLOW}🛑 正在停止服务端+后台管理...${NC}"
        
        # 终止所有后台任务
        jobs -p | xargs -r kill 2>/dev/null
        
        # 终止指定端口的进程
        PORTS=(3000 5173 5174)
        for PORT in "${PORTS[@]}"; do
            PORT_PIDS=$(lsof -t -i:$PORT 2>/dev/null)
            if [ -n "$PORT_PIDS" ]; then
                echo -e "${YELLOW}终止占用${PORT}端口的进程${NC}"
                kill -9 $PORT_PIDS 2>/dev/null
            fi
        done
        
        echo -e "${GREEN}✅ 服务端+后台管理已停止${NC}"
        exit 0
    }
    
    # 设置信号处理
    trap cleanup_admin SIGINT SIGTERM
    
    # 验证目录结构
    cd "$SCRIPT_DIR"
    if [ ! -d "learn-admin" ]; then
        echo -e "${RED}❌ 错误: learn-admin 目录不存在${NC}"
        exit 1
    fi
    
    # 检查后台管理依赖
    if [ ! -d "learn-admin/node_modules" ]; then
        echo -e "${YELLOW}⏳ 安装后台管理依赖...${NC}"
        cd learn-admin
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 后台管理依赖安装失败${NC}"
            exit 1
        fi
        cd "$SCRIPT_DIR"
    fi
    
    # 🚀 并发启动服务
    echo -e "${BLUE}🚀 并发启动服务端+后台管理...${NC}"
    
    # 启动后端服务
    echo -e "${BLUE}🔧 启动后端服务...${NC}"
    cd learn-server
    npm run dev > ../logs/server-admin.log 2>&1 &
    SERVER_PID=$!
    
    # 启动后台管理系统
    echo -e "${BLUE}👨‍💼 启动后台管理系统...${NC}"
    cd "$SCRIPT_DIR/learn-admin"
    npm run dev > ../logs/admin.log 2>&1 &
    ADMIN_PID=$!
    
    echo -e "${YELLOW}⏳ 等待服务启动完成...${NC}"
    
    # 健康检查函数
    check_service() {
        local service_name="$1"
        local port="$2"
        local max_attempts="$3"
        
        for i in $(seq 1 $max_attempts); do
            if lsof -i:$port >/dev/null 2>&1; then
                echo -e "${GREEN}✅ $service_name 启动成功: http://localhost:$port${NC}"
                return 0
            fi
            sleep 1
        done
        
        echo -e "${RED}❌ $service_name 启动失败${NC}"
        return 1
    }
    
    # 并发健康检查
    check_service "后端服务" 3000 15 &
    HEALTH_CHECK_SERVER=$!
    
    # 检查两个可能的端口
    (
      check_service "后台管理系统" 5174 20 || check_service "后台管理系统" 5173 10
    ) &
    HEALTH_CHECK_ADMIN=$!
    
    # 等待健康检查结果
    wait $HEALTH_CHECK_SERVER
    SERVER_OK=$?
    
    wait $HEALTH_CHECK_ADMIN
    ADMIN_OK=$?
    
    # 检查启动结果
    if [ $SERVER_OK -ne 0 ] || [ $ADMIN_OK -ne 0 ]; then
        echo -e "${RED}❌ 部分服务启动失败，请检查日志${NC}"
        cleanup_admin
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}🎉 服务端+后台管理启动完成！${NC}"
    echo -e "${CYAN}服务地址:${NC}"
    echo -e "  👨‍💼 后台管理: ${YELLOW}http://localhost:5173 或 http://localhost:5174${NC}"
    echo -e "  🔧 后端API: ${YELLOW}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}💡 使用说明:${NC}"
    echo -e "  - 可以在后台管理系统中管理课程、习题、学生等数据"
    echo -e "  - 默认管理员账号: admin / admin123"
    echo -e "  - 按 ${RED}Ctrl+C${NC} 停止所有服务"
    echo ""
    
    # 等待所有后台进程
    wait
    
  else
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${GREEN}🎉 数据重置成功！${NC}"
    echo -e "${YELLOW}💡 提示:${NC}"
    echo -e "  - 使用 ${CYAN}'npm run dev'${NC} 启动后端服务器"
    echo -e "  - 使用 ${CYAN}'./start-all.sh'${NC} 启动所有服务"
    echo -e "  - 使用 ${CYAN}'./reset-data.sh -s'${NC} 重置并启动所有服务"
    echo -e "  - 使用 ${CYAN}'./reset-data.sh -r'${NC} 重置并启动后端服务"
    echo -e "  - 使用 ${CYAN}'./reset-data.sh -a'${NC} 重置并启动服务端+App端"
    echo -e "  - 使用 ${CYAN}'./reset-data.sh -b'${NC} 重置并启动服务端+后台管理"
    echo -e "${GREEN}==============================================${NC}"
  fi
else
  echo -e "${RED}❌ 数据重置失败！${NC}"
  exit 1
fi 