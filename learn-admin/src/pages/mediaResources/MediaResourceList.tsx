import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Image, Modal, message, Input, Select, Pagination, Popconfirm, Upload, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, UploadOutlined, PlayCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { type MediaResource, mediaResourceService } from '../../services/mediaResourceService';
import MediaResourceForm from './MediaResourceForm';
import { useUser } from '../../contexts/UserContext';
import { getAllUnits, type Unit } from '../../services/unitService';

// 根据课程ID查找单元的辅助函数
const findUnitByCourseId = (courseId: string, units: Unit[]): Unit | null => {
  return units.find(unit => 
    unit.courseIds && unit.courseIds.includes(courseId)
  ) || null;
};

const { Search } = Input;
const { Option } = Select;

const MediaResourceList: React.FC = () => {
  const [mediaResources, setMediaResources] = useState<MediaResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploaders, setUploaders] = useState<Array<{id: number; name: string; username: string}>>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const { user } = useUser();
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingResource, setEditingResource] = useState<MediaResource | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewResource, setPreviewResource] = useState<MediaResource | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    resourceType: '',
    uploadUserId: ''  // 保持为string，转换时再处理
  });

  // 判断是否为管理员或超级管理员
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // 资源类型选项
  const resourceTypes = [
    { value: 'course_explanation', label: '课程讲解资源' },
    { value: 'course_media', label: '课程媒体资源' },
    { value: 'example_media', label: '例题媒体资源' }
  ];

  // 状态选项
  const statusOptions = [
    { value: 'draft', label: '草稿', color: 'gray' },
    { value: 'pending', label: '待审核', color: 'orange' },
    { value: 'published', label: '已发布', color: 'green' },
    { value: 'under_review', label: '审核中', color: 'blue' },
    { value: 'rejected', label: '已退回', color: 'red' },
  ];

  // 文件类型选项
  const fileTypeOptions = [
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' }
  ];

  useEffect(() => {
    fetchMediaResources();
    fetchUnits();
    if (isAdmin) {
      fetchUploaders();
    }
  }, [page, filters, isAdmin]);

  const fetchMediaResources = async () => {
    setLoading(true);
    try {
      // 准备API参数，处理uploadUserId的类型转换
      const apiParams = {
        page,
        limit,
        search: filters.search || undefined,
        type: filters.type || undefined,
        status: filters.status || undefined,
        resourceType: filters.resourceType || undefined,
        uploadUserId: filters.uploadUserId ? parseInt(filters.uploadUserId) : undefined,
      };
      
      const response = await mediaResourceService.getMediaResources(apiParams) as unknown as {
        mediaResources: MediaResource[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      console.log('获取媒体资源列表成功:', response);
      setMediaResources(response.mediaResources);
      setTotal(response.total);
      
      // 从媒体资源中提取上传者信息（用于管理员筛选）
      if (isAdmin && response.mediaResources.length > 0) {
        const uniqueUploaders = response.mediaResources
          .filter(resource => resource.uploader)
          .map(resource => resource.uploader!)
          .filter((uploader, index, self) => 
            self.findIndex(u => u.id === uploader.id) === index
          );
        setUploaders(prev => {
          const merged = [...prev];
          uniqueUploaders.forEach(uploader => {
            if (!merged.find(u => u.id === uploader.id)) {
              merged.push({
                id: uploader.id,
                name: uploader.name || '',
                username: uploader.username
              });
            }
          });
          return merged;
        });
      }
    } catch (error) {
      console.error('获取媒体资源列表失败:', error);
      message.error('获取媒体资源列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取上传者列表（仅管理员）
  const fetchUploaders = async () => {
    // 这里可以调用一个专门的API来获取所有上传者
    // 暂时通过媒体资源列表来获取
  };

  // 获取单元数据
  const fetchUnits = async () => {
    try {
      const unitsData = await getAllUnits();
      setUnits(unitsData);
    } catch (error) {
      console.error('获取单元数据失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingResource(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: MediaResource) => {
    setEditingResource(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await mediaResourceService.deleteMediaResource(id);
      message.success('删除成功');
      fetchMediaResources();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handlePreview = (record: MediaResource) => {
    setPreviewResource(record);
    setPreviewVisible(true);
  };

  const handleBatchStatusUpdate = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要更新的媒体资源');
      return;
    }

    try {
      await mediaResourceService.batchUpdateStatus(selectedRowKeys as number[], status);
      message.success('批量更新状态成功');
      setSelectedRowKeys([]);
      fetchMediaResources();
    } catch (error) {
      message.error('批量更新状态失败');
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const columns = [
    {
      title: '预览',
      dataIndex: 'resourceUrl',
      key: 'preview',
      width: 80,
      render: (url: string, record: MediaResource) => (
        <div className="w-12 h-12 flex items-center justify-center">
          {record.resourceType === 'image' ? (
            <Image
              src={url}
              alt={record.title}
              width={48}
              height={48}
              className="object-cover rounded"
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAAAUCAMAAAD0fHthAAAAGFBMVEXMzMz////Ozs7R0dHU1NTW1tbKysrN0NDv3tMRAAAAT0lEQVR4nO3QQQ0AAAjAsPd/aE3gDQjACCCCCCKIIIIIIogggggisggiSCCCBCJIIIIEIkggggQiSCCCBCJIIIIEIkggggQiaCCCCBJYP8oBEYz6GZA6AAAAAElFTkSuQmCC"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <PlayCircleOutlined className="text-xl text-gray-400" />
            </div>
          )}
        </div>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title: string, record: MediaResource) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">
            {resourceTypes.find(t => t.value === record.type)?.label}
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'image' ? 'blue' : 'orange'}>
          {fileTypeOptions.find(t => t.value === type)?.label}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = statusOptions.find(s => s.value === status);
        return (
          <Tag color={statusConfig?.color}>
            {statusConfig?.label}
          </Tag>
        );
      }
    },
    {
      title: '上传者',
      dataIndex: 'uploader',
      key: 'uploader',
      width: 120,
      render: (uploader: any) => uploader?.name || uploader?.username || ''
    },
    {
      title: '关联信息',
      key: 'relationInfo',
      width: 280,
      render: (record: MediaResource) => {
        if (!record.courses || record.courses.length === 0) {
          return <span className="text-gray-400">未关联课程</span>;
        }
        
        const course = record.courses[0]; // 只取第一个，因为一个媒体资源只关联一个课程
        const unit = findUnitByCourseId(course.id, units);
        
        return (
          <div className="text-xs">
            <div className="border rounded p-2 bg-gray-50">
              <div className="flex flex-wrap gap-1 mb-2">
                {course.grade && (
                  <Tag color="blue">{course.grade.name}</Tag>
                )}
                {course.subjectInfo && (
                  <Tag color="green">{course.subjectInfo.name}</Tag>
                )}
              </div>
              <div className="mb-1">
                <span className="text-gray-500">单元：</span>
                <Tag color="purple">{unit?.title || '加载中...'}</Tag>
              </div>
              <div className="font-medium text-gray-700 truncate" title={course.title}>
                课程：{course.title}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: '文件信息',
      key: 'fileInfo',
      width: 120,
      render: (record: MediaResource) => (
        <div className="text-xs">
          {record.fileSize && <div>大小: {formatFileSize(record.fileSize)}</div>}
          {record.duration && <div>时长: {formatDuration(record.duration)}</div>}
        </div>
      )
    },
    {
      title: '统计',
      key: 'stats',
      width: 100,
      render: (record: MediaResource) => (
        <div className="text-xs">
          <div>浏览: {record.viewCount}</div>
          <div>点击: {record.clickCount}</div>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (time: string) => new Date(time).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (record: MediaResource) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            title="预览"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="编辑"
          />
          <Popconfirm
            title="确定要删除这个媒体资源吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="删除"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(selectedRowKeys);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">媒体资源管理</h1>
        
        {/* 筛选条件 */}
        <div className="mb-4 flex flex-wrap gap-4">
          <Search
            placeholder="搜索标题或描述"
            style={{ width: 200 }}
            onSearch={handleSearch}
            allowClear
          />
          <Select
            placeholder="选择资源类型"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => handleFilterChange('type', value || '')}
          >
            {resourceTypes.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => handleFilterChange('status', value || '')}
          >
            {statusOptions.map(status => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="选择文件类型"
            style={{ width: 100 }}
            allowClear
            onChange={(value) => handleFilterChange('resourceType', value || '')}
          >
            {fileTypeOptions.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
          
          {/* 管理员专用：按上传者筛选 */}
          {isAdmin && uploaders.length > 0 && (
            <Select
              placeholder="选择上传者"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => handleFilterChange('uploadUserId', value || '')}
            >
              {uploaders.map(uploader => (
                <Option key={uploader.id} value={uploader.id.toString()}>
                  {uploader.name || uploader.username}
                </Option>
              ))}
            </Select>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="mb-4 flex justify-between">
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加媒体资源
            </Button>
            {isAdmin && (
              <Button
                type="default"
                onClick={() => {
                  setFilters({
                    search: '',
                    type: '',
                    status: '',
                    resourceType: '',
                    uploadUserId: ''
                  });
                  setPage(1);
                }}
              >
                重置筛选
              </Button>
            )}
          </Space>
          
          {selectedRowKeys.length > 0 && isAdmin && (
            <Space>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Button size="small" onClick={() => handleBatchStatusUpdate('published')}>
                批量发布
              </Button>
              <Button size="small" onClick={() => handleBatchStatusUpdate('under_review')}>
                批量提交审核
              </Button>
              <Button size="small" onClick={() => handleBatchStatusUpdate('pending')}>
                批量设为待发布
              </Button>
            </Space>
          )}
        </div>
        
        {/* 数据统计信息 */}
        <div className="mb-4 text-sm text-gray-600">
          {isAdmin ? (
            `共 ${total} 个媒体资源（显示所有用户的数据）`
          ) : (
            `共 ${total} 个媒体资源`
          )}
        </div>
      </div>

      {/* 表格 */}
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={mediaResources}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 1200 }}
      />

      {/* 分页 */}
      <div className="mt-4 flex justify-end">
        <Pagination
          current={page}
          total={total}
          pageSize={limit}
          onChange={setPage}
          showSizeChanger={false}
          showQuickJumper
          showTotal={(total, range) =>
            `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }
        />
      </div>

      {/* 编辑/新增弹窗 */}
      <MediaResourceForm
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSubmit={() => {
          setIsModalVisible(false);
          fetchMediaResources();
        }}
        resource={editingResource}
      />

      {/* 预览弹窗 */}
      <Modal
        title="媒体资源预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {previewResource && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{previewResource.title}</h3>
              <div className="text-sm text-gray-500 mt-1">
                {resourceTypes.find(t => t.value === previewResource.type)?.label}
              </div>
            </div>
            
            <div className="mb-4">
              {previewResource.resourceType === 'image' ? (
                <Image
                  src={previewResource.resourceUrl}
                  alt={previewResource.title}
                  className="max-w-full"
                />
              ) : (
                <video
                  src={previewResource.resourceUrl}
                  controls
                  className="max-w-full"
                  poster={previewResource.thumbnailUrl}
                >
                  您的浏览器不支持视频播放
                </video>
              )}
            </div>

            {previewResource.description && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">资源描述</h4>
                <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: previewResource.description }} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">状态：</span>
                                 <Tag color={statusOptions.find(s => s.value === previewResource.status)?.color}>
                   {statusOptions.find(s => s.value === previewResource.status)?.label}
                 </Tag>
              </div>
              <div>
                <span className="font-medium">上传者：</span>
                {previewResource.uploader?.name || previewResource.uploader?.username}
              </div>
              {previewResource.fileSize && (
                <div>
                  <span className="font-medium">文件大小：</span>
                  {formatFileSize(previewResource.fileSize)}
                </div>
              )}
              {previewResource.duration && (
                <div>
                  <span className="font-medium">时长：</span>
                  {formatDuration(previewResource.duration)}
                </div>
              )}
              <div>
                <span className="font-medium">浏览量：</span>
                {previewResource.viewCount}
              </div>
              <div>
                <span className="font-medium">点击量：</span>
                {previewResource.clickCount}
              </div>
            </div>

            {previewResource.tags && previewResource.tags.length > 0 && (
              <div className="mt-4">
                <span className="font-medium">标签：</span>
                <div className="mt-1">
                  {previewResource.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaResourceList; 