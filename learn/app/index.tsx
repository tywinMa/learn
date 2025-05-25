import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  useEffect(() => {
    console.log("根索引页面加载，重定向到欢迎界面");
  }, []);
  
  // 重定向到欢迎界面
  return <Redirect href="/welcome" />;
} 