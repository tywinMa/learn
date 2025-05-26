const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: '学生账号，用于登录'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '登录密码'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学生姓名'
  },
  nickname: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '昵称'
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '头像URL'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '手机号'
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
    comment: '性别'
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '出生日期'
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '年级'
  },
  school: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '学校'
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '家长姓名'
  },
  parentPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '家长手机号'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
    comment: '账户状态'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总积分'
  },
  currentLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '当前等级'
  },
  totalStudyTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总学习时间（秒）'
  },
  consecutiveDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '连续学习天数'
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '分配的教师ID，关联User表'
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: '个人设置（推送、主题等）'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注信息'
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (student) => {
      if (student.password) {
        student.password = await bcrypt.hash(student.password, 10);
      }
    },
    beforeUpdate: async (student) => {
      if (student.changed('password')) {
        student.password = await bcrypt.hash(student.password, 10);
      }
    }
  },
  indexes: [
    {
      fields: ['studentId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['phone']
    },
    {
      fields: ['teacherId']
    },
    {
      fields: ['status']
    }
  ]
});

Student.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Student; 