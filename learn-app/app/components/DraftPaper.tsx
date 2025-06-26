import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  id: string;
  pathData: string;
  color: string;
  strokeWidth: number;
}

interface DraftPaperProps {
  visible: boolean;
  onClose: () => void;
  width?: number;
  height?: number;
  currentExercise?: any; // 当前题目数据
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const DraftPaper: React.FC<DraftPaperProps> = ({
  visible,
  onClose,
  width = screenWidth,
  height = screenHeight - 140, // 为底部操作按钮留出空间
  currentExercise,
}) => {
  // 绘画相关状态
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isViewingExercise, setIsViewingExercise] = useState(false);
  
  // 草稿存储键
  const getDraftKey = useCallback(() => {
    if (currentExercise?.id) {
      return `draft_${currentExercise.id}`;
    }
    return null;
  }, [currentExercise]);
  
  // 变换状态
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastScale = useSharedValue(1);
  
  // 当前绘画路径的临时存储
  const currentPathRef = useRef<Point[]>([]);
  
  // 生成SVG路径字符串
  const generatePathData = useCallback((points: Point[]): string => {
    if (points.length === 0) return '';
    
    let pathData = `M${points[0].x},${points[0].y}`;
    
    if (points.length === 1) {
      // 单点，画一个小圆点
      pathData += ` L${points[0].x + 0.1},${points[0].y}`;
    } else {
      // 多点，使用贝塞尔曲线平滑连接
      for (let i = 1; i < points.length; i++) {
        const currentPoint = points[i];
        const previousPoint = points[i - 1];
        
        if (i === 1) {
          pathData += ` L${currentPoint.x},${currentPoint.y}`;
        } else {
          // 使用二次贝塞尔曲线
          const controlX = (previousPoint.x + currentPoint.x) / 2;
          const controlY = (previousPoint.y + currentPoint.y) / 2;
          pathData += ` Q${previousPoint.x},${previousPoint.y} ${controlX},${controlY}`;
        }
      }
    }
    
    return pathData;
  }, []);
  
