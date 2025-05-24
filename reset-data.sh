#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 解析命令行参数
HELP_MODE=false
RUN_SERVER=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -r|--run)
      RUN_SERVER=true
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
  echo -e "${BLUE}数据重置脚本使用说明${NC}"
  echo -e "${YELLOW}用法:${NC}"
  echo -e "  ./reset-data.sh           # 完整重置数据 (不启动服务器)"
  echo -e "  ./reset-data.sh -r        # 完整重置数据并启动服务器"
  echo -e "  ./reset-data.sh --run     # 完整重置数据并启动服务器 (完整写法)"
  echo -e "  ./reset-data.sh --help    # 显示此帮助信息"
  echo ""
  echo -e "${YELLOW}参数说明:${NC}"
  echo -e "  ${GREEN}-r, --run${NC}:   重置完成后自动启动开发服务器"
  echo -e "  ${GREEN}-h, --help${NC}:  显示此帮助信息"
  echo ""
  echo -e "${YELLOW}功能说明:${NC}"
  echo -e "  ${GREEN}数据重置包含${NC}: 清理数据库文件 + 完整数据初始化 + 知识点初始化 + 数据库模型同步"
  echo -e "  ${GREEN}适用场景${NC}: 环境准备、功能测试、问题排查、演示准备"
  echo ""
  exit 0
fi

# 显示重置模式
echo -e "${GREEN}🔄 完整重置数据环境${NC}"
echo -e "${YELLOW}包含数据库清理、完整数据初始化、知识点初始化等${NC}"
echo ""

# 转到服务器目录
cd server

# 停止现有服务
echo -e "${YELLOW}⏹️  停止现有服务...${NC}"
pkill -f "node.*server" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "expo start" 2>/dev/null

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

# 清理数据库文件
echo -e "${YELLOW}清理数据库文件...${NC}"

# 删除数据库文件
if [ -f "src/database/learn.sqlite" ]; then
  rm -f src/database/learn.sqlite
  echo -e "${GREEN}数据库文件已删除${NC}"
else
  echo -e "${BLUE}数据库文件不存在，无需删除${NC}"
fi

# 确保database目录存在
mkdir -p src/database
echo -e "${GREEN}数据库清理完成${NC}"

# 确认数据库连接
echo -e "${YELLOW}检查数据库连接...${NC}"
node -e "require('./src/config/database').testConnection().then(() => console.log('数据库连接正常')).catch(err => { console.error('数据库连接错误:', err); process.exit(1); })"

if [ $? -ne 0 ]; then
  echo -e "${RED}数据库连接失败，无法重置数据！${NC}"
  exit 1
fi

# 数据初始化
echo -e "${YELLOW}运行数据初始化脚本...${NC}"

# 数据库模型同步（确保数据库结构与模型定义一致）
echo -e "${BLUE}同步数据库模型...${NC}"
node -e "require('./src/models').syncDatabase().then(() => console.log('数据库模型同步完成')).catch(err => { console.error('同步失败:', err); process.exit(1); })"

if [ $? -ne 0 ]; then
  echo -e "${RED}数据库模型同步失败！${NC}"
  exit 1
else
  echo -e "${GREEN}数据库模型同步完成！${NC}"
fi

# 运行服务器端的初始化脚本
echo -e "${YELLOW}运行数据初始化脚本...${NC}"
node src/utils/initData.js

if [ $? -eq 0 ]; then
  echo -e "${GREEN}数据初始化完成！${NC}"
  
  # 初始化知识点数据
  echo -e "${BLUE}初始化知识点数据...${NC}"
  
  node init-knowledge-points.js
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}知识点数据初始化完成！${NC}"
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${GREEN}数据重置完成！包含以下功能：${NC}"
    echo -e "${GREEN}✓ 数据库模型同步${NC}"
    echo -e "${GREEN}✓ 学科和单元数据${NC}"
    echo -e "${GREEN}✓ 练习题数据${NC}"
    echo -e "${GREEN}✓ 知识点数据和关联关系${NC}"
    echo -e "${GREEN}==============================================${NC}"
  else
    echo -e "${YELLOW}知识点数据初始化失败，但基础数据已重置成功${NC}"
  fi
  
  # 返回项目根目录
  cd ..
  
  # 根据参数决定是否启动服务器
  if [ "$RUN_SERVER" = true ]; then
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${BLUE}自动启动开发服务器...${NC}"
    echo -e "${YELLOW}提示: 按 Ctrl+C 可以停止服务器${NC}"
    echo -e "${GREEN}==============================================${NC}"
    
    # 自动启动开发服务器
    ./start-dev.sh
  else
    # 仅重置数据，不启动服务器
    echo -e "${GREEN}==============================================${NC}"
    echo -e "${GREEN}🎉 数据重置完成！${NC}"
    echo -e "${YELLOW}💡 提示: 使用 './start-dev.sh' 启动开发服务器${NC}"
    echo -e "${YELLOW}💡 或者使用 './reset-data.sh -r' 重置并启动服务器${NC}"
    echo -e "${GREEN}==============================================${NC}"
  fi
else
  echo -e "${RED}数据重置失败！${NC}"
  exit 1
fi 