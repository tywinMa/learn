const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'course_code'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  hours: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_visible'
  },
  sources: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '课程媒体资源，JSON数组，包含{type: "image"|"video", url: string}对象',
    get() {
      const rawValue = this.getDataValue('sources');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('sources', value ? JSON.stringify(value) : null);
    }
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'subject_id',
    references: {
      model: 'subjects',
      key: 'id'
    }
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'teacher_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relatedExerciseId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '关联习题ID',
    field: 'related_exercise_id'
  }
}, {
  tableName: 'courses',
  timestamps: true,
  underscored: true
});

module.exports = Course; 