import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Radio, Divider, Select, Checkbox } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import type { RadioChangeEvent } from 'antd/es/radio';
import { register, UserRole } from '../services/auth';
import type { RegisterRequest } from '../services/auth';

const { Title, Text } = Typography;
const { Option } = Select;

// 从服务导入接口
// interface RegisterFormData {
//   username: string;
//   password: string;
//   confirmPassword: string;
//   email: string;
//   fullName: string;
//   phone: string;
//   role: 'teacher' | 'student' | 'admin';
//   subject?: string; // 如果是教师，选择教授学科
//   grade?: string; // 如果是学生，选择年级
//   agreeTerms: boolean;
// }

// 扩展RegisterRequest接口，添加确认密码和协议同意字段
interface RegisterFormData extends Omit<RegisterRequest, 'name'> {
  confirmPassword: string;
  agreeTerms: boolean;
  fullName: string; // 使用fullName代替name，以便与API字段区分
}

const subjects = [
  '数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治'
];

const grades = [
  '初一', '初二', '初三', '高一', '高二', '高三'
];

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.STUDENT);

  const handleRoleChange = (e: RadioChangeEvent) => {
    setSelectedRole(e.target.value);
    // 当角色改变时，清除相关字段的值
    if (e.target.value === UserRole.TEACHER) {
      form.setFieldsValue({ grade: undefined });
    } else if (e.target.value === UserRole.STUDENT) {
      form.setFieldsValue({ subject: undefined });
    } else {
      form.setFieldsValue({ subject: undefined, grade: undefined });
    }
  };

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    try {
      // 准备注册数据
      const registerData: RegisterRequest = {
        username: values.username,
        password: values.password,
        // 使用fullName作为API中的name字段
        name: values.fullName,
        email: values.email,
        mobile: values.phone, // API使用mobile字段
        role: values.role as UserRole,
        // 状态设为激活
        status: 1
      };
      
      // 根据角色添加额外字段
      if (values.role === UserRole.TEACHER && values.subject) {
        registerData.subject = values.subject;
      } else if (values.role === UserRole.STUDENT && values.grade) {
        registerData.grade = values.grade;
      }
      
      // 调用注册服务
      const result = await register(registerData);
      
      if (result.success) {
        message.success(result.message || '注册成功，请登录');
        navigate('/login');
      } else {
        message.error(result.message || '注册失败');
      }
    } catch (err) {
      console.error('注册错误:', err);
      message.error('注册失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center py-12">
      <Card className="w-full max-w-2xl shadow-lg" bordered={false}>
        <div className="text-center mb-6">
          <Title level={2} className="my-4 text-primary">创建账号</Title>
          <Text type="secondary">请填写以下信息完成注册</Text>
        </div>
        
        <Form
          form={form}
          name="register"
          initialValues={{ role: UserRole.STUDENT, agreeTerms: false }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark="optional"
          scrollToFirstError
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="fullName"
              label="姓名"
              rules={[{ required: true, message: '请输入您的姓名' }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="请输入姓名" />
            </Form.Item>

            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 4, message: '用户名至少4个字符' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号码"
              rules={[
                { required: true, message: '请输入手机号码' },
                { pattern: /^1\d{10}$/, message: '请输入有效的手机号码' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请确认密码" />
            </Form.Item>
          </div>

          <Divider>角色信息</Divider>

          <Form.Item
            name="role"
            label="注册身份"
            rules={[{ required: true, message: '请选择注册身份' }]}
          >
            <Radio.Group onChange={handleRoleChange}>
              <Radio value={UserRole.TEACHER}>教师</Radio>
              <Radio value={UserRole.STUDENT}>学生</Radio>
              <Radio value={UserRole.ADMIN}>管理员</Radio>
            </Radio.Group>
          </Form.Item>

          {selectedRole === UserRole.TEACHER && (
            <Form.Item
              name="subject"
              label="教授学科"
              rules={[{ required: true, message: '请选择教授学科' }]}
            >
              <Select placeholder="请选择学科" allowClear>
                {subjects.map(subject => (
                  <Option key={subject} value={subject}>{subject}</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {selectedRole === UserRole.STUDENT && (
            <Form.Item
              name="grade"
              label="所在年级"
              rules={[{ required: true, message: '请选择所在年级' }]}
            >
              <Select placeholder="请选择年级" allowClear>
                {grades.map(grade => (
                  <Option key={grade} value={grade}>{grade}</Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="agreeTerms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('必须同意用户协议和隐私政策')),
              },
            ]}
          >
            <Checkbox>
              我已阅读并同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              className="h-10"
            >
              注册
            </Button>
          </Form.Item>
          
          <div className="text-center mt-4">
            <Text type="secondary">已有账号？</Text> <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 