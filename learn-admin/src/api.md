# 7. 管理员接口

## 7.1 管理员认证接口

##### 7.1.1 管理员登录

- **URL**: `/api/admin/auth/login`
- **方法**: `POST`
- **Content-Type**: `application/json`
- **参数**:

  | 参数名   | 类型   | 必填 | 描述   |
  | -------- | ------ | ---- | ------ |
  | username | string | 是   | 用户名 |
  | password | string | 是   | 密码   |

- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "登录成功",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "admin",
        "name": "系统管理员",
        "avatar": "https://example.com/avatar.png",
        "roles": [
          {
            "id": 1,
            "name": "超级管理员",
            "code": "admin"
          }
        ]
      }
    }
  }
  ```

##### 7.1.2 获取当前管理员信息

- **URL**: `/api/admin/profile`
- **方法**: `GET`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **响应示例**:
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员",
      "email": "admin@example.com",
      "mobile": "13800138000",
      "avatar": "https://example.com/avatar.png",
      "status": 1,
      "lastLoginTime": "2023-05-01T12:00:00Z",
      "roles": [
        {
          "id": 1,
          "name": "超级管理员",
          "code": "admin"
        }
      ]
    }
  }
  ```

#### 7.2 用户管理接口

##### 7.2.1 获取用户列表

- **URL**: `/api/admin/users`
- **方法**: `GET`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Query 参数**:

  | 参数名   | 类型   | 必填 | 描述                       |
  | -------- | ------ | ---- | -------------------------- |
  | page     | number | 否   | 页码，默认 1               |
  | pageSize | number | 否   | 每页条数，默认 10          |
  | keyword  | string | 否   | 搜索关键词（用户名/姓名）  |
  | status   | number | 否   | 状态筛选（1-正常，0-禁用） |

- **响应示例**:
  ```json
  {
    "status": "success",
    "data": {
      "total": 100,
      "items": [
        {
          "id": 1,
          "username": "admin",
          "name": "系统管理员",
          "email": "admin@example.com",
          "mobile": "13800138000",
          "status": 1,
          "lastLoginTime": "2023-05-01T12:00:00Z",
          "createdAt": "2023-01-01T00:00:00Z",
          "roles": [
            {
              "id": 1,
              "name": "超级管理员",
              "code": "admin"
            }
          ]
        }
      ],
      "page": 1,
      "pageSize": 10
    }
  }
  ```

##### 7.2.2 创建管理员用户

- **URL**: `/api/admin/users`
- **方法**: `POST`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Content-Type**: `application/json`
- **参数**:

  | 参数名   | 类型     | 必填 | 描述                   |
  | -------- | -------- | ---- | ---------------------- |
  | username | string   | 是   | 用户名                 |
  | password | string   | 是   | 密码                   |
  | name     | string   | 是   | 姓名                   |
  | mobile   | string   | 否   | 手机号                 |
  | email    | string   | 否   | 邮箱                   |
  | avatar   | string   | 否   | 头像 URL               |
  | status   | number   | 否   | 状态（1-正常，0-禁用） |
  | roleIds  | number[] | 否   | 角色 ID 数组           |

- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "创建成功",
    "data": {
      "id": 2,
      "username": "teacher",
      "name": "教师账号"
    }
  }
  ```

##### 7.2.3 更新管理员用户

- **URL**: `/api/admin/users/:id`
- **方法**: `PUT`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Content-Type**: `application/json`
- **参数**:

  | 参数名   | 类型     | 必填 | 描述                   |
  | -------- | -------- | ---- | ---------------------- |
  | username | string   | 是   | 用户名                 |
  | name     | string   | 是   | 姓名                   |
  | mobile   | string   | 否   | 手机号                 |
  | email    | string   | 否   | 邮箱                   |
  | avatar   | string   | 否   | 头像 URL               |
  | status   | number   | 否   | 状态（1-正常，0-禁用） |
  | roleIds  | number[] | 否   | 角色 ID 数组           |

- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "更新成功",
    "data": {
      "id": 2
    }
  }
  ```

##### 7.2.4 删除管理员用户

