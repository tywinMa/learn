// 测试课程数据加载
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testCourseAPI() {
  console.log('开始测试课程API...\n');

  try {
    // 1. 测试获取学科列表
    console.log('1. 测试获取学科列表');
    let response = await fetch(`${BASE_URL}/api/admin/subjects`);
    let result = await response.json();
    console.log('状态:', response.status);
    console.log('学科数据:', JSON.stringify(result, null, 2));
    console.log('---\n');

    if (result.err_no === 0 && result.data && result.data.length > 0) {
      const firstSubject = result.data[0];
      console.log('2. 测试获取第一个学科的课程:', firstSubject.code);
      
      response = await fetch(`${BASE_URL}/api/admin/courses/subject/${firstSubject.code}`);
      result = await response.json();
      console.log('状态:', response.status);
      console.log('课程数据:', JSON.stringify(result, null, 2));
      console.log('---\n');
    }

    // 3. 测试获取所有课程
    console.log('3. 测试获取所有课程');
    response = await fetch(`${BASE_URL}/api/admin/courses`);
    result = await response.json();
    console.log('状态:', response.status);
    console.log('所有课程数据:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
  }
}

// 运行测试
testCourseAPI(); 