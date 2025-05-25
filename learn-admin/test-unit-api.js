// 测试新的unit API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// 获取访问token
async function getAuthToken() {
  console.log('正在获取访问token...');
  const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  const result = await response.json();
  if (result.err_no === 0) {
    console.log('登录成功，获取到token');
    return result.data.token;
  } else {
    throw new Error('登录失败: ' + result.message);
  }
}

// 测试数据
const testUnit = {
  id: 'math-test-1',
  subject: 'math',
  title: '测试大单元',
  description: '这是一个测试的大单元，包含多门数学课程',
  order: 1,
  isPublished: true,
  color: '#1890ff',
  secondaryColor: '#f0f9ff',
  courseIds: [2001, 2002, 2003] // 使用数字类型的课程ID
};

async function testAPI() {
  console.log('开始测试新的Unit API...\n');

  try {
    // 首先获取认证token
    const token = await getAuthToken();
    console.log('---\n');

    // 1. 测试获取所有单元
    console.log('1. 测试获取所有单元');
    let response = await fetch(`${BASE_URL}/api/admin/units`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    let result = await response.json();
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(result, null, 2));
    console.log('---\n');

    // 2. 测试获取学科单元
    console.log('2. 测试获取math学科的单元');
    response = await fetch(`${BASE_URL}/api/admin/units/subject/math`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    result = await response.json();
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(result, null, 2));
    console.log('---\n');

    // 3. 测试创建单元
    console.log('3. 测试创建新单元');
    response = await fetch(`${BASE_URL}/api/admin/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testUnit)
    });
    result = await response.json();
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(result, null, 2));
    console.log('---\n');

    // 4. 测试获取单个单元
    console.log('4. 测试获取单个单元');
    response = await fetch(`${BASE_URL}/api/admin/units/${testUnit.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    result = await response.json();
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(result, null, 2));
    console.log('---\n');

    // 5. 测试更新单元
    console.log('5. 测试更新单元');
    const updateData = {
      title: '更新后的测试大单元',
      description: '这是一个更新后的测试大单元，现在包含更多课程',
      order: 2,
      courseIds: [2001, 2002, 2003, 2004] // 添加更多课程
    };
    response = await fetch(`${BASE_URL}/api/admin/units/${testUnit.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    result = await response.json();
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(result, null, 2));
    console.log('---\n');

    // 6. 测试删除单元
    console.log('6. 测试删除单元');
    response = await fetch(`${BASE_URL}/api/admin/units/${testUnit.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    result = await response.json();
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(result, null, 2));
    console.log('---\n');

    // 7. 测试批量删除学科单元
    console.log('7. 测试批量删除CN学科的所有单元');
    response = await fetch(`${BASE_URL}/api/admin/units/subject/CN`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    result = await response.json();
    console.log('状态:', response.status);
    console.log('响应:', JSON.stringify(result, null, 2));
    console.log('---\n');

    console.log('API测试完成!');

  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
  }
}

// 运行测试
testAPI(); 