- **URL**: `/api/admin/users/:id`
- **方法**: `DELETE`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "删除成功"
  }
  ```

#### 7.3 角色管理接口

##### 7.3.1 获取角色列表

- **URL**: `/api/admin/roles`
- **方法**: `GET`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Query 参数**:

  | 参数名   | 类型   | 必填 | 描述                       |
  | -------- | ------ | ---- | -------------------------- |
  | page     | number | 否   | 页码，默认 1               |
  | pageSize | number | 否   | 每页条数，默认 10          |
  | keyword  | string | 否   | 搜索关键词（角色名称）     |
  | status   | number | 否   | 状态筛选（1-正常，0-禁用） |

- **响应示例**:
  ```json
  {
    "status": "success",
    "data": {
      "total": 3,
      "items": [
        {
          "id": 1,
          "name": "超级管理员",
          "code": "admin",
          "description": "拥有所有权限的超级管理员",
          "status": 1,
          "isSystem": true,
          "sort": 1,
          "createdAt": "2023-01-01T00:00:00Z",
          "permissions": [
            {
              "id": 1,
              "name": "用户管理",
              "code": "user:list",
              "type": "menu"
            }
          ]
        }
      ],
      "page": 1,
      "pageSize": 10
    }
  }
  ```

##### 7.3.2 获取角色详情

- **URL**: `/api/admin/roles/:id`
- **方法**: `GET`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **响应示例**:
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "name": "超级管理员",
      "code": "admin",
      "description": "拥有所有权限的超级管理员",
      "status": 1,
      "isSystem": true,
      "sort": 1,
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z",
      "permissions": [
        {
          "id": 1,
          "name": "用户管理",
          "code": "user:list",
          "type": "menu",
          "parentId": 0
        }
      ]
    }
  }
  ```

##### 7.3.3 创建角色

- **URL**: `/api/admin/roles`
- **方法**: `POST`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Content-Type**: `application/json`
- **参数**:

  | 参数名        | 类型     | 必填 | 描述                   |
  | ------------- | -------- | ---- | ---------------------- |
  | name          | string   | 是   | 角色名称               |
  | code          | string   | 是   | 角色标识符             |
  | description   | string   | 否   | 角色描述               |
  | status        | number   | 否   | 状态（1-正常，0-禁用） |
  | sort          | number   | 否   | 排序序号               |
  | permissionIds | number[] | 否   | 权限 ID 数组           |

- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "创建成功",
    "data": {
      "id": 4,
      "name": "内容编辑",
      "code": "editor"
    }
  }
  ```

##### 7.3.4 更新角色

- **URL**: `/api/admin/roles/:id`
- **方法**: `PUT`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Content-Type**: `application/json`
- **参数**:

  | 参数名        | 类型     | 必填 | 描述                   |
  | ------------- | -------- | ---- | ---------------------- |
  | name          | string   | 是   | 角色名称               |
  | code          | string   | 是   | 角色标识符             |
  | description   | string   | 否   | 角色描述               |
  | status        | number   | 否   | 状态（1-正常，0-禁用） |
  | sort          | number   | 否   | 排序序号               |
  | permissionIds | number[] | 否   | 权限 ID 数组           |

- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "更新成功",
    "data": {
      "id": 4
    }
  }
  ```

##### 7.3.5 删除角色

- **URL**: `/api/admin/roles/:id`
- **方法**: `DELETE`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "删除成功"
  }
  ```

#### 7.4 权限管理接口

##### 7.4.1 获取权限列表

- **URL**: `/api/admin/permissions`
- **方法**: `GET`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Query 参数**:

  | 参数名   | 类型   | 必填 | 描述                        |
  | -------- | ------ | ---- | --------------------------- |
  | type     | string | 否   | 权限类型（menu/api/button） |
  | parentId | number | 否   | 父权限 ID                   |
  | status   | number | 否   | 状态筛选（1-正常，0-禁用）  |

- **响应示例**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "name": "用户管理",
        "code": "user:list",
        "type": "menu",
        "parentId": 0,
        "path": "/users",
        "method": null,
        "icon": "team",
        "sort": 100,
        "status": 1,
        "description": "用户管理菜单"
      }
    ]
  }
  ```

