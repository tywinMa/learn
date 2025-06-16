import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { UnitProgress } from '../services/progressService';

interface MasteryIndicatorProps {
  progress: UnitProgress;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

/**
 * 掌握度指示器组件，显示用户对单元的掌握程度
 */
export const MasteryIndicator: React.FC<MasteryIndicatorProps> = ({ 
  progress, 
  color = '#5EC0DE', 
  size = 'medium',
  showDetails = false
}) => {
  // 获取掌握度或默认值0
  const masteryLevel = progress.masteryLevel || 0;
  
  // 根据不同尺寸设置不同的样式
  const containerSize = size === 'small' ? 40 : size === 'medium' ? 60 : 80;
  const borderWidth = size === 'small' ? 2 : size === 'medium' ? 3 : 4;
  const iconSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24;
  const textSize = size === 'small' ? 10 : size === 'medium' ? 12 : 16;
  
  // 根据掌握度选择图标
  const getIcon = () => {
    if (masteryLevel >= 0.8) {
      return { name: 'crown', color: '#FFD700' };
    } else if (masteryLevel >= 0.6) {
      return { name: 'star', color: '#FF9900' };
    } else if (masteryLevel >= 0.4) {
      return { name: 'check-circle', color: '#4CAF50' };
    } else if (masteryLevel > 0) {
      return { name: 'seedling', color: '#27ae60' };
    } else {
      return { name: 'hourglass-start', color: '#95a5a6' };
    }
  };
  
  const icon = getIcon();
  
  // 掌握度百分比文本
  const masteryPercent = Math.round(masteryLevel * 100);
  
  // 掌握度等级描述
  const getMasteryDescription = () => {
    if (masteryLevel >= 0.8) {
      return '掌握';
    } else if (masteryLevel >= 0.6) {
      return '熟练';
    } else if (masteryLevel >= 0.4) {
      return '理解';
    } else if (masteryLevel > 0) {
      return '入门';
    } else {
      return '未学习';
    }
  };
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.circleContainer, 
          { 
            width: containerSize, 
            height: containerSize,
            borderWidth,
            borderColor: color,
            backgroundColor: `${color}20` // 20% 透明度的背景色
          }
        ]}
      >
        <FontAwesome5 name={icon.name} size={iconSize} color={icon.color} solid />
        <Text style={[styles.percentText, { fontSize: textSize }]}>{masteryPercent}%</Text>
      </View>
      
      {showDetails && progress.studyCount !== undefined && progress.practiceCount !== undefined && (
        <View style={styles.detailsContainer}>
          <Text style={styles.levelText}>{getMasteryDescription()}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>学习次数: {progress.studyCount}</Text>
            <Text style={styles.statText}>练习次数: {progress.practiceCount}</Text>
          </View>
          {progress.correctCount !== undefined && progress.incorrectCount !== undefined && (
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                正确率: {progress.correctCount + progress.incorrectCount > 0 
                  ? Math.round((progress.correctCount / (progress.correctCount + progress.incorrectCount)) * 100) 
                  : 0}%
              </Text>
              <Text style={styles.statText}>答题数: {progress.totalAnswerCount || 0}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circleContainer: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontWeight: 'bold',
    marginTop: 2,
  },
  detailsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  levelText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 2,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  }
}); 