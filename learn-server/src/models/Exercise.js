const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// 练习题模型
const Exercise = sequelize.define(
  "Exercise",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: "练习题ID，如math-001表示数学学科练习题",
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "学科代码，如math、physics等，用于标识所属学科",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "习题标题，用于快速识别和搜索",
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true, // 允许为空，因为不是所有题型都需要选项
    },
    correctAnswer: {
      type: DataTypes.JSON, // 改为JSON类型以支持多种答案格式
      allowNull: false,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true, // 解释可选
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "choice", // 选择题
      // 可能的值: 'choice', 'matching', 'fill_blank', 'application', 'math'
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // 1-5的难度评级
      validate: {
        min: 1,
        max: 5,
      },
    },
    media: {
      type: DataTypes.JSON,
      allowNull: true, // 可选媒体元素(图片、图表等)
    },
    hints: {
      type: DataTypes.JSON,
      allowNull: true, // 可选提示
    },
    knowledgePointIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "关联的知识点ID数组",
      defaultValue: []
    },
    isAI: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "是否为AI生成的习题，true表示AI生成，false表示人工创建"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Exercise;
