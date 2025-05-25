import React from 'react';
import { Tabs, Form, Input, Button, Switch, Select, Card, message, Space } from 'antd';
import {
  GlobalOutlined,
  MailOutlined,
  NotificationOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import type { FormInstance } from 'antd/es/form';

const Settings: React.FC = () => {
  const [generalForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [securityForm] = Form.useForm();

  const handleSave = (formInstance: FormInstance) => {
    formInstance.validateFields().then((values: Record<string, any>) => {
      console.log('保存设置:', values);
      message.success('设置已保存');
    });
  };

  const items: TabsProps['items'] = [
    {
      key: 'general',
      label: (
        <span>
          <GlobalOutlined />
          基本设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={generalForm}
            layout="vertical"
            initialValues={{
              siteName: '教学课程管理系统',
              siteDescription: '一个全面的教学课程管理平台',
              pageSize: 10,
              language: 'zh-CN',
              enableDarkMode: true,
            }}
          >
            <Form.Item
              name="siteName"
              label="网站名称"
              rules={[{ required: true, message: '请输入网站名称' }]}
            >
              <Input placeholder="网站名称" />
            </Form.Item>
            
            <Form.Item
              name="siteDescription"
              label="网站描述"
            >
              <Input.TextArea rows={3} placeholder="网站描述" />
            </Form.Item>
            
            <Form.Item
              name="pageSize"
              label="默认每页显示数量"
              rules={[{ required: true, message: '请选择默认分页大小' }]}
            >
              <Select>
                <Select.Option value={10}>10</Select.Option>
                <Select.Option value={20}>20</Select.Option>
                <Select.Option value={50}>50</Select.Option>
                <Select.Option value={100}>100</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="language"
              label="默认语言"
              rules={[{ required: true, message: '请选择默认语言' }]}
            >
              <Select>
                <Select.Option value="zh-CN">简体中文</Select.Option>
                <Select.Option value="en-US">English</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="enableDarkMode"
              label="启用深色模式"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                onClick={() => handleSave(generalForm)}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined />
          邮件设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={emailForm}
            layout="vertical"
            initialValues={{
              smtpServer: 'smtp.example.com',
              smtpPort: 587,
              smtpUsername: 'admin@example.com',
              senderName: '课程管理系统',
              enableSsl: true,
            }}
          >
            <Form.Item
              name="smtpServer"
              label="SMTP服务器"
              rules={[{ required: true, message: '请输入SMTP服务器' }]}
            >
              <Input placeholder="SMTP服务器地址" />
            </Form.Item>
            
            <Form.Item
              name="smtpPort"
              label="SMTP端口"
              rules={[{ required: true, message: '请输入SMTP端口' }]}
            >
              <Input type="number" placeholder="SMTP端口" />
            </Form.Item>
            
            <Form.Item
              name="smtpUsername"
              label="SMTP用户名"
              rules={[{ required: true, message: '请输入SMTP用户名' }]}
            >
              <Input placeholder="SMTP用户名" />
            </Form.Item>
            
            <Form.Item
              name="smtpPassword"
              label="SMTP密码"
              rules={[{ required: true, message: '请输入SMTP密码' }]}
            >
              <Input.Password placeholder="SMTP密码" />
            </Form.Item>
            
            <Form.Item
              name="senderName"
              label="发件人名称"
            >
              <Input placeholder="发件人名称" />
            </Form.Item>
            
            <Form.Item
              name="enableSsl"
              label="启用SSL/TLS"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  onClick={() => handleSave(emailForm)}
                >
                  保存设置
                </Button>
                <Button>发送测试邮件</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notification',
      label: (
        <span>
          <NotificationOutlined />
          通知设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={notificationForm}
            layout="vertical"
            initialValues={{
              enableEmailNotifications: true,
              newStudentNotification: true,
              courseCompletionNotification: true,
              systemUpdateNotification: true,
            }}
          >
            <Form.Item
              name="enableEmailNotifications"
              label="启用邮件通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="newStudentNotification"
              label="新学生注册通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="courseCompletionNotification"
              label="课程完成通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="systemUpdateNotification"
              label="系统更新通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                onClick={() => handleSave(notificationForm)}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyCertificateOutlined />
          安全设置
        </span>
      ),
      children: (
        <Card>
          <Form
            form={securityForm}
            layout="vertical"
            initialValues={{
              passwordMinLength: 8,
              passwordRequireSpecialChar: true,
              passwordRequireNumber: true,
              passwordRequireUppercase: true,
              sessionTimeout: 30,
              maxLoginAttempts: 5,
            }}
          >
            <Form.Item
              name="passwordMinLength"
              label="密码最小长度"
              rules={[{ required: true, message: '请输入密码最小长度' }]}
            >
              <Select>
                <Select.Option value={6}>6个字符</Select.Option>
                <Select.Option value={8}>8个字符</Select.Option>
                <Select.Option value={10}>10个字符</Select.Option>
                <Select.Option value={12}>12个字符</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="passwordRequireSpecialChar"
              label="密码需要特殊字符"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="passwordRequireNumber"
              label="密码需要数字"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="passwordRequireUppercase"
              label="密码需要大写字母"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name="sessionTimeout"
              label="会话超时时间（分钟）"
              rules={[{ required: true, message: '请输入会话超时时间' }]}
            >
              <Select>
                <Select.Option value={15}>15分钟</Select.Option>
                <Select.Option value={30}>30分钟</Select.Option>
                <Select.Option value={60}>60分钟</Select.Option>
                <Select.Option value={120}>120分钟</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="maxLoginAttempts"
              label="最大登录尝试次数"
              rules={[{ required: true, message: '请输入最大登录尝试次数' }]}
            >
              <Select>
                <Select.Option value={3}>3次</Select.Option>
                <Select.Option value={5}>5次</Select.Option>
                <Select.Option value={10}>10次</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                onClick={() => handleSave(securityForm)}
              >
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">系统设置</h1>
      <Tabs defaultActiveKey="general" items={items} />
    </div>
  );
};

export default Settings; 