##### 7.4.2 获取权限树

- **URL**: `/api/admin/permissions/tree`
- **方法**: `GET`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Query 参数**:

  | 参数名 | 类型   | 必填 | 描述                            |
  | ------ | ------ | ---- | ------------------------------- |
  | type   | string | 否   | 权限类型筛选（menu/api/button） |

- **响应示例**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "name": "用户管理",
        "code": "user:list",
        "type": "menu",
        "path": "/users",
        "method": null,
        "icon": "team",
        "sort": 100,
        "status": 1,
        "parentId": 0,
        "children": [
          {
            "id": 2,
            "name": "查看用户",
            "code": "user:view",
            "type": "api",
            "path": "/api/admin/users",
            "method": "GET",
            "sort": 101
          }
        ]
      }
    ]
  }
  ```

##### 7.4.3 创建权限

- **URL**: `/api/admin/permissions`
- **方法**: `POST`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Content-Type**: `application/json`
- **参数**:

  | 参数名      | 类型   | 必填 | 描述                                  |
  | ----------- | ------ | ---- | ------------------------------------- |
  | name        | string | 是   | 权限名称                              |
  | code        | string | 是   | 权限标识符                            |
  | type        | string | 否   | 权限类型（menu/api/button），默认 api |
  | parentId    | number | 否   | 父权限 ID，默认 0                     |
  | path        | string | 否   | 权限路径                              |
  | method      | string | 否   | HTTP 方法（GET/POST/PUT/DELETE）      |
  | icon        | string | 否   | 图标（菜单类型）                      |
  | sort        | number | 否   | 排序序号，默认 0                      |
  | status      | number | 否   | 状态（1-正常，0-禁用），默认 1        |
  | description | string | 否   | 权限描述                              |

- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "创建成功",
    "data": {
      "id": 20,
      "name": "导出数据",
      "code": "data:export"
    }
  }
  ```

##### 7.4.4 更新权限

- **URL**: `/api/admin/permissions/:id`
- **方法**: `PUT`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **Content-Type**: `application/json`
- **参数**:

  | 参数名      | 类型   | 必填 | 描述                             |
  | ----------- | ------ | ---- | -------------------------------- |
  | name        | string | 是   | 权限名称                         |
  | code        | string | 是   | 权限标识符                       |
  | type        | string | 否   | 权限类型（menu/api/button）      |
  | parentId    | number | 否   | 父权限 ID                        |
  | path        | string | 否   | 权限路径                         |
  | method      | string | 否   | HTTP 方法（GET/POST/PUT/DELETE） |
  | icon        | string | 否   | 图标（菜单类型）                 |
  | sort        | number | 否   | 排序序号                         |
  | status      | number | 否   | 状态（1-正常，0-禁用）           |
  | description | string | 否   | 权限描述                         |

- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "更新成功",
    "data": {
      "id": 20
    }
  }
  ```

##### 7.4.5 删除权限

- **URL**: `/api/admin/permissions/:id`
- **方法**: `DELETE`
- **Headers**:
  - `Authorization`: `Bearer ${token}` (JWT 令牌)
- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "删除成功"
  }
  ```

#### 7.5 认证说明

管理员 API 使用 JWT(JSON Web Token)进行认证。登录成功后，服务器返回的 token 需要在后续请求中通过`Authorization`请求头发送，格式为`Bearer ${token}`（注意：Bearer 和 token 之间有一个空格）。token 有效期为 24 小时。

#### 7.6 默认账号

系统初始化后会创建一个默认的超级管理员账号:

- 用户名: admin
- 密码: admin123

# 管理系统使用说明

## 系统概述

本管理系统是学习应用的后台管理平台，提供了用户管理、角色管理、权限管理和教师管理等功能。系统基于 Node.js + Express + Sequelize 开发，采用 JWT 进行身份认证。

## 安装依赖

确保已安装必要的依赖:

```bash
cd server
npm install bcryptjs jsonwebtoken
```

