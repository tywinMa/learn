const axios = require('axios');

const testExerciseAPI = async () => {
  const baseURL = 'http://localhost:3000';
  
  try {
    // 1. 先测试登录获取token
    console.log('1. 测试登录...');
    const loginResponse = await axios.post(`${baseURL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('登录成功，获取到token:', token ? '是' : '否');
    
    if (!token) {
      console.error('未获取到token');
      return;
    }
    
    // 2. 测试创建习题
    console.log('2. 测试创建习题...');
    const exerciseData = {
      title: '测试习题组',
      description: '这是一个测试习题组',
      subject: 'math',
      content: [
        {
          question: '1 + 1 = ?',
          type: 'choice',
          difficulty: '1',
          options: [
            { content: '1', isCorrect: false },
            { content: '2', isCorrect: true },
            { content: '3', isCorrect: false },
            { content: '4', isCorrect: false }
          ],
          correctAnswer: 1,
          explanation: '1 + 1 等于 2'
        }
      ]
    };
    
    const createResponse = await axios.post(`${baseURL}/api/admin/exercises`, exerciseData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('创建习题成功:', createResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
};

testExerciseAPI(); 