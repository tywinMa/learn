import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Button,
  theme,
  Dropdown,
  Avatar,
  message,
  Tooltip,
  Badge,
} from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  BugOutlined,
  ReadOutlined,
  FormOutlined,
  UnorderedListOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser, logout } from "../../services/auth";
import { useUserStore } from "../../store/userStore";
import { useSubjectStore } from "../../store/subjectStore";
import { useUser } from "../../contexts/UserContext";
import TaskModal from "../TaskModal";
import { getTaskStats } from "../../services/taskService";
import type { TaskStats } from "../../services/taskService";

const { Header, Sider, Content } = Layout;

// 调试工具函数
const enableDebugMode = () => {
  // 打印环境信息
  console.log(
    "%c 系统调试模式已启用 ",
    "background: #ff9800; color: white; padding: 8px;"
  );
  console.log("环境信息:", {
    环境: import.meta.env.MODE,
    接口地址: "/api/admin",
    React版本: React.version,
  });

  // 注入全局请求监听
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const [url, config] = args;
    console.group(
      `%c 请求 ${config?.method || "GET"} ${url}`,
      "color: #2196F3"
    );
    console.log("请求配置:", config);
    console.groupEnd();

    try {
      const response = await originalFetch(...args);
      const clone = response.clone();

      try {
        const data = await clone.json();
        console.group(
          `%c 响应 ${config?.method || "GET"} ${url}`,
          "color: #4CAF50"
        );
        console.log("响应数据:", data);
        console.groupEnd();
      } catch {
        // 非JSON响应，忽略
      }

      return response;
    } catch (error) {
      console.group(`%c 请求错误 ${url}`, "color: #f44336");
      console.error(error);
      console.groupEnd();
      throw error;
    }
  };

  message.success("调试模式已启用，请查看控制台");
  return true;
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, clearUser } = useUserStore();
  const { setUser: setUserContext } = useUser();
  const { fetchSubjects } = useSubjectStore(); // 获取学科数据加载方法
  const [debugMode, setDebugMode] = useState(false);

  // 开发环境才显示调试按钮
  const isDev = import.meta.env.DEV;

  // 检查是否为管理员或超级管理员
  const isAdminOrSuperAdmin = () => {
    if (!user) return false;
    
    // 检查用户角色
    if (user.role === 'admin' || user.role === 'superadmin') {
      return true;
    }
    
    // 检查roles数组
    if (user.roles && user.roles.length > 0) {
      return user.roles.some(role => role.code === 'admin' || role.code === 'superadmin');
    }
    
    return false;
  };

  // 获取任务统计
  const fetchTaskStats = async () => {
    try {
      const stats = await getTaskStats();
      setTaskStats(stats);
    } catch (error) {
      console.error("获取任务统计失败:", error);
    }
  };

  // 启用调试模式
  const toggleDebugMode = () => {
    if (!debugMode) {
      const enabled = enableDebugMode();
      setDebugMode(enabled);
    } else {
      message.info("调试模式已经启用");
    }
  };

  useEffect(() => {
    // 如果全局状态中没有用户信息，尝试从localStorage获取
    if (!user) {
      const localUser = getCurrentUser();
      if (localUser) {
        setUser(localUser);
      } else {
        // 如果没有用户信息，重定向到登录页
        navigate("/login");
        return;
      }
    }

    // 检查用户权限并重定向到合适的页面
    if (user) {
      const isAdmin = isAdminOrSuperAdmin();
      const currentPath = location.pathname;
      
      // 定义普通用户可以访问的页面
      const allowedPagesForNonAdmin = ['/exercises', '/media-resources'];
      
      // 如果不是管理员且当前页面不在允许列表中，重定向到习题管理
      if (!isAdmin && !allowedPagesForNonAdmin.some(page => currentPath.includes(page))) {
        // 如果是根路径或仪表盘等受限页面，重定向到习题管理
        if (currentPath === '/' || currentPath === '/dashboard' || 
            currentPath.includes('/subjects') || currentPath.includes('/grades') || 
            currentPath.includes('/units') || currentPath.includes('/courses') || 
            currentPath.includes('/knowledge-points') || currentPath.includes('/students') || 
            currentPath.includes('/settings')) {
          navigate("/exercises");
          return;
        }
      }
      
      // 如果是根路径，根据权限重定向
      if (currentPath === '/') {
        navigate(isAdmin ? "/dashboard" : "/exercises");
        return;
      }
    }

    // 预加载全局学科数据
    fetchSubjects().catch((error) => {
      console.error("加载学科数据失败:", error);
    });

    // 初始加载任务统计
    fetchTaskStats();

    // 每30秒刷新一次任务统计
    const interval = setInterval(fetchTaskStats, 30000);
    return () => clearInterval(interval);
  }, [navigate, user, setUser, fetchSubjects, location.pathname]);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 根据用户权限生成菜单项
  const getMenuItems = () => {
    const isAdmin = isAdminOrSuperAdmin();
    
    // 基础菜单项（所有用户都可以看到的）
    const baseMenuItems = [
      {
        key: "exercise-management",
        icon: <FormOutlined />,
        label: "习题管理",
        onClick: () => navigate("/exercises"),
      },
      {
        key: "media-resources",
        icon: <FileImageOutlined />,
        label: "媒体资源管理",
        onClick: () => navigate("/media-resources"),
      },
    ];
    
    // 如果是管理员或超级管理员，显示完整菜单
    if (isAdmin) {
      return [
        {
          key: "dashboard",
          icon: <DashboardOutlined />,
          label: "仪表盘",
          onClick: () => navigate("/dashboard"),
        },
        {
          key: "course-group",
          icon: <BookOutlined />,
          label: "教学管理",
          children: [
            {
              key: "subjects",
              icon: <ReadOutlined />,
              label: "学科管理",
              onClick: () => navigate("/subjects"),
            },
            {
              key: "grades",
              icon: <ReadOutlined />,
              label: "年级管理",
              onClick: () => navigate("/grades"),
            },
            {
              key: "units",
              icon: <ReadOutlined />,
              label: "单元管理",
              onClick: () => navigate("/units"),
            },
            {
              key: "courses",
              icon: <ReadOutlined />,
              label: "课程管理",
              onClick: () => navigate("/courses"),
            },
            {
              key: "exercise-management",
              icon: <FormOutlined />,
              label: "习题管理",
              onClick: () => navigate("/exercises"),
            },
            {
              key: "knowledge-points",
              icon: <ReadOutlined />,
              label: "知识点管理",
              onClick: () => navigate("/knowledge-points"),
            },
            {
              key: "media-resources",
              icon: <FileImageOutlined />,
              label: "媒体资源管理",
              onClick: () => navigate("/media-resources"),
            },
          ],
        },
        {
          key: "students",
          icon: <TeamOutlined />,
          label: "学生管理",
          onClick: () => navigate("/students"),
        },
        {
          key: "settings",
          icon: <SettingOutlined />,
          label: "系统设置",
          onClick: () => navigate("/settings"),
        },
      ];
    }
    
    // 其他用户只显示基础菜单
    return baseMenuItems;
  };

  // 菜单项定义
  const menuItems = getMenuItems();

  const handleLogout = () => {
    // 创建一个函数来同时清理两个状态管理
    const clearBothUserStates = () => {
      clearUser(); // 清理Zustand store
      setUserContext(null); // 清理UserContext
    };
    
    // 调用logout时传入清除全局用户状态的函数
    logout(clearBothUserStates);
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人资料",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "账户设置",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout,
    },
  ];

  // 确定当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    const isAdmin = isAdminOrSuperAdmin();
    
    if (path.includes("dashboard")) return ["dashboard"];
    if (path.includes("exercises")) {
      // 根据用户权限返回不同的菜单键
      return isAdmin ? ["course-group", "exercise-management"] : ["exercise-management"];
    }
    if (path.includes("media-resources")) {
      // 根据用户权限返回不同的菜单键
      return isAdmin ? ["course-group", "media-resources"] : ["media-resources"];
    }
    if (path.includes("courses")) return ["course-group", "courses"];
    if (path.includes("subjects")) return ["course-group", "subjects"];
    if (path.includes("grades")) return ["course-group", "grades"];
    if (path.includes("units")) return ["course-group", "units"];
    if (path.includes("knowledge-points")) return ["course-group", "knowledge-points"];
    if (path.includes("students")) return ["students"];
    if (path.includes("settings")) return ["settings"];
    
    // 默认选中逻辑：管理员默认选中仪表盘，普通用户默认选中习题管理
    return isAdmin ? ["dashboard"] : ["exercise-management"];
  };

  // 确定当前页面标题
  const getPageTitle = () => {
    const path = location.pathname;
    const isAdmin = isAdminOrSuperAdmin();
    
    if (path.includes("dashboard")) return "仪表盘";
    if (path.includes("courses")) return "课程管理";
    if (path.includes("subjects")) return "学科管理";
    if (path.includes("grades")) return "年级管理";
    if (path.includes("units")) return "单元管理";
    if (path.includes("exercises")) return "习题管理";
    if (path.includes("knowledge-points")) return "知识点管理";
    if (path.includes("media-resources")) return "媒体资源管理";
    if (path.includes("students")) return "学生管理";
    if (path.includes("settings")) return "系统设置";
    
    // 默认标题：管理员显示仪表盘，普通用户显示习题管理
    return isAdmin ? "仪表盘" : "习题管理";
  };

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="shadow-md"
        style={{
          background: "#001529",
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="p-4 h-16 flex items-center justify-center">
          {!collapsed ? (
            <div className="text-white text-xl font-bold">教学管理系统</div>
          ) : (
            <div className="text-white text-xl font-bold">系统</div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={isAdminOrSuperAdmin() ? ["course-group"] : []}
          selectedKeys={getSelectedKey()}
          items={menuItems}
          className="border-t border-gray-700"
        />
      </Sider>
      <Layout
        style={{ marginLeft: collapsed ? 80 : 200, transition: "all 0.2s" }}
      >
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
          }}
        >
          <div className="flex justify-between items-center px-6">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="mr-3"
            />
            <div className="text-lg font-medium text-gray-700">
              {getPageTitle()}
            </div>
            <div className="flex items-center">
              {/* 任务查询按钮 */}
              <Tooltip title="任务管理">
                <Badge 
                  count={taskStats ? taskStats.running + taskStats.pending : 0}
                  size="small"
                  offset={[-2, 2]}
                >
                  <Button
                    type="text"
                    icon={<UnorderedListOutlined />}
                    onClick={() => setTaskModalVisible(true)}
                    className="mr-2"
                  />
                </Badge>
              </Tooltip>
              
              {/* 仅在开发环境显示调试按钮 */}
              {isDev && (
                <Tooltip title="开启调试模式">
                  <Button
                    type="text"
                    icon={
                      <BugOutlined
                        style={{ color: debugMode ? "#ff9800" : undefined }}
                      />
                    }
                    onClick={toggleDebugMode}
                    className="mr-2"
                  />
                </Tooltip>
              )}
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                arrow
              >
                <Button type="text" className="flex items-center">
                  <Avatar icon={<UserOutlined />} className="mr-2" />
                  <span className="mr-1">{user?.name || "用户"}</span>
                </Button>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* 任务查询弹窗 */}
      <TaskModal 
        visible={taskModalVisible} 
        onClose={() => setTaskModalVisible(false)} 
      />
    </Layout>
  );
};

export default MainLayout;