## 初始化管理员数据

系统初次使用需要初始化管理员用户和基础权限数据:

```bash
node src/scripts/initAdminData.js
```

这将创建以下数据:

- 默认管理员账号: admin (密码: admin123)
- 基础角色: 超级管理员、教师、内容管理员
- 系统权限集合

## API 接口说明

所有管理系统 API 接口统一使用`/api/admin`前缀。

### 认证接口

#### 登录

- 路径: POST `/api/admin/auth/login`
- 请求体:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- 返回示例:
  ```json
  {
    "status": "success",
    "message": "登录成功",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "admin",
        "name": "系统管理员",
        "avatar": null,
        "roles": [
          {
            "id": 1,
            "name": "超级管理员",
            "code": "admin"
          }
        ]
      }
    }
  }
  ```

#### 获取当前用户信息

- 路径: GET `/api/admin/profile`
- 请求头: `Authorization: Bearer <token>`
- 返回示例:
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "username": "admin",
      "name": "系统管理员",
      "roles": ["admin"]
    }
  }
  ```

### 用户管理接口

#### 获取用户列表

- 路径: GET `/api/admin/users?page=1&pageSize=10&keyword=&status=&roleId=`
- 请求头: `Authorization: Bearer <token>`

#### 获取用户详情

- 路径: GET `/api/admin/users/:id`
- 请求头: `Authorization: Bearer <token>`

#### 创建用户

- 路径: POST `/api/admin/users`
- 请求头: `Authorization: Bearer <token>`
- 请求体:
  ```json
  {
    "username": "teacher1",
    "password": "123456",
    "name": "张老师",
    "mobile": "13800138000",
    "email": "teacher@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "status": 1,
    "roleIds": [2]
  }
  ```

#### 更新用户

- 路径: PUT `/api/admin/users/:id`
- 请求头: `Authorization: Bearer <token>`
- 请求体: (同创建用户，但不需要 password 字段)

#### 重置密码

- 路径: POST `/api/admin/users/:id/reset-password`
- 请求头: `Authorization: Bearer <token>`
- 请求体:
  ```json
  {
    "newPassword": "new123456"
  }
  ```

#### 删除用户

- 路径: DELETE `/api/admin/users/:id`
- 请求头: `Authorization: Bearer <token>`

### 角色管理接口

#### 获取角色列表

- 路径: GET `/api/admin/roles?page=1&pageSize=10&keyword=&status=`
- 请求头: `Authorization: Bearer <token>`

#### 获取角色详情

- 路径: GET `/api/admin/roles/:id`
- 请求头: `Authorization: Bearer <token>`

#### 创建角色

- 路径: POST `/api/admin/roles`
- 请求头: `Authorization: Bearer <token>`
- 请求体:
  ```json
  {
    "name": "教学主管",
    "code": "teaching_director",
    "description": "教学部门主管",
    "status": 1,
    "sort": 3,
    "permissionIds": [1, 2, 3, 16, 17, 18, 19, 20]
  }
  ```

#### 更新角色

- 路径: PUT `/api/admin/roles/:id`
- 请求头: `Authorization: Bearer <token>`
- 请求体: (同创建角色)

#### 删除角色

- 路径: DELETE `/api/admin/roles/:id`
- 请求头: `Authorization: Bearer <token>`

### 权限管理接口

#### 获取权限列表

- 路径: GET `/api/admin/permissions?type=&parentId=&status=`
- 请求头: `Authorization: Bearer <token>`

#### 获取权限树

- 路径: GET `/api/admin/permissions/tree?type=`
- 请求头: `Authorization: Bearer <token>`

### 课程管理接口

#### 获取课程列表

- 路径: GET `/api/admin/courses?page=1&pageSize=10&keyword=&subjectId=&stage=&teacherId=`
- 请求头: `Authorization: Bearer <token>`
- 功能: 支持分页、关键词搜索和筛选
- 返回示例:
  ```json
  {
    "status": "success",
    "data": {
      "total": 100,
      "items": [
        {
          "id": 1,
          "courseNumber": "10001",
          "name": "高中语文现代文阅读",
          "description": "掌握高中语文现代文阅读和写作的核心技巧",
          "stage": "高中",
          "thumbnail": "https://example.com/course1.jpg",
          "studentCount": 45,
          "subject": {
            "id": 1,
            "name": "语文"
          },
          "teacher": {
            "id": 1,
            "name": "王老师"
          },
          "createdAt": "2023-01-15T00:00:00Z"
        }
      ],
      "page": 1,
      "pageSize": 10
    }
  }
  ```

#### 获取课程详情

- 路径: GET `/api/admin/courses/:id`
- 请求头: `Authorization: Bearer <token>`
- 功能: 获取单个课程的详细信息
- 返回示例:
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "courseNumber": "10001",
      "name": "高中语文现代文阅读",
      "description": "掌握高中语文现代文阅读和写作的核心技巧",
      "stage": "高中",
      "thumbnail": "https://example.com/course1.jpg",
      "studentCount": 45,
      "subjectId": 1,
      "teacherId": 1,
      "subject": {
        "id": 1,
        "name": "语文"
      },
      "teacher": {
        "id": 1,
        "name": "王老师"
      },
      "createdAt": "2023-01-15T00:00:00Z",
      "updatedAt": "2023-01-20T00:00:00Z"
    }
  }
  ```

