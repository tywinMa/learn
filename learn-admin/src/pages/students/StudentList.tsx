import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Popconfirm, Card, Tabs, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import { getAllStudents, type Student } from '../../services/studentService';

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取学生列表
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setStudents(data);
    } catch (error) {
      console.error('获取学生列表失败:', error);
      message.error('获取学生列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 模拟数据，实际中应该从API获取
  const mockStudents: Student[] = [
    {
      id: '1',
      name: '王小明',
      email: 'wang@example.com',
      phone: '13800138001',
      enrolledCourses: ['React基础与实战', 'Node.js高级编程'],
      status: 'active',
      createdAt: '2023-02-10',
    },
    {
      id: '2',
      name: '李芳',
      email: 'lifang@example.com',
      phone: '13900139002',
      enrolledCourses: ['Python数据分析'],
      status: 'active',
      createdAt: '2023-01-15',
    },
    {
      id: '3',
      name: '张伟',
      email: 'zhang@example.com',
      phone: '13700137003',
      enrolledCourses: ['Java企业级应用', 'React基础与实战', 'UI/UX设计原则'],
      status: 'active',
      createdAt: '2022-12-05',
    },
    {
      id: '4',
      name: '刘晓华',
      email: 'liu@example.com',
      phone: '13600136004',
      enrolledCourses: [],
      status: 'inactive',
      createdAt: '2023-03-20',
    },
    {
      id: '5',
      name: '赵明',
      email: 'zhao@example.com',
      phone: '13500135005',
      enrolledCourses: ['UI/UX设计原则'],
      status: 'active',
      createdAt: '2023-02-28',
    },
  ];

  const handleDelete = (id: string) => {
    console.log('删除学生:', id);
    // 这里应该有实际的删除API调用
  };

  // 如果没有真实数据，使用模拟数据
  const displayStudents = students.length > 0 ? students : mockStudents;
  
  const filteredStudents = displayStudents.filter((student) => 
    student.name.toLowerCase().includes(searchText.toLowerCase()) ||
    student.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (student.phone && student.phone.includes(searchText))
  );

  const columns: ColumnsType<Student> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '课程数',
      key: 'courseCount',
      render: (_, record) => record.enrolledCourses?.length || 0,
      sorter: (a, b) => (a.enrolledCourses?.length || 0) - (b.enrolledCourses?.length || 0),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        return (
          <Tag color={status === 'active' ? 'green' : 'orange'}>
            {status === 'active' ? '活跃' : '非活跃'}
          </Tag>
        );
      },
      filters: [
        { text: '活跃', value: 'active' },
        { text: '非活跃', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '注册日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<BarChartOutlined />} 
            type="link"
            onClick={() => navigate(`/students/${record.id}/progress`)}
          >
            查看进度
          </Button>
          <Button 
            icon={<EditOutlined />} 
            type="link" 
          />
          <Popconfirm
            title="确定要删除这个学生吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const items: TabsProps['items'] = [
    {
      key: 'all',
      label: '所有学生',
      children: (
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      ),
    },
    {
      key: 'active',
      label: '活跃学生',
      children: (
        <Table
          columns={columns}
          dataSource={filteredStudents.filter(s => s.status === 'active')}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      ),
    },
    {
      key: 'inactive',
      label: '非活跃学生',
      children: (
        <Table
          columns={columns}
          dataSource={filteredStudents.filter(s => s.status === 'inactive')}
          rowKey="id"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">学生管理</h1>
        <Space>
          <Input
            placeholder="搜索学生"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />}>
            添加学生
          </Button>
        </Space>
      </div>
      
      <Card>
        <Tabs defaultActiveKey="all" items={items} />
      </Card>
    </div>
  );
};

export default StudentList; 