import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Vite默认端口
    proxy: {
      // 将/api开头的请求代理到目标服务器
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        // 不再重写路径，保留/api前缀
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
})
