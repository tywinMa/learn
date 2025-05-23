const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// 知识点模型
const KnowledgePoint = sequelize.define(
  "KnowledgePoint",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "知识点标题",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "知识点详细内容，支持HTML格式",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "text",
      comment: "内容类型: text, image, video",
      validate: {
        isIn: [["text", "image", "video"]],
      },
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "媒体文件URL（当type为image或video时使用）",
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "所属学科代码",
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: "难度等级 1-5",
      validate: {
        min: 1,
        max: 5,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "是否启用",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["subject"],
      },
      {
        fields: ["title"],
      },
      {
        fields: ["type"],
      },
    ],
  }
);

module.exports = KnowledgePoint; 