  // 保存草稿到存储
  const saveDraft = useCallback(async (pathsToSave: DrawingPath[]) => {
    const draftKey = getDraftKey();
    if (draftKey) {
      try {
        if (pathsToSave.length > 0) {
          const draftData = {
            paths: pathsToSave,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(draftKey, JSON.stringify(draftData));
          console.log(`草稿已保存，路径数量: ${pathsToSave.length}`);
        } else {
          // 如果没有路径，删除存储的草稿
          await AsyncStorage.removeItem(draftKey);
          console.log('草稿已清除');
        }
      } catch (error) {
        console.error('保存草稿失败:', error);
      }
    }
  }, [getDraftKey]);
  
  // 加载草稿
  const loadDraft = useCallback(async () => {
    const draftKey = getDraftKey();
    if (draftKey) {
      try {
        const draftJson = await AsyncStorage.getItem(draftKey);
        console.log(`尝试加载草稿，键: ${draftKey}, 数据: ${draftJson ? '有数据' : '无数据'}`);
        if (draftJson) {
          const draftData = JSON.parse(draftJson);
          if (draftData.paths && Array.isArray(draftData.paths)) {
            console.log(`加载草稿成功，路径数量: ${draftData.paths.length}`);
            setPaths(draftData.paths);
          } else {
            console.log('草稿数据格式不正确');
          }
        } else {
          console.log('没有找到草稿数据');
          setPaths([]);
        }
      } catch (error) {
        console.error('加载草稿失败:', error);
      }
    }
  }, [getDraftKey]);
  
  // 添加新路径
  const addPath = useCallback((points: Point[]) => {
    if (points.length === 0) return;
    
    const pathData = generatePathData(points);
    const newPath: DrawingPath = {
      id: Date.now().toString(),
      pathData,
      color: '#FFFFFF',
      strokeWidth: 2,
    };
    
    setPaths(prev => {
      const newPaths = [...prev, newPath];
      // 自动保存草稿
      saveDraft(newPaths);
      return newPaths;
    });
  }, [generatePathData, saveDraft]);
  
  // 单指绘画手势
  const drawGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart((event) => {
      runOnJS(setIsDrawing)(true);
      const point = { x: event.x, y: event.y };
      currentPathRef.current = [point];
      runOnJS(setCurrentPath)([point]);
    })
    .onUpdate((event) => {
      const point = { x: event.x, y: event.y };
      currentPathRef.current = [...currentPathRef.current, point];
      runOnJS(setCurrentPath)([...currentPathRef.current]);
    })
    .onEnd(() => {
      runOnJS(addPath)(currentPathRef.current);
      runOnJS(setCurrentPath)([]);
      runOnJS(setIsDrawing)(false);
      currentPathRef.current = [];
    });
  
  // 双指拖动手势
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    });
  
  // 双指缩放手势
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = lastScale.value * event.scale;
    })
    .onEnd(() => {
      lastScale.value = scale.value;
    });
  
  // 组合手势 - 绘画与变换手势并行
  const composedGestures = Gesture.Simultaneous(
    drawGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );
  
  // 动画样式
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });
  
  // 组件加载时获取草稿
  useEffect(() => {
    if (visible && currentExercise?.id) {
      console.log(`草稿纸打开，题目ID: ${currentExercise.id}`);
      loadDraft();
    } else if (!visible) {
      // 关闭时重置当前绘画状态但不清除paths（因为已经保存）
      setCurrentPath([]);
      setIsDrawing(false);
      currentPathRef.current = [];
    }
  }, [visible, currentExercise?.id, loadDraft]);
  
  // 清除所有绘画
  const clearAll = useCallback(async () => {
    setPaths([]);
    setCurrentPath([]);
    currentPathRef.current = [];
    // 清除存储的草稿
    const draftKey = getDraftKey();
    if (draftKey) {
      try {
        await AsyncStorage.removeItem(draftKey);
      } catch (error) {
        console.error('清除草稿失败:', error);
      }
    }
  }, [getDraftKey]);
  
  // 撤销最后一笔
  const undo = useCallback(() => {
    setPaths(prev => {
      const newPaths = prev.slice(0, -1);
      // 保存更新后的草稿
      saveDraft(newPaths);
      return newPaths;
    });
  }, [saveDraft]);
  
  // 重置变换
  const resetTransform = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
    scale.value = 1;
    lastScale.value = 1;
  }, [translateX, translateY, scale, lastScale]);
  
  // 关闭时保存草稿并重置变换状态
  const handleClose = useCallback(async () => {
    // 保存当前草稿
    if (paths.length > 0) {
      await saveDraft(paths);
    }
    // 重置变换状态但不清除绘画内容
    resetTransform();
    onClose();
  }, [paths, saveDraft, resetTransform, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
            <View style={[styles.overlay, isViewingExercise && styles.transparentOverlay]}>
        <StatusBar backgroundColor="rgba(0,0,0,0.7)" barStyle="light-content" />
        
        {/* 草稿纸区域 */}
        {!isViewingExercise ? (
          <GestureHandlerRootView style={styles.gestureContainer}>
            <GestureDetector gesture={composedGestures}>
              <Animated.View style={[styles.paperContainer, { width, height }, animatedStyle]}>
                <View style={styles.paper}>
                  {/* 背景网格 */}
                  <View style={styles.gridBackground} />
                  
                  {/* SVG绘画区域 */}
                  <Svg
                    width={width}
                    height={height}
                    style={StyleSheet.absoluteFill}
                  >
                    {/* 渲染已完成的路径 */}
                    {paths.map((path) => (
                      <Path
                        key={path.id}
                        d={path.pathData}
                        stroke={path.color}
                        strokeWidth={path.strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    
                    {/* 渲染当前正在绘制的路径 */}
                    {currentPath.length > 0 && (
                      <Path
                        d={generatePathData(currentPath)}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </Svg>
                </View>
              </Animated.View>
            </GestureDetector>
          </GestureHandlerRootView>
        ) : (
          /* 查看题目时的透明占位区域，保持布局 */
          <View style={styles.gestureContainer} />
        )}
        
        {/* 底部区域 */}
        <View style={styles.bottomArea}>
          {/* 底部提示 */}
          <View style={styles.hint}>
            <Text style={styles.hintText}>
              {isViewingExercise 
                ? '松开"题目"按钮回到草稿纸' 
                : '单指绘画 • 双指拖动和缩放 • 长按"题目"查看题目'
              }
            </Text>
          </View>
          
          {/* 底部工具栏 */}
          <View style={styles.bottomToolbar}>
            <TouchableOpacity style={styles.toolButton} onPress={undo}>
              <Ionicons name="arrow-undo" size={20} color="#333" />
              <Text style={styles.toolButtonText}>撤销</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolButton} onPress={clearAll}>
              <Ionicons name="trash-outline" size={20} color="#333" />
              <Text style={styles.toolButtonText}>清除</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.toolButton} onPress={resetTransform}>
              <Ionicons name="resize" size={20} color="#333" />
              <Text style={styles.toolButtonText}>重置</Text>
            </TouchableOpacity>
            
            {currentExercise && (
              <TouchableOpacity 
                style={[styles.toolButton, isViewingExercise && styles.activeToolButton]} 
                onPressIn={() => setIsViewingExercise(true)}
                onPressOut={() => setIsViewingExercise(false)}
              >
                <Ionicons 
                  name="document-text-outline" 
                  size={20} 
                  color={isViewingExercise ? "#fff" : "#333"} 
                />
                <Text style={[styles.toolButtonText, isViewingExercise && styles.activeToolButtonText]}>
                  题目
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transparentOverlay: {
    backgroundColor: 'transparent',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 6,
    marginBottom: 8,
    marginHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomToolbar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  toolButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 6,
  },
  toolButtonText: {
    fontSize: 10,
    color: '#333',
    marginTop: 1,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  gestureContainer: {
    flex: 1,
    width: screenWidth,
    marginTop: 20,
  },
  paperContainer: {
    overflow: 'hidden',
  },
  paper: {
    flex: 1,
    backgroundColor: 'rgba(40, 40, 40, 0.8)', // 半透明灰黑色背景
    position: 'relative',
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // 网格背景可以通过图片或SVG实现，这里简化处理
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  hint: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    marginHorizontal: 16,
  },
    hintText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activeToolButton: {
    backgroundColor: '#5EC0DE',
    borderRadius: 8,
  },
  activeToolButtonText: {
    color: '#fff',
  },
  bottomArea: {
    width: '100%',
    alignItems: 'center',
  },
}); 