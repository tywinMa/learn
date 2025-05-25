const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 运行迁移的主函数
async function run() {
  try {
    console.log('开始修改exercises表的course_id字段约束...');
    
    // SQLite不支持直接修改列约束，需要重建表
    await sequelize.transaction(async (t) => {
      // 1. 创建临时表
      await sequelize.getQueryInterface().createTable('exercises_temp', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        question: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        type: {
          type: DataTypes.ENUM('choice', 'application', 'fill_blank', 'matching'),
          allowNull: false,
          defaultValue: 'choice'
        },
        options: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        answer: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        difficulty: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'medium'
        },
        explanation: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        unit_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'Units',
            key: 'id'
          }
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: true, // 改为允许NULL
          references: {
            model: 'Courses',
            key: 'id'
          }
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        media: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        hints: {
          type: DataTypes.TEXT,
          allowNull: true
        }
      }, { transaction: t });
      
      // 2. 复制数据
      await sequelize.query(`
        INSERT INTO exercises_temp (
          id, question, type, options, answer, difficulty, explanation, 
          unit_id, course_id, created_at, updated_at, media, hints
        ) 
        SELECT 
          id, question, type, options, answer, difficulty, explanation, 
          unit_id, course_id, created_at, updated_at, media, hints
        FROM exercises
      `, { transaction: t });
      
      // 3. 删除原表
      await sequelize.getQueryInterface().dropTable('exercises', { transaction: t });
      
      // 4. 重命名临时表
      await sequelize.getQueryInterface().renameTable('exercises_temp', 'exercises', { transaction: t });
      
      console.log('exercises表的course_id字段已修改为允许NULL');
    });
    
  } catch (error) {
    console.error('修改course_id字段约束失败:', error);
    throw error;
  }
}

module.exports = { run }; 