#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# 显示菜单
show_menu() {
  echo -e "${BLUE}================================${NC}"
  echo -e "${GREEN}Learn Server 管理工具${NC}"
  echo -e "${BLUE}================================${NC}"
  echo -e "${YELLOW}请选择操作：${NC}"
  echo ""
  echo -e "${GREEN}[1]${NC} 启动开发服务器"
  echo -e "${GREEN}[2]${NC} 重置数据（完整）"
  echo -e "${GREEN}[3]${NC} 重置数据并启动服务器"
  echo -e "${GREEN}[4]${NC} 强制重建数据库"
  echo -e "${GREEN}[5]${NC} 仅初始化App端数据"
  echo -e "${GREEN}[6]${NC} 仅初始化Admin端数据"
  echo -e "${GREEN}[7]${NC} 仅初始化知识点数据"
  echo -e "${GREEN}[8]${NC} 查看数据库状态"
  echo -e "${GREEN}[9]${NC} 停止所有服务"
  echo -e "${GREEN}[0]${NC} 退出"
  echo ""
}

# 启动开发服务器
start_dev_server() {
  echo -e "${BLUE}启动开发服务器...${NC}"
  cd "$PROJECT_ROOT"
  npm run dev
}

# 重置数据
reset_data() {
  echo -e "${BLUE}重置数据...${NC}"
  cd "$PROJECT_ROOT"
  ./scripts/reset-data.sh
}

# 重置数据并启动
reset_and_start() {
  echo -e "${BLUE}重置数据并启动服务器...${NC}"
  cd "$PROJECT_ROOT"
  ./scripts/reset-data.sh -r
}

# 强制重建数据库
force_rebuild() {
  echo -e "${YELLOW}⚠️  警告：这将删除所有数据！${NC}"
  read -p "确定要继续吗？(y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT"
    ./scripts/reset-data.sh --force
  else
    echo -e "${GREEN}操作已取消${NC}"
  fi
}

# 仅初始化App端数据
init_app_data() {
  echo -e "${BLUE}仅初始化App端数据...${NC}"
  cd "$PROJECT_ROOT"
  node src/database/init.js --no-admin
}

# 仅初始化Admin端数据
init_admin_data() {
  echo -e "${BLUE}仅初始化Admin端数据...${NC}"
  cd "$PROJECT_ROOT"
  node src/utils/seedAdminData.js
}

# 仅初始化知识点数据
init_knowledge_data() {
  echo -e "${BLUE}仅初始化知识点数据...${NC}"
  cd "$PROJECT_ROOT"
  node src/utils/initKnowledgePoints.js
}

# 查看数据库状态
check_db_status() {
  echo -e "${BLUE}检查数据库状态...${NC}"
  cd "$PROJECT_ROOT"
  
  if [ -f "src/database/learn.sqlite" ]; then
    echo -e "${GREEN}数据库文件存在${NC}"
    SIZE=$(du -h src/database/learn.sqlite | cut -f1)
    echo -e "文件大小: ${SIZE}"
    
    # 检查表数量
    echo -e "\n${YELLOW}数据库表信息：${NC}"
    node -e "
      const { sequelize } = require('./src/config/database');
      const { User, Subject, Course, Exercise, KnowledgePoint } = require('./src/models');
      
      (async () => {
        try {
          const userCount = await User.count();
          const subjectCount = await Subject.count();
          const courseCount = await Course.count();
          const exerciseCount = await Exercise.count();
          const knowledgeCount = await KnowledgePoint.count();
          
          console.log('- 用户数量:', userCount);
          console.log('- 学科数量:', subjectCount);
          console.log('- 课程数量:', courseCount);
          console.log('- 练习题数量:', exerciseCount);
          console.log('- 知识点数量:', knowledgeCount);
        } catch (error) {
          console.error('查询失败:', error.message);
        }
        process.exit();
      })();
    "
  else
    echo -e "${RED}数据库文件不存在${NC}"
  fi
}

# 停止所有服务
stop_all_services() {
  echo -e "${YELLOW}停止所有服务...${NC}"
  
  # 停止Node进程
  pkill -f "node.*learn-server" 2>/dev/null
  pkill -f "nodemon.*learn-server" 2>/dev/null
  
  # 停止端口占用
  PORT_PIDS=$(lsof -t -i:3000 2>/dev/null)
  if [ -n "$PORT_PIDS" ]; then
    kill -9 $PORT_PIDS 2>/dev/null
  fi
  
  echo -e "${GREEN}所有服务已停止${NC}"
}

# 主循环
while true; do
  show_menu
  read -p "请输入选项 [0-9]: " choice
  
  case $choice in
    1) start_dev_server ;;
    2) reset_data ;;
    3) reset_and_start ;;
    4) force_rebuild ;;
    5) init_app_data ;;
    6) init_admin_data ;;
    7) init_knowledge_data ;;
    8) check_db_status ;;
    9) stop_all_services ;;
    0) echo -e "${GREEN}再见！${NC}"; exit 0 ;;
    *) echo -e "${RED}无效选项，请重试${NC}" ;;
  esac
  
  echo ""
  read -p "按回车键继续..."
done 