#!/bin/bash

# 检查并终止已有的服务器进程
echo "检查并终止已有的服务器进程..."
pkill -f "node.*server/node_modules/.bin/nodemon" || true
pkill -f "node.*server/src/index.js" || true

# 等待进程完全终止
sleep 1

# 启动后端服务器
echo "启动后端服务器..."
cd server && npm install && npm run dev &
SERVER_PID=$!

# 等待几秒钟让服务器启动
sleep 3

# 启动前端应用
echo "启动前端应用..."
npm start

# 当前端应用关闭时，也关闭后端服务器
kill $SERVER_PID || true
