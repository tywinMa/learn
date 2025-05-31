import React, { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Tag,
  Button,
  message,
  Popconfirm,
  Space,
  Badge,
  Tooltip,
  Typography,
  Alert,
  Empty,
} from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  getTasks,
  deleteTask,
  getTaskStats,
  getTaskStatusColor,
  getTaskStatusText,
  getTaskTypeText,
} from "../services/taskService";
import type { Task, TaskStats } from "../services/taskService";

const { Text } = Typography;

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ visible, onClose }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const result = await getTasks({
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setTasks(result.tasks);
      setPagination(prev => ({
        ...prev,
        total: result.total,
      }));
    } catch (error) {
      console.error("获取任务列表失败:", error);
      message.error("获取任务列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取任务统计
  const fetchStats = async () => {
    try {
      const stats = await getTaskStats();
      setStats(stats);
    } catch (error) {
      console.error("获取任务统计失败:", error);
    }
  };

  // 删除任务
  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      message.success("删除成功");
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error("删除任务失败:", error);
      message.error("删除任务失败");
    }
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchTasks();
    fetchStats();
  };

  // 格式化时间
  const formatTime = (time: string) => {
    try {
      const date = new Date(time);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "刚刚";
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return date.toLocaleDateString();
    } catch {
      return time;
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClockCircleOutlined style={{ color: getTaskStatusColor(status as any) }} />;
      case "running":
        return <LoadingOutlined style={{ color: getTaskStatusColor(status as any) }} />;
      case "success":
        return <CheckCircleOutlined style={{ color: getTaskStatusColor(status as any) }} />;
      case "failed":
        return <ExclamationCircleOutlined style={{ color: getTaskStatusColor(status as any) }} />;
      default:
        return null;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: "任务名称",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (title: string, record: Task) => (
        <div>
          <div className="font-medium">{title}</div>
          <Text type="secondary" className="text-xs">
            {getTaskTypeText(record.type)}
          </Text>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={getTaskStatusColor(status as any)}>
            {getTaskStatusText(status as any)}
          </Tag>
        </Space>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <span>{description || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (time: string) => (
        <Tooltip title={new Date(time).toLocaleString()}>
          <Text className="text-xs">{formatTime(time)}</Text>
        </Tooltip>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 80,
      render: (_: any, record: Task) => (
        <Space>
          <Popconfirm
            title="确定要删除这个任务吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 自动刷新
  useEffect(() => {
    if (!visible) return;

    fetchTasks();
    fetchStats();

    // 每5秒自动刷新一次运行中的任务
    const interval = setInterval(() => {
      if (visible && tasks.some(task => task.status === "running")) {
        fetchTasks();
        fetchStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [visible, pagination.current, pagination.pageSize]);

  // 表格分页配置
  const paginationConfig = {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange: (page: number, pageSize: number) => {
      setPagination({ current: page, pageSize, total: pagination.total });
    },
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span>任务管理</span>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新
          </Button>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      {/* 任务统计 */}
      {stats && (
        <div className="mb-4">
          <Space size="large">
            <Badge count={stats.pending} color="#faad14">
              <div className="bg-orange-50 px-3 py-2 rounded">
                <Text className="text-sm">等待中</Text>
              </div>
            </Badge>
            <Badge count={stats.running} color="#1890ff">
              <div className="bg-blue-50 px-3 py-2 rounded">
                <Text className="text-sm">运行中</Text>
              </div>
            </Badge>
            <Badge count={stats.success} color="#52c41a">
              <div className="bg-green-50 px-3 py-2 rounded">
                <Text className="text-sm">已完成</Text>
              </div>
            </Badge>
            <Badge count={stats.failed} color="#ff4d4f">
              <div className="bg-red-50 px-3 py-2 rounded">
                <Text className="text-sm">失败</Text>
              </div>
            </Badge>
          </Space>
        </div>
      )}

      {/* 提示信息 */}
      {stats && stats.running > 0 && (
        <Alert
          message="有任务正在运行中，页面将每5秒自动刷新状态"
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* 任务列表 */}
      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={paginationConfig}
        size="small"
        locale={{
          emptyText: (
            <Empty
              description="暂无任务"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
    </Modal>
  );
};

export default TaskModal; 