# Learn 项目脚本使用说明

本项目提供了两个便捷的脚本来管理开发环境：

## 📋 脚本概览

- **`start-all.sh`** - 同时启动所有服务（App端、后台管理、后端服务）
- **`reset-data.sh`** - 重置数据库并初始化数据

## 🚀 启动脚本 (start-all.sh)

### 基本用法

```bash
# 启动所有服务
./start-all.sh

# 查看帮助信息
./start-all.sh --help
```

### 功能特性

- ✅ 自动清理残留进程和端口占用
- ✅ 按顺序启动三个服务：后端 → 后台管理 → App端
- ✅ 实时监控服务状态
- ✅ 统一日志管理
- ✅ 优雅的服务关闭（Ctrl+C）

### 服务地址

启动成功后，可以通过以下地址访问：

- **后端API**: http://localhost:3000
- **后台管理**: http://localhost:5174 (或 5173)
- **App端**: http://localhost:8082

### 日志文件

所有服务的日志都保存在 `logs/` 目录下：

- `logs/server.log` - 后端服务日志
- `logs/admin.log` - 后台管理日志
- `logs/app.log` - App端日志

```bash
# 查看实时日志
tail -f logs/*.log

# 查看特定服务日志
tail -f logs/server.log
```

## 🔄 数据重置脚本 (reset-data.sh)

### 基本用法

```bash
# 仅重置数据（不启动服务）
./reset-data.sh

# 重置数据并启动后端服务
./reset-data.sh -r

# 重置数据并启动所有服务
./reset-data.sh -s

# 查看帮助信息
./reset-data.sh --help
```

### 参数说明

| 参数 | 完整写法 | 说明 |
|------|----------|------|
| `-r` | `--run` | 重置完成后启动后端服务 |
| `-s` | `--start-all` | 重置完成后启动所有服务 |
| `--no-admin` | - | 不初始化管理员和教师账户 |
| `--no-knowledge` | - | 不初始化知识点数据 |
| `-f` | `--force` | 强制重建数据库表结构 |
| `-h` | `--help` | 显示帮助信息 |

### 使用示例

```bash
# 完整重置并启动所有服务
./reset-data.sh -s

# 重置但不包含管理员数据，并启动后端
./reset-data.sh -r --no-admin

# 强制重建数据库并启动所有服务
./reset-data.sh -s --force

# 仅重置App端数据和知识点（不包含管理员）
./reset-data.sh --no-admin
```

### 数据类型说明

- **App端数据**: 学科、单元、课程、练习题、单元内容
- **Admin端数据**: 管理员和教师账户
- **知识点数据**: 知识点及与练习题的关联

## 🛠️ 开发工作流

### 日常开发

```bash
# 1. 启动所有服务进行开发
./start-all.sh

# 2. 开发完成后按 Ctrl+C 停止所有服务
```

### 数据测试

```bash
# 1. 重置数据并启动所有服务
./reset-data.sh -s

# 2. 进行测试...

# 3. 如需重新测试，重复步骤1
```

### 生产部署前

```bash
# 1. 强制重建数据库确保干净环境
./reset-data.sh --force

# 2. 启动服务验证
./start-all.sh
```

## ⚠️ 注意事项

1. **依赖安装**: 确保所有项目都已安装依赖
   ```bash
   # 在各个项目目录下运行
   npm install
   ```

2. **端口占用**: 脚本会自动清理端口占用，但如果遇到问题可以手动检查：
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :5174
   lsof -i :8082
   ```

3. **权限问题**: 确保脚本有执行权限
   ```bash
   chmod +x start-all.sh reset-data.sh
   ```

4. **日志查看**: 如果服务启动失败，查看对应的日志文件排查问题

## 🔧 故障排除

### 服务启动失败

1. 检查日志文件：`logs/server.log`, `logs/admin.log`, `logs/app.log`
2. 确认依赖已安装：在各项目目录运行 `npm install`
3. 检查端口是否被占用：`lsof -i :端口号`
4. 尝试强制重置：`./reset-data.sh --force`

### 数据库问题

1. 强制重建数据库：`./reset-data.sh --force`
2. 检查数据库文件权限：`ls -la learn-server/src/database/`
3. 手动删除数据库文件后重新初始化

### 进程清理

如果脚本无法正常清理进程，可以手动清理：

```bash
# 清理所有相关进程
pkill -f "nodemon"
pkill -f "vite"
pkill -f "expo"

# 清理端口占用
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:5174)
kill -9 $(lsof -t -i:8082)
```

## 📝 更新日志

- **v1.0.0**: 初始版本，支持基本的启动和重置功能
- 支持多种启动模式和数据重置选项
- 完善的错误处理和日志管理
- 优雅的进程管理和清理机制 