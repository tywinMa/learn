import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '../services/auth';
import type { LoginRequest, UserInfo } from '../services/auth';
import { useUserStore } from '../store/userStore';

const { Title, Text, Paragraph } = Typography;

// 声明登录结果类型
interface LoginResult {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: UserInfo;
  };
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useUserStore(state => state.setUser);

  // 如果已登录，重定向到首页
  React.useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    
    try {
      const result = await login(values.username, values.password, setUser) as LoginResult;
      if (result.success) {
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        // 显示后端返回的错误信息
        message.error(result.message || '登录失败');
      }
    } catch (err) {
      console.error('登录出错:', err);
      // 直接使用错误对象的消息，这里已经是我们提取后的错误信息
      message.error(err instanceof Error ? err.message : '登录失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full"></div>
        <div className="absolute top-20 right-20 w-60 h-60 bg-white opacity-5 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white opacity-10 rounded-full"></div>
      </div>
      
      <div className="container mx-auto px-4 z-10">
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-12 lg:gap-20">
          {/* 左侧品牌区域 */}
          <div className="md:w-1/2 text-white text-center md:text-left">
            <div className="mb-6 inline-block">
              <div className="flex items-center justify-center md:justify-start">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mr-3">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <span className="text-3xl font-bold tracking-tight">EduSystem</span>
              </div>
            </div>
            
            <Title level={1} style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold', marginBottom: '1.5rem', lineHeight: 1.2 }}>
              让教学管理<br/>更加高效便捷
            </Title>
            
            <Paragraph style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto', marginBottom: '2rem' }}>
              我们的智能教学平台提供全面的课程管理和教学工具，帮助教师和学生实现教学资源共享、在线学习和学业评估。
            </Paragraph>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
              <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-5 py-3 backdrop-blur-sm">
                <div className="w-10 h-10 flex items-center justify-center bg-white bg-opacity-30 rounded-full mr-3">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                    <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-8.753-4.274L12 13.988l8.753-4.262"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium">50+ 课程</div>
                  <div className="text-sm text-white text-opacity-80">多学科全覆盖</div>
                </div>
              </div>
              
              <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-5 py-3 backdrop-blur-sm">
                <div className="w-10 h-10 flex items-center justify-center bg-white bg-opacity-30 rounded-full mr-3">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium">千万用户</div>
                  <div className="text-sm text-white text-opacity-80">信赖我们的平台</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧登录框 */}
          <div className="w-full md:w-5/12 lg:w-4/12">
            <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-sm transform transition-all duration-300 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)]" style={{
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div className="text-center mb-6">
                <Title level={3} className="text-gray-800 font-bold">
                  欢迎登录
                </Title>
                <p className="text-gray-500">请输入您的账号和密码</p>
              </div>
              
              <Form
                name="login"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                size="large"
                layout="vertical"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />} 
                    placeholder="用户名" 
                    style={{ height: '48px', borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '请输入密码' }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined className="text-gray-400" />} 
                    placeholder="密码" 
                    style={{ height: '48px', borderRadius: '8px' }}
                  />
                </Form.Item>

                <Form.Item>
                  <div className="flex justify-between items-center mb-2">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>记住我</Checkbox>
                    </Form.Item>
                    <a className="text-blue-500 hover:text-blue-700" href="#">
                      忘记密码?
                    </a>
                  </div>
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    block 
                    loading={loading}
                    style={{ 
                      height: '48px',
                      fontWeight: '500', 
                      fontSize: '16px',
                      borderRadius: '8px',
                      background: 'linear-gradient(to right, #1890ff, #0050b3)'
                    }}
                  >
                    登 录
                  </Button>
                </Form.Item>
                
                <div className="mt-4 text-center text-gray-500 text-sm">
                  <div className="space-y-2">
                    <Text type="secondary">演示账号</Text>
                    <div className="py-1 px-3 bg-gray-50 rounded-md inline-block">
                      <Text code>admin / teacher / student</Text>
                    </div>
                    <div className="py-1 px-3 bg-gray-50 rounded-md inline-block">
                      <Text code>密码: 123456</Text>
                    </div>
                  </div>
                </div>
              </Form>
            </div>
            
            <div className="text-center mt-6 text-white">
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                © 2023 教学管理系统 版权所有
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 