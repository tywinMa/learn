const axios = require('axios');

const testUpdateAPI = async () => {
  const baseURL = 'http://localhost:3000';
  
  try {
    // 1. 先登录获取token
    console.log('1. 测试登录...');
    const loginResponse = await axios.post(`${baseURL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('登录成功，获取到token:', token ? '是' : '否');
    
    if (!token) {
      console.error('未获取到token，登录响应:', loginResponse.data);
      return;
    }
    
    // 2. 先获取现有的习题列表
    console.log('2. 获取习题列表...');
    const listResponse = await axios.get(`${baseURL}/api/admin/exercises`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('习题列表响应结构:', typeof listResponse.data, Array.isArray(listResponse.data));
    if (listResponse.data && listResponse.data.length > 0) {
      console.log('第一个习题ID:', listResponse.data[0].id);
      
      // 3. 测试更新第一个习题
      console.log('3. 测试更新习题...');
      const updateData = {
        title: '更新测试标题 - ' + new Date().toLocaleTimeString(),
        description: '这是更新测试'
      };
      
      const updateResponse = await axios.put(`${baseURL}/api/admin/exercises/${listResponse.data[0].id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('更新响应状态:', updateResponse.status);
      console.log('更新响应数据结构:', typeof updateResponse.data);
      console.log('更新响应数据:', JSON.stringify(updateResponse.data, null, 2));
      
    } else {
      console.log('没有找到现有习题，先创建一个...');
      
      // 创建一个习题用于测试
      const createData = {
        title: '测试习题',
        description: '用于更新测试',
        subject: 'math',
        content: [
          {
            question: '测试题目',
            type: 'choice',
            difficulty: '1',
            options: [
              { content: 'A', isCorrect: true },
              { content: 'B', isCorrect: false }
            ]
          }
        ]
      };
      
      const createResponse = await axios.post(`${baseURL}/api/admin/exercises`, createData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('创建响应状态:', createResponse.status);
      console.log('创建响应完整数据:', JSON.stringify(createResponse.data, null, 2));
      console.log('创建响应data字段:', createResponse.data?.data);
      console.log('创建成功，习题ID:', createResponse.data?.data?.id || createResponse.data?.id);
      
      // 现在测试更新
      const updateData = {
        title: '更新测试标题 - ' + new Date().toLocaleTimeString(),
        description: '这是更新测试'
      };
      
      const exerciseId = createResponse.data?.data?.id || createResponse.data?.id;
      console.log('使用习题ID进行更新:', exerciseId);
      
      const updateResponse = await axios.put(`${baseURL}/api/admin/exercises/${exerciseId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('更新响应状态:', updateResponse.status);
      console.log('更新响应数据结构:', typeof updateResponse.data);
      console.log('更新响应数据:', JSON.stringify(updateResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
};

testUpdateAPI(); 