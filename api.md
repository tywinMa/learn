# Learn-Admin 后台管理系统接口文档

## 目录
- [认证接口](#认证接口)
- [学科管理](#学科管理)
- [课程管理](#课程管理)
- [单元管理](#单元管理)
- [习题管理](#习题管理)
- [习题组管理](#习题组管理)
- [知识点管理](#知识点管理)
- [学生管理](#学生管理)
- [用户管理](#用户管理)
- [文件上传](#文件上传)
- [JSON 用例](#json-用例)

## 基础信息

### 接口地址
- 基础URL: `http://localhost:3000/api/admin`
- 认证方式: Bearer Token
- 响应格式: JSON

### 通用响应格式
```json
{
  "err_no": 0,      // 错误码，0表示成功
  "message": "",    // 响应信息
  "data": {}        // 响应数据
}
```

### 权限等级
- `student`: 学生
- `teacher`: 教师  
- `admin`: 管理员
- `superadmin`: 超级管理员

---

## 认证接口

### POST /auth/login
**说明**: 管理员登录  
**权限**: 无需认证  
**请求参数**:
```json
{
  "username": "string",  // 用户名，必填
  "password": "string"   // 密码，必填
}
```

**响应字段**:
- `token`: JWT认证令牌
- `user`: 用户信息对象
  - `id`: 用户ID
  - `username`: 用户名
  - `name`: 姓名
  - `role`: 角色

### POST /auth/logout
**说明**: 管理员登出  
**权限**: 需要认证  

---

## 学科管理

### GET /subjects
**说明**: 获取学科列表  
**权限**: 需要认证  

**响应字段**:
- `id`: 学科ID
- `name`: 学科名称
- `code`: 学科代码（如math、physics）
- `description`: 学科描述
- `color`: 学科主题颜色（十六进制）
- `icon`: 学科图标
- `order`: 显示顺序

### GET /subjects/:id
**说明**: 获取学科详情  
**权限**: 需要认证  

### POST /subjects
**说明**: 创建学科  
**权限**: admin、superadmin  
**请求参数**:
```json
{
  "name": "string",        // 学科名称，必填
  "code": "string",        // 学科代码，选填
  "description": "string", // 学科描述，选填
  "color": "string"        // 主题颜色，选填
}
```

### PUT /subjects/:id
**说明**: 更新学科  
**权限**: admin、superadmin  

### DELETE /subjects/:id
**说明**: 删除学科  
**权限**: admin、superadmin  

---

## 课程管理

### GET /courses
**说明**: 获取课程列表  
**权限**: 需要认证  

**响应字段**:
- `id`: 课程ID
- `title`: 课程标题
- `description`: 课程描述
- `subject`: 所属学科代码
- `courseCode`: 课程编号
- `instructor`: 讲师
- `exerciseGroupIds`: 习题组ID数组
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

### GET /courses/subject/:subjectCode
**说明**: 获取指定学科的课程列表  
**权限**: 需要认证  

### GET /courses/:id
**说明**: 获取课程详情  
**权限**: 需要认证  

### POST /courses
**说明**: 创建课程  
**权限**: admin、superadmin  
**请求参数**:
```json
{
  "title": "string",           // 课程标题，必填
  "description": "string",     // 课程描述，选填
  "subject": "string",         // 学科代码，必填
  "courseCode": "string",      // 课程编号，选填
  "instructor": "string",      // 讲师，选填
  "exerciseGroupIds": []       // 习题组ID数组，选填
}
```

### PUT /courses/:id
**说明**: 更新课程  
**权限**: admin、superadmin  

### DELETE /courses/:id
**说明**: 删除课程  
**权限**: admin、superadmin  

---

## 单元管理

### GET /units
**说明**: 获取所有单元  
**权限**: 需要认证  

**响应字段**:
- `id`: 单元ID
- `subject`: 所属学科代码
- `title`: 单元标题
- `description`: 单元描述
- `order`: 显示顺序
- `isPublished`: 是否发布
- `color`: 主要颜色
- `secondaryColor`: 次要颜色
- `courseIds`: 关联课程ID数组

### GET /units/subject/:subject
**说明**: 获取指定学科的单元列表  
**权限**: 需要认证  

### GET /units/:id
**说明**: 获取单元详情  
**权限**: 需要认证  

### POST /units
**说明**: 创建单元  
**权限**: teacher、admin、superadmin  
**请求参数**:
```json
{
  "id": "string",              // 单元ID，必填
  "subject": "string",         // 学科代码，必填
  "title": "string",           // 单元标题，必填
  "description": "string",     // 单元描述，选填
  "order": 1,                  // 显示顺序，必填
  "isPublished": true,         // 是否发布，必填
  "color": "string",           // 主要颜色，选填
  "secondaryColor": "string",  // 次要颜色，选填
  "courseIds": []              // 关联课程ID数组，选填
}
```

### PUT /units/:id
**说明**: 更新单元  
**权限**: teacher、admin、superadmin  

### DELETE /units/:id
**说明**: 删除单元  
**权限**: teacher、admin、superadmin  

### DELETE /units/subject/:subject
**说明**: 批量删除指定学科的所有单元  
**权限**: teacher、admin、superadmin  

---

## 习题管理

### GET /exercises
**说明**: 获取所有习题  
**权限**: 需要认证  

**响应字段**:
- `id`: 习题ID
- `subject`: 学科代码
- `title`: 习题标题
- `type`: 题目类型（choice、fill_blank、application、matching）
- `difficulty`: 难度等级（1-简单，2-中等，3-困难）
- `question`: 题目内容
- `options`: 选项（选择题）
- `correctAnswer`: 正确答案
- `explanation`: 解析
- `knowledgePointIds`: 知识点ID数组

### GET /exercises/course/:courseId
**说明**: 获取指定课程的习题  
**权限**: 需要认证  

### GET /exercises/subject/:subjectCode
**说明**: 获取指定学科的习题  
**权限**: 需要认证  

### GET /exercises/unit/:unitId
**说明**: 获取指定单元的习题  
**权限**: 需要认证  

### GET /exercises/:id
**说明**: 获取习题详情  
**权限**: 需要认证  

### POST /exercises
**说明**: 创建习题  
**权限**: teacher、admin、superadmin  
**请求参数**:
```json
{
  "subject": "string",         // 学科代码，必填
  "title": "string",           // 习题标题，必填
  "type": "string",            // 题目类型，必填
  "difficulty": 1,             // 难度等级，必填
  "question": "string",        // 题目内容，必填
  "options": [],               // 选项数组（选择题），选填
  "correctAnswer": "",         // 正确答案，必填
  "explanation": "string",     // 解析，选填
  "knowledgePointIds": []      // 知识点ID数组，选填
}
```

### PUT /exercises/:id
**说明**: 更新习题  
**权限**: teacher、admin、superadmin  

### DELETE /exercises/:id
**说明**: 删除习题  
**权限**: teacher、admin、superadmin  

---

## 习题组管理

### GET /exerciseGroups
**说明**: 获取习题组列表  
**权限**: 需要认证  

**响应字段**:
- `id`: 习题组ID
- `name`: 习题组名称
- `description`: 描述
- `subject`: 学科代码
- `exerciseIds`: 习题ID数组
- `isActive`: 是否激活
- `order`: 排序

### GET /exerciseGroups/subject/:subjectCode
**说明**: 根据学科获取习题组列表  
**权限**: 需要认证  

### GET /exerciseGroups/:id
**说明**: 获取习题组详情  
**权限**: 需要认证  

### POST /exerciseGroups
**说明**: 创建习题组  
**权限**: 需要认证  

### PUT /exerciseGroups/:id
**说明**: 更新习题组  
**权限**: 需要认证  

### DELETE /exerciseGroups/:id
**说明**: 删除习题组  
**权限**: 需要认证  

---

## 知识点管理

### GET /knowledgePoints
**说明**: 获取知识点列表  
**权限**: 需要认证  

**响应字段**:
- `id`: 知识点ID
- `name`: 知识点名称
- `description`: 描述
- `subject`: 学科代码
- `parentId`: 父知识点ID
- `level`: 层级

### GET /knowledgePoints/:id
**说明**: 获取知识点详情  
**权限**: 需要认证  

### POST /knowledgePoints
**说明**: 创建知识点  
**权限**: teacher、admin、superadmin  

### PUT /knowledgePoints/:id
**说明**: 更新知识点  
**权限**: teacher、admin、superadmin  

### DELETE /knowledgePoints/:id
**说明**: 删除知识点  
**权限**: admin、superadmin  

---

## 学生管理

### GET /students
**说明**: 获取学生列表  
**权限**: 需要认证  

**响应字段**:
- `id`: 学生ID
- `studentId`: 学号
- `name`: 姓名
- `email`: 邮箱
- `teacherId`: 指导教师ID
- `createdAt`: 创建时间

### GET /students/:id
**说明**: 获取学生详情  
**权限**: 需要认证  

### POST /students
**说明**: 创建学生  
**权限**: admin、teacher、superadmin  

### PUT /students/:id
**说明**: 更新学生信息  
**权限**: admin、teacher、superadmin  

### DELETE /students/:id
**说明**: 删除学生  
**权限**: admin、superadmin  

### GET /students/:id/progress
**说明**: 获取学生学习进度  
**权限**: 需要认证  

### GET /students/:id/wrong-exercises
**说明**: 获取学生错题记录  
**权限**: 需要认证  

### PUT /students/:id/assign-teacher
**说明**: 分配教师给学生  
**权限**: admin、superadmin  

### POST /students/batch-import
**说明**: 批量导入学生  
**权限**: admin、superadmin  

---

## 用户管理

### GET /users/profile
**说明**: 获取当前用户信息  
**权限**: 需要认证  

### PUT /users/password
**说明**: 修改密码  
**权限**: 需要认证  

### GET /users
**说明**: 获取所有学生（用户列表）  
**权限**: 需要认证  

### GET /users/:studentId/progress-overview
**说明**: 获取学生进度概览  
**权限**: 需要认证  
**响应字段**:
- `student`: 学生基本信息
- `courseProgress`: 课程进度数组
  - `courseId`: 课程ID
  - `courseName`: 课程名称
  - `subjectName`: 学科名称
  - `totalUnits`: 总单元数
  - `completedUnits`: 已完成单元数
  - `totalStars`: 总星数
  - `maxStars`: 最大星数
  - `totalTimeSpent`: 总学习时间
  - `masteryLevel`: 掌握程度
  - `progressPercentage`: 进度百分比

### GET /users/:studentId/wrong-exercises
**说明**: 获取学生错题分析  
**权限**: 需要认证  

### GET /users/:studentId/time-analysis
**说明**: 获取学生学习时间分析  
**权限**: 需要认证  

---

## 文件上传

### POST /upload/image
**说明**: 通用图片上传  
**权限**: admin、superadmin  
**请求**: multipart/form-data，字段名为 `image`

### POST /upload/video
**说明**: 通用视频上传  
**权限**: admin、superadmin  
**请求**: multipart/form-data，字段名为 `video`

### POST /upload/course/cover
**说明**: 课程封面图片上传  
**权限**: admin、superadmin  
**请求**: multipart/form-data，字段名为 `cover`

### POST /upload/course/video
**说明**: 课程视频上传  
**权限**: admin、superadmin  
**请求**: multipart/form-data，字段名为 `video`

---

## JSON 用例

### 1. 登录接口用例
```json
// 请求 POST /api/admin/auth/login
{
  "username": "admin",
  "password": "123456"
}

// 响应
{
  "err_no": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "role": "admin"
    }
  }
}
```

### 2. 学科管理用例
```json
// 创建学科 POST /api/admin/subjects
{
  "name": "数学",
  "code": "math",
  "description": "数学学科，包括代数、几何、统计等",
  "color": "#58CC02"
}

// 响应
{
  "err_no": 0,
  "message": "学科创建成功",
  "data": {
    "id": 1,
    "name": "数学",
    "code": "math",
    "description": "数学学科，包括代数、几何、统计等",
    "color": "#58CC02",
    "icon": null,
    "order": 1,
    "createdAt": "2025-05-29T02:23:54.646Z",
    "updatedAt": "2025-05-29T02:23:54.646Z"
  }
}

// 获取学科列表 GET /api/admin/subjects
{
  "err_no": 0,
  "data": [
    {
      "id": 1,
      "name": "数学",
      "code": "math",
      "description": "数学学科，包括代数、几何、统计等",
      "color": "#58CC02"
    },
    {
      "id": 2,
      "name": "物理",
      "code": "physics",
      "description": "物理学科，包括力学、电磁学等",
      "color": "#FF4B4B"
    }
  ]
}
```

### 3. 课程管理用例
```json
// 创建课程 POST /api/admin/courses
{
  "title": "初等代数",
  "description": "学习基础代数运算和方程求解",
  "subject": "math",
  "courseCode": "MATH101",
  "instructor": "张老师",
  "exerciseGroupIds": ["group1", "group2"]
}

// 响应
{
  "err_no": 0,
  "message": "课程创建成功",
  "data": {
    "id": "course_1",
    "title": "初等代数",
    "description": "学习基础代数运算和方程求解",
    "subject": "math",
    "courseCode": "MATH101",
    "instructor": "张老师",
    "exerciseGroupIds": ["group1", "group2"],
    "createdAt": "2025-05-29T02:30:00.000Z",
    "updatedAt": "2025-05-29T02:30:00.000Z"
  }
}
```

### 4. 单元管理用例
```json
// 创建单元 POST /api/admin/units
{
  "id": "math-unit-1",
  "subject": "math",
  "title": "基础运算",
  "description": "学习加减乘除基本运算",
  "order": 1,
  "isPublished": true,
  "color": "#58CC02",
  "secondaryColor": "#f0f9ff",
  "courseIds": ["course_1", "course_2"]
}

// 响应
{
  "err_no": 0,
  "message": "单元创建成功",
  "data": {
    "id": "math-unit-1",
    "subject": "math",
    "title": "基础运算",
    "description": "学习加减乘除基本运算",
    "order": 1,
    "isPublished": true,
    "color": "#58CC02",
    "secondaryColor": "#f0f9ff",
    "courseIds": ["course_1", "course_2"],
    "createdAt": "2025-05-29T02:35:00.000Z",
    "updatedAt": "2025-05-29T02:35:00.000Z"
  }
}
```

### 5. 习题管理用例
```json
// 创建选择题 POST /api/admin/exercises
{
  "subject": "math",
  "title": "加法运算",
  "type": "choice",
  "difficulty": 1,
  "question": "计算：2 + 3 = ?",
  "options": [
    {"text": "4", "isCorrect": false},
    {"text": "5", "isCorrect": true},
    {"text": "6", "isCorrect": false},
    {"text": "7", "isCorrect": false}
  ],
  "correctAnswer": 1,
  "explanation": "2加3等于5",
  "knowledgePointIds": ["kp_1", "kp_2"]
}

// 响应
{
  "err_no": 0,
  "message": "习题创建成功",
  "data": {
    "id": "exercise_1",
    "subject": "math",
    "title": "加法运算",
    "type": "choice",
    "difficulty": 1,
    "question": "计算：2 + 3 = ?",
    "options": [
      {"text": "4", "isCorrect": false},
      {"text": "5", "isCorrect": true},
      {"text": "6", "isCorrect": false},
      {"text": "7", "isCorrect": false}
    ],
    "correctAnswer": 1,
    "explanation": "2加3等于5",
    "knowledgePointIds": ["kp_1", "kp_2"],
    "createdAt": "2025-05-29T02:40:00.000Z",
    "updatedAt": "2025-05-29T02:40:00.000Z"
  }
}
```

### 6. 学生进度查询用例
```json
// 获取学生进度概览 GET /api/admin/users/1/progress-overview
{
  "student": {
    "id": 1,
    "studentId": "STU001",
    "name": "张三",
    "email": "zhangsan@example.com",
    "teacher": {
      "id": 1,
      "name": "李老师",
      "email": "teacher@example.com"
    }
  },
  "courseProgress": [
    {
      "courseId": "course_1",
      "courseName": "初等代数",
      "subjectName": "数学",
      "totalUnits": 10,
      "completedUnits": 7,
      "totalStars": 18,
      "maxStars": 30,
      "totalTimeSpent": 3600,
      "masteryLevel": 0.85,
      "progressPercentage": 70,
      "units": [
        {
          "unitId": "unit_1",
          "unitName": "基础运算",
          "completed": true,
          "stars": 3,
          "masteryLevel": 0.9,
          "totalTimeSpent": 600,
          "correctCount": 15,
          "incorrectCount": 2
        }
      ]
    }
  ]
}
```

### 7. 错误响应用例
```json
// 认证失败
{
  "err_no": 401,
  "message": "认证失败，请重新登录",
  "data": null
}

// 权限不足
{
  "err_no": 403,
  "message": "权限不足",
  "data": null
}

// 资源不存在
{
  "err_no": 404,
  "message": "学科不存在",
  "data": null
}

// 服务器错误
{
  "err_no": 500,
  "message": "服务器错误",
  "error": "具体错误信息",
  "data": null
}
```