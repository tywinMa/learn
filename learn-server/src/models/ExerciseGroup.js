const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 习题组模型
const ExerciseGroup = sequelize.define('ExerciseGroup', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    comment: '习题组ID'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '习题组名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '习题组描述'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '学科代码，如math、physics等，用于标识所属学科'
  },
  exerciseIds: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '关联的习题ID数组'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否启用'
  }
}, {
  timestamps: true,
  comment: '习题组表，用于批量管理习题',
});

module.exports = ExerciseGroup; 