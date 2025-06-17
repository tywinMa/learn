import React, { useState, useRef } from "react";
import { 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
  Image
} from "react-native";
import { Text, View } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import aiService from '../../services/aiService';

const { width, height } = Dimensions.get('window');

// 图片裁剪组件
const ImageCropper = ({ image, visible, onClose, onCrop }: {
  image: string;
  visible: boolean;
  onClose: () => void;
  onCrop: (croppedImage: any) => void;
}) => {
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 100,
    width: width - 100,
    height: 200
  });

  const handleCrop = () => {
    // 这里应该实现真正的图片裁剪逻辑
    // 暂时模拟裁剪后的图片
    onCrop({
      uri: image,
      cropArea: cropArea
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.cropperContainer}>
        <View style={styles.cropperHeader}>
          <TouchableOpacity onPress={onClose} style={styles.cropperButton}>
            <Ionicons name="close" size={24} color="white" />
            <Text style={styles.cropperButtonText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.cropperTitle}>裁剪题目</Text>
          <TouchableOpacity onPress={handleCrop} style={styles.cropperButton}>
            <Ionicons name="checkmark" size={24} color="white" />
            <Text style={styles.cropperButtonText}>确定</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.fullImage} resizeMode="contain" />
          <View 
            style={[
              styles.cropOverlay,
              {
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height
              }
            ]}
          >
            <View style={styles.cropBorder} />
            <Text style={styles.cropHint}>拖动调整题目范围</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// 流式解答显示组件
const StreamingAnswer = ({ answer, isStreaming }: { answer: string; isStreaming: boolean }) => {
  return (
    <View style={styles.answerContainer}>
      <View style={styles.answerHeader}>
        <Ionicons name="bulb-outline" size={24} color="#FF6B35" />
        <Text style={styles.answerTitle}>AI解答</Text>
        {isStreaming && <ActivityIndicator size="small" color="#FF6B35" />}
      </View>
      <ScrollView style={styles.answerContent}>
        <Text style={styles.answerText}>{answer}</Text>
        {isStreaming && <Text style={styles.streamingIndicator}>正在思考中...</Text>}
      </ScrollView>
    </View>
  );
};

export default function PracticeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // 请求摄像头权限
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要摄像头权限才能拍照');
      return false;
    }
    return true;
  };

  // 拍照功能
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowCropper(true);
        setAnswer(""); // 清空之前的解答
        setCroppedImage(null);
      }
    } catch (error) {
      Alert.alert('拍照失败', '请重试');
      console.error('拍照错误:', error);
    }
  };

  // 从相册选择图片
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setShowCropper(true);
        setAnswer(""); // 清空之前的解答
        setCroppedImage(null);
      }
    } catch (error) {
      Alert.alert('选择图片失败', '请重试');
      console.error('选择图片错误:', error);
    }
  };

  // 处理图片裁剪完成
  const handleCropComplete = (croppedImageData: any) => {
    setCroppedImage(croppedImageData);
  };

  // 调用AI解题接口
  const analyzeImage = async () => {
    if (!croppedImage) {
      Alert.alert('提示', '请先裁剪题目图片');
      return;
    }

    setIsAnalyzing(true);
    setIsStreaming(true);
    setAnswer("");

    try {
      // 调用AI解题服务
      const result = await aiService.solveProblem(
        croppedImage.uri,
        undefined, // 暂时不处理上传进度
        (chunk: string) => {
          // 流式数据回调
          setAnswer(prev => prev + chunk);
        }
      );

      if (!result.success) {
        setAnswer(result.error || "解题失败，请重试");
      } else if (result.answer && !answer) {
        // 如果没有通过流式获取到数据，则使用完整答案
        setAnswer(result.answer);
      }

    } catch (error) {
      console.error('解题错误:', error);
      setAnswer("解题服务暂时不可用，请稍后重试");
    } finally {
      setIsAnalyzing(false);
      setIsStreaming(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 头部标题 */}
      <View style={styles.header}>
        <Ionicons name="camera-outline" size={28} color={Colors[colorScheme].tint} />
        <Text style={styles.headerTitle}>AI拍照解题</Text>
        <Text style={styles.headerSubtitle}>拍照上传题目，获得详细解答</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* 拍照区域 */}
        <View style={styles.photoSection}>
          {croppedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: croppedImage.uri }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={() => {
                  setCroppedImage(null);
                  setSelectedImage(null);
                  setAnswer("");
                }}
              >
                <Ionicons name="refresh" size={20} color="white" />
                <Text style={styles.retakeButtonText}>重新拍照</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={64} color="#ccc" />
              <Text style={styles.photoPlaceholderText}>点击下方按钮拍摄题目</Text>
            </View>
          )}
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.actionButtonText}>拍照</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="white" />
            <Text style={styles.actionButtonText}>相册</Text>
          </TouchableOpacity>
        </View>

        {/* 解题按钮 */}
        {croppedImage && (
          <TouchableOpacity 
            style={[styles.solveButton, { backgroundColor: Colors[colorScheme].tint }]}
            onPress={analyzeImage}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="bulb" size={24} color="white" />
            )}
            <Text style={styles.solveButtonText}>
              {isAnalyzing ? '解题中...' : '开始解题'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 解答显示区域 */}
        {answer && (
          <StreamingAnswer answer={answer} isStreaming={isStreaming} />
        )}
      </ScrollView>

      {/* 图片裁剪模态框 */}
      {selectedImage && (
        <ImageCropper
          image={selectedImage}
          visible={showCropper}
          onClose={() => {
            setShowCropper(false);
            setSelectedImage(null);
          }}
          onCrop={handleCropComplete}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  photoSection: {
    marginBottom: 20,
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  retakeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retakeButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  photoPlaceholder: {
    height: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  solveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  solveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  answerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  answerContent: {
    maxHeight: 300,
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  streamingIndicator: {
    fontSize: 14,
    color: '#FF6B35',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // 裁剪器样式
  cropperContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cropperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  cropperButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropperButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 4,
  },
  cropperTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  cropOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  cropHint: {
    color: 'white',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
