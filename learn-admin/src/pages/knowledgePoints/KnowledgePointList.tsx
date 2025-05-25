import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Card,
  Input,
  Select,
  message,
  Modal,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import {
  getKnowledgePoints,
  deleteKnowledgePoint,
  type KnowledgePoint,
  type KnowledgePointQueryParams
} from '../../services/knowledgePointService';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

// 学科选项
const subjectOptions = [
  { value: 'math', label: '数学' },
  { value: 'chinese', label: '语文' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'history', label: '历史' },
  { value: 'geography', label: '地理' },
  { value: 'politics', label: '政治' },
  { value: 'it', label: '信息技术' }
];

// 内容类型选项
const typeOptions = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' }
];

// 难度标签颜色映射
const difficultyColors = {
  1: 'green',
  2: 'blue', 
  3: 'orange',
  4: 'red',
  5: 'purple'
};

// 难度标签文本映射
const difficultyTexts = {
  1: '简单',
  2: '较易',
  3: '中等',
  4: '较难', 
  5: '困难'
};

const KnowledgePointList: React.FC = () => {
  const navigate = useNavigate();
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<KnowledgePointQueryParams>({
    page: 1,
    limit: 10,
    subject: undefined,
    type: undefined,
    search: undefined
  });

  // 获取知识点列表
  const fetchKnowledgePoints = async () => {
    setLoading(true);
    try {
      const params = { ...queryParams };
      // 清空空值参数
      Object.keys(params).forEach(key => {
        if (params[key as keyof KnowledgePointQueryParams] === '') {
          delete params[key as keyof KnowledgePointQueryParams];
        }
      });
      
      const response = await getKnowledgePoints(params);
      setKnowledgePoints(response.knowledgePoints);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('获取知识点列表失败:', error);
      message.error('获取知识点列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchKnowledgePoints();
  }, [queryParams]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setQueryParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  // 处理学科筛选
  const handleSubjectChange = (value: string) => {
    setQueryParams(prev => ({ ...prev, subject: value, page: 1 }));
  };

  // 处理类型筛选
  const handleTypeChange = (value: string) => {
    setQueryParams(prev => ({ ...prev, type: value as 'text' | 'image' | 'video', page: 1 }));
  };

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    setQueryParams(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize
    }));
  };

  // 处理删除
  const handleDelete = (record: KnowledgePoint) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除知识点"${record.title}"吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteKnowledgePoint(record.id);
          message.success('删除成功');
          fetchKnowledgePoints();
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  // 重置筛选
  const handleReset = () => {
    setQueryParams({
      page: 1,
      limit: 10,
      subject: undefined,
      type: undefined,
      search: undefined
    });
  };

  // 表格列定义
  const columns: ColumnsType<KnowledgePoint> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left'
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      fixed: 'left',
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 180 }}>
            {text}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
      render: (subject: string) => {
        const subjectOption = subjectOptions.find(opt => opt.value === subject);
        return <Tag color="blue">{subjectOption?.label || subject}</Tag>;
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const typeOption = typeOptions.find(opt => opt.value === type);
        const colorMap = { text: 'default', image: 'green', video: 'orange' };
        return <Tag color={colorMap[type as keyof typeof colorMap]}>{typeOption?.label || type}</Tag>;
      }
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: number) => (
        <Tag color={difficultyColors[difficulty as keyof typeof difficultyColors]}>
          {difficultyTexts[difficulty as keyof typeof difficultyTexts]}
        </Tag>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (content: string) => (
        <Tooltip title={content}>
          <Text ellipsis style={{ maxWidth: 280 }}>
            {content.replace(/<[^>]*>/g, '')} {/* 简单去除HTML标签 */}
          </Text>
        </Tooltip>
      )
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
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/knowledge-points/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Search
              placeholder="搜索标题或内容"
              allowClear
              style={{ width: 250 }}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
            <Select
              placeholder="选择学科"
              style={{ width: 120 }}
              allowClear
              value={queryParams.subject || undefined}
              onChange={handleSubjectChange}
            >
              {subjectOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="选择类型"
              style={{ width: 120 }}
              allowClear
              value={queryParams.type || undefined}
              onChange={handleTypeChange}
            >
              {typeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/knowledge-points/new')}
            >
              新建知识点
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={knowledgePoints}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.limit,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条 / 共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default KnowledgePointList; 