import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Select, message, Modal, Card, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ExerciseGroup } from '../../services/exerciseGroupService';
import { getExerciseGroups, deleteExerciseGroup } from '../../services/exerciseGroupService';
import { getSubjects } from '../../services/subjectService';

const { Search } = Input;
const { Option } = Select;

const ExerciseGroupList: React.FC = () => {
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchName, setSearchName] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const navigate = useNavigate();

  // 获取学科列表
  const fetchSubjects = async () => {
    try {
      const subjectList = await getSubjects();
      setSubjects(subjectList);
    } catch (error) {
      console.error('获取学科列表失败:', error);
    }
  };

  // 获取习题组列表
  const fetchExerciseGroups = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(searchName && { name: searchName }),
        ...(searchSubject && { subject: searchSubject })
      };
      
      console.log('🔍 ExerciseGroupList - 开始获取习题组列表，参数:', params);
      const response = await getExerciseGroups(params);
      console.log('📦 ExerciseGroupList - API响应数据:', response);
      console.log('📋 ExerciseGroupList - 习题组列表:', response.exerciseGroups);
      console.log('📊 ExerciseGroupList - 总数:', response.total);
      
      setExerciseGroups(response.exerciseGroups);
      setTotal(response.total);
    } catch (error) {
      console.error('❌ ExerciseGroupList - 获取习题组列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchExerciseGroups();
  }, [currentPage, pageSize, searchName, searchSubject]);

  // 删除习题组
  const handleDelete = (record: ExerciseGroup) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除习题组"${record.name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const success = await deleteExerciseGroup(record.id);
        if (success) {
          fetchExerciseGroups();
        }
      }
    });
  };

  // 重置搜索
  const handleReset = () => {
    setSearchName('');
    setSearchSubject('');
    setCurrentPage(1);
  };

  const columns = [
    {
      title: '习题组ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
    },
    {
      title: '习题组名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '学科',
      dataIndex: 'Subject',
      key: 'subject',
      width: 120,
      render: (subject: any) => (
        <Tag color="blue">
          {subject?.name || '未知学科'}
        </Tag>
      ),
    },
    {
      title: '习题数量',
      dataIndex: 'exerciseCount',
      key: 'exerciseCount',
      width: 100,
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count || 0}道
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span>{text || '暂无描述'}</span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ExerciseGroup) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/exercise-groups/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/exercise-groups/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Search
            placeholder="搜索习题组名称"
            allowClear
            style={{ width: 200 }}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onSearch={fetchExerciseGroups}
          />
          <Select
            placeholder="选择学科"
            allowClear
            style={{ width: 150 }}
            value={searchSubject}
            onChange={setSearchSubject}
          >
            {subjects.map(subject => (
              <Option key={subject.code} value={subject.code}>
                {subject.name}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchExerciseGroups}
          >
            搜索
          </Button>
          <Button onClick={handleReset}>
            重置
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/exercise-groups/new')}
          >
            新增习题组
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={exerciseGroups}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size || 10);
          },
        }}
      />
    </Card>
  );
};

export default ExerciseGroupList; 