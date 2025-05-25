const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exercise = sequelize.define('Exercise', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  exerciseCode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    field: 'exercise_code',
    comment: '习题唯一编号，格式如E10001'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '习题组标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '习题组描述'
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '所属学科代码，如math, chinese等'
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '习题创建者/作者'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '习题内容数组，JSON格式存储',
    get() {
      const rawValue = this.getDataValue('content');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('content', JSON.stringify(value || []));
    }
  },
  unitId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'unit_id',
    references: {
      model: 'Units',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'course_id',
    references: {
      model: 'Courses',
      key: 'id'
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'exercises',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (exercise) => {
      exercise.exerciseCode = await generateExerciseCode();
    }
  }
});

// 生成习题编号的函数
async function generateExerciseCode() {
  const prefix = 'E';
  
  try {
    const lastExercise = await Exercise.findOne({
      where: {
        exerciseCode: {
          [require('sequelize').Op.like]: `${prefix}%`
        }
      },
      order: [['exerciseCode', 'DESC']]
    });
    
    let nextNumber = 10001; // 起始编号
    
    if (lastExercise && lastExercise.exerciseCode) {
      const lastNumber = parseInt(lastExercise.exerciseCode.replace(prefix, ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    return `${prefix}${nextNumber}`;
  } catch (error) {
    console.error('生成exerciseCode失败:', error);
    // 如果生成失败，使用时间戳作为后备方案
    return `${prefix}${Date.now()}`;
  }
}

module.exports = Exercise; 