#### 创建课程

- 路径: POST `/api/admin/courses`
- 请求头: `Authorization: Bearer <token>`
- 请求体:
  ```json
  {
    "name": "高中数学函数与导数",
    "description": "深入理解高中数学函数与导数的概念与应用",
    "stage": "高中",
    "thumbnail": "https://example.com/course2.jpg",
    "subjectId": 2,
    "teacherId": 2
  }
  ```
- 功能: 创建新课程，自动生成课程编号
- 返回示例:
  ```json
  {
    "status": "success",
    "message": "创建成功",
    "data": {
      "id": 2,
      "courseNumber": "10002",
      "name": "高中数学函数与导数"
    }
  }
  ```

#### 更新课程

- 路径: PUT `/api/admin/courses/:id`
- 请求头: `Authorization: Bearer <token>`
- 请求体:
  ```json
  {
    "name": "高中数学函数与导数",
    "description": "更新后的课程描述",
    "stage": "高中",
    "thumbnail": "https://example.com/course2_updated.jpg",
    "subjectId": 2,
    "teacherId": 3
  }
  ```
- 返回示例:
  ```json
  {
    "status": "success",
    "message": "更新成功",
    "data": {
      "id": 2
    }
  }
  ```

#### 删除课程

- 路径: DELETE `/api/admin/courses/:id`
- 请求头: `Authorization: Bearer <token>`
- 返回示例:
  ```json
  {
    "status": "success",
    "message": "删除成功"
  }
  ```

#### 获取学段列表

- 路径: GET `/api/admin/courses/stages/all`
- 请求头: `Authorization: Bearer <token>`
- 功能: 获取所有可用的学段
- 返回示例:
  ```json
  {
    "status": "success",
    "data": [
      { "value": "小学", "label": "小学" },
      { "value": "初中", "label": "初中" },
      { "value": "高中", "label": "高中" },
      { "value": "大学", "label": "大学" },
      { "value": "研究生", "label": "研究生" },
      { "value": "全部", "label": "全部学段" }
    ]
  }
  ```

## 角色与权限说明

系统默认包含三种角色:

1. **超级管理员(admin)**: 拥有系统所有操作权限
2. **教师(teacher)**: 管理学生、课程的权限
3. **内容管理员(content_manager)**: 管理学习内容和试题的权限

## 安全说明

1. 用户密码使用 bcrypt 加密存储
2. 接口认证使用 JWT 令牌，有效期为 24 小时
3. 敏感操作需要相应权限

## 开发说明

管理系统相关代码主要位于以下目录:

- `server/src/models/admin/`: 管理系统数据模型
- `server/src/routes/admin/`: 管理系统 API 路由
- `server/src/middleware/adminAuth.js`: 认证与权限中间件
