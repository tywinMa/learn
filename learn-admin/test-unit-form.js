// 测试单元表单数据加载
console.log('=== 测试单元表单数据加载 ===');

// 模拟获取学科数据
const mockSubjects = [
  { id: '1', name: '语文', code: 'chinese', color: '#1677ff' },
  { id: '2', name: '数学', code: 'math', color: '#52c41a' },
  { id: '3', name: '英语', code: 'english', color: '#722ed1' },
  { id: '4', name: '物理', code: 'physics', color: '#eb2f96' },
  { id: '5', name: '化学', code: 'chemistry', color: '#fa8c16' }
];

// 模拟获取课程数据（数学学科）
const mockMathCourses = [
  {
    id: '2001',
    title: '函数与导数',
    instructor: '张老师',
    category: '数学',
    students: 48,
    createdAt: '2024-01-15',
    description: '掌握函数概念和导数的运算与应用',
    courseCode: 'MATH2001',
  },
  {
    id: '2002',
    title: '立体几何',
    instructor: '李老师',
    category: '数学',
    students: 42,
    createdAt: '2024-01-16',
    description: '研究空间几何体的性质和计算',
    courseCode: 'MATH2002',
  },
  {
    id: '2003',
    title: '概率与统计',
    instructor: '王老师',
    category: '数学',
    students: 45,
    createdAt: '2024-01-17',
    description: '学习概率论基础和统计方法',
    courseCode: 'MATH2003',
  }
];

// 模拟单元数据
const mockUnit = {
  id: 'math-test-1',
  subject: 'math',
  title: '数学基础大单元',
  description: '包含函数、几何、统计等基础内容',
  order: 1,
  isPublished: true,
  color: '#52c41a',
  secondaryColor: '#f6ffed',
  courseIds: [2001, 2002, 2003] // 数字类型的ID
};

console.log('1. 学科数据:', mockSubjects);
console.log('2. 数学课程数据:', mockMathCourses);
console.log('3. 单元数据:', mockUnit);

// 测试课程ID匹配逻辑
console.log('\n=== 测试课程ID匹配 ===');
const selectedCourseIds = mockUnit.courseIds;
console.log('选中的课程IDs:', selectedCourseIds);

const matchedCourses = mockMathCourses.filter(course => 
  selectedCourseIds.includes(parseInt(course.id))
);
console.log('匹配到的课程:', matchedCourses.map(c => ({ id: c.id, title: c.title })));

// 验证数据类型
console.log('\n=== 数据类型验证 ===');
console.log('courseIds类型:', typeof mockUnit.courseIds[0]);
console.log('course.id类型:', typeof mockMathCourses[0].id);
console.log('parseInt后类型:', typeof parseInt(mockMathCourses[0].id));

console.log('\n=== 测试完成 ==='); 