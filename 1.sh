PORT_PIDS=$(lsof -t -i:3000 2>/dev/null)
if [ -n "$PORT_PIDS" ]; then
  echo -e "${YELLOW}发现占用3000端口的进程: $PORT_PIDS，正在终止...${NC}"
  kill -9 $PORT_PIDS 2>/dev/null
fi