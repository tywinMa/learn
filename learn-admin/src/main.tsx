import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import App from './App.tsx'
import { UserProvider } from './contexts/UserContext'
import './index.css'

// 配置 dayjs 使用中文
dayjs.locale('zh-cn')

// API调试工具
const enableApiDebug = () => {
  console.log('%c API调试已启用 ', 'background: #4CAF50; color: white; padding: 2px 5px;');
  
  // 监听所有XHR请求
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    console.log(`%c API请求 ${method.toUpperCase()} ${url}`, 'color: #2196F3');
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  return "API调试已启用，所有请求将显示在控制台";
};

// 在开发环境下添加调试工具到window对象
if (process.env.NODE_ENV !== 'production') {
  (window as any).enableApiDebug = enableApiDebug;
  console.log('在控制台中使用 enableApiDebug() 启用API请求跟踪');
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <UserProvider>
          <App />
        </UserProvider>
      </BrowserRouter>
    </ConfigProvider>
);
