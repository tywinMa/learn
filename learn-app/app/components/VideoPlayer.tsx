import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View as RNView,
  TouchableOpacity,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface VideoPlayerProps {
  source: { uri: string };
  title?: string;
  poster?: string;
  style?: any;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  primaryColor?: string;
  autoPlay?: boolean;
  showControlsInitially?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  title,
  poster,
  style,
  onPlaybackStatusUpdate,
  primaryColor = "#5EC0DE",
  autoPlay = false,
  showControlsInitially = true,
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(showControlsInitially);
  const [volume, setVolume] = useState(1.0);
  const controlsOpacity = useSharedValue(showControlsInitially ? 1 : 0);
  const hideControlsTimeout = useRef<NodeJS.Timeout>();

  // 格式化时间
  const formatTime = (milliseconds: number) => {
    if (!milliseconds) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 处理播放状态更新
  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);
    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(playbackStatus);
    }
  };

  // 显示控制栏
  const showControlsFunc = () => {
    setShowControlsOverlay(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    
    // 清除之前的隐藏定时器
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    
    // 播放时3秒后隐藏控制栏
    if (status.isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        hideControlsFunc();
      }, 3000);
    }
  };

  // 隐藏控制栏
  const hideControlsFunc = () => {
    controlsOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setShowControlsOverlay)(false);
    });
  };

  // 播放/暂停切换
  const togglePlayPause = async () => {
    try {
      if (status.isPlaying) {
        await videoRef.current?.pauseAsync();
      } else {
        await videoRef.current?.playAsync();
      }
      showControlsFunc();
    } catch (error) {
      console.error('播放控制错误:', error);
    }
  };

  // 音量控制
  const handleVolumeChange = async (newVolume: number) => {
    try {
      setVolume(newVolume);
      await videoRef.current?.setVolumeAsync(newVolume);
      showControlsFunc();
    } catch (error) {
      console.error('音量控制错误:', error);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    showControlsFunc();
  };

  // 点击视频区域显示/隐藏控制栏
  const handleVideoPress = () => {
    if (showControlsOverlay) {
      hideControlsFunc();
    } else {
      showControlsFunc();
    }
  };

  // 控制栏动画样式
  const controlsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: controlsOpacity.value,
    };
  });

  // 进度计算
  const progress = status.durationMillis && status.positionMillis
    ? status.positionMillis / status.durationMillis
    : 0;

  // 渲染播放控制栏
  const renderControls = () => (
    <Animated.View style={[styles.controlsOverlay, controlsAnimatedStyle]}>
      {/* 顶部控制栏 */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topControls}
      >
        {title && <Text style={styles.videoTitle}>{title}</Text>}
        {isFullscreen && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFullscreen}
          >
            <Ionicons name="contract" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* 中央播放按钮 */}
      <RNView style={styles.centerControls}>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: primaryColor }]}
          onPress={togglePlayPause}
        >
          <Ionicons
            name={status.isPlaying ? "pause" : "play"}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>
      </RNView>

      {/* 底部控制栏 */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomControls}
      >
        {/* 进度条 */}
        <RNView style={styles.progressContainer}>
          <Text style={styles.timeText}>
            {formatTime(status.positionMillis || 0)}
          </Text>
          <RNView style={styles.progressBar}>
            <RNView style={[styles.progressTrack]}>
              <RNView
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: primaryColor }
                ]}
              />
            </RNView>
          </RNView>
          <Text style={styles.timeText}>
            {formatTime(status.durationMillis || 0)}
          </Text>
        </RNView>

        {/* 控制按钮行 */}
        <RNView style={styles.controlsRow}>
          <RNView style={styles.leftControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={status.isPlaying ? "pause" : "play"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>

            {/* 音量控制 */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleVolumeChange(volume > 0 ? 0 : 1)}
            >
              <Ionicons
                name={volume > 0 ? "volume-high" : "volume-mute"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </RNView>

          <RNView style={styles.rightControls}>
            {!isFullscreen && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFullscreen}
              >
                <Ionicons name="expand" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </RNView>
        </RNView>
      </LinearGradient>
    </Animated.View>
  );

  // 渲染视频播放器
  const renderVideoPlayer = (containerStyle: any) => (
    <RNView style={containerStyle}>
      <TouchableOpacity
        style={styles.videoTouchArea}
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={source}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay}
          isLooping={false}
          volume={volume}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
      </TouchableOpacity>
      {renderControls()}
    </RNView>
  );

  // 全屏模式
  if (isFullscreen) {
    return (
      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['landscape', 'portrait']}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <StatusBar hidden />
        {renderVideoPlayer(styles.fullscreenContainer)}
      </Modal>
    );
  }

  // 普通模式
  return renderVideoPlayer([styles.container, style]);
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoTouchArea: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    marginHorizontal: 4,
  },
});