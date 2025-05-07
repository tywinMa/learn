import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  Dimensions
} from "react-native";
import { Text, View } from "./Themed";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

interface UnlockModalProps {
  visible: boolean;
  onClose: () => void;
  previousLevelTitle?: string;
}

const UnlockModal = ({ visible, onClose, previousLevelTitle = "上一关卡" }: UnlockModalProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <RNView style={styles.modalOverlay}>
        <BlurView intensity={50} style={styles.blurContainer} tint="dark">
          <RNView style={styles.modalContent}>
            <RNView style={styles.iconContainer}>
              <FontAwesome5 name="lock" size={32} color="#FF9600" />
            </RNView>
            
            <Text style={styles.modalTitle}>关卡未解锁</Text>
            
            <RNView style={styles.starsRequirement}>
              <Text style={styles.requirementText}>需要完成</Text>
              <Text style={styles.levelTitle}>{previousLevelTitle}</Text>
              <RNView style={styles.starsRow}>
                <FontAwesome5 name="star" size={20} solid color="#FFD900" />
                <FontAwesome5 name="star" size={20} solid color="#FFD900" />
                <FontAwesome5 name="star" size={20} solid color="#FFD900" />
              </RNView>
              <Text style={styles.completionText}>三星挑战</Text>
            </RNView>
            
            <RNView style={styles.stepsContainer}>
              <RNView style={styles.stepRow}>
                <RNView style={styles.stepIcon}>
                  <Text style={styles.stepNumber}>1</Text>
                </RNView>
                <Text style={styles.stepText}>完成上一关卡的全部练习题</Text>
              </RNView>
              
              <RNView style={styles.stepRow}>
                <RNView style={styles.stepIcon}>
                  <Text style={styles.stepNumber}>2</Text>
                </RNView>
                <Text style={styles.stepText}>获得三星评价（100%正确率）</Text>
              </RNView>
              
              <RNView style={styles.stepRow}>
                <RNView style={styles.stepIcon}>
                  <Text style={styles.stepNumber}>3</Text>
                </RNView>
                <Text style={styles.stepText}>系统将自动解锁下一关卡</Text>
              </RNView>
            </RNView>
            
            <Text style={styles.detailText}>
              完成后将自动解锁此关卡，继续加油！
            </Text>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>我知道了</Text>
            </TouchableOpacity>
          </RNView>
        </BlurView>
      </RNView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  blurContainer: {
    borderRadius: 16,
    overflow: "hidden",
    width: Dimensions.get("window").width * 0.85,
    maxWidth: 400,
  },
  modalContent: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFF5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  starsRequirement: {
    alignItems: "center",
    marginVertical: 16,
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
  },
  requirementText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  completionText: {
    fontSize: 14,
    color: "#FF9600",
    fontWeight: "bold",
  },
  detailText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginVertical: 16,
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: "#FF9600",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  stepsContainer: {
    width: "100%",
    marginVertical: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBF7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1CB0F6",
  },
  stepText: {
    fontSize: 15,
    color: "#444",
    flex: 1,
  },
});

export default UnlockModal; 