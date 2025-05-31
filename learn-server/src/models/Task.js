const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// 任务模型
const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: "任务ID",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "任务类型：ai_generate_exercise_group等",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "任务标题",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "任务描述",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
      comment: "任务状态：pending(等待中)、running(运行中)、success(成功)、failed(失败)",
    },
    params: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "任务参数",
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "任务结果",
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "错误信息",
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "开始时间",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "结束时间",
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "创建者",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

module.exports = Task; 