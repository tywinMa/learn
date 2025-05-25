const { User } = require('../../models');
const bcrypt = require('bcrypt');

// 获取当前用户信息
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ 
        err_no: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    res.json({
      err_no: 0,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message,
      data: null
    });
  }
};

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        err_no: 400,
        message: '当前密码和新密码为必填项',
        data: null
      });
    }
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        err_no: 404,
        message: '用户不存在',
        data: null
      });
    }
    
    const isPasswordValid = await user.validatePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        err_no: 401,
        message: '当前密码错误',
        data: null
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ 
      err_no: 0,
      message: '密码修改成功',
      data: null
    });
  } catch (error) {
    res.status(500).json({ 
      err_no: 500,
      message: '服务器错误', 
      error: error.message,
      data: null
    });
  }
};

module.exports = {
  getUserProfile,
  changePassword
}; 