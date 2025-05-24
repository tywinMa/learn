module.exports = {
  apps: [{
    name: 'learn-server',
    script: 'src/index.js',
    instances: 1,
    exec_mode: 'fork',
    
    // 环境变量
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 监听文件变化 (仅开发环境)
    watch: false,
    ignore_watch: ['node_modules', 'logs', '*.log'],
    
    // 自动重启配置
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // 日志配置
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 内存限制
    max_memory_restart: '1G',
    
    // 其他配置
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000,
    
    // 合并日志
    merge_logs: true,
    
    // 时间格式
    time: true
  }]
};