import React from "react";
import {
  StyleSheet,
  View as RNView,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";

interface KnowledgePoint {
  title: string;
  content: string;
  type: "text" | "image" | "video";
  mediaUrl?: string;
}

interface KnowledgePointModalProps {
  visible: boolean;
  knowledgePoint: KnowledgePoint | null;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get("window");

export const KnowledgePointModal: React.FC<KnowledgePointModalProps> = ({
  visible,
  knowledgePoint,
  onClose,
}) => {
  if (!knowledgePoint) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <RNView style={styles.modalOverlay}>
        <RNView style={styles.modalContainer}>
          {/* 头部 */}
          <RNView style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{knowledgePoint.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </RNView>

          {/* 内容 */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {knowledgePoint.type === "text" && (
              <RenderHtml
                contentWidth={screenWidth - 80}
                source={{ html: knowledgePoint.content }}
                tagsStyles={{
                  p: { fontSize: 16, lineHeight: 24, color: "#333", marginBottom: 12 },
                  h1: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 16 },
                  h2: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 14 },
                  h3: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
                  li: { fontSize: 16, lineHeight: 24, color: "#333", marginBottom: 8 },
                  strong: { fontWeight: "bold" },
                  em: { fontStyle: "italic" },
                }}
              />
            )}

            {knowledgePoint.type === "image" && knowledgePoint.mediaUrl && (
              <RNView style={styles.imageContainer}>
                <Image
                  source={{ uri: knowledgePoint.mediaUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
                {knowledgePoint.content && (
                  <Text style={styles.imageCaption}>{knowledgePoint.content}</Text>
                )}
              </RNView>
            )}

            {knowledgePoint.type === "video" && (
              <RNView style={styles.videoContainer}>
                <Text style={styles.videoPlaceholder}>视频内容（待开发）</Text>
                {knowledgePoint.content && (
                  <RenderHtml
                    contentWidth={screenWidth - 80}
                    source={{ html: knowledgePoint.content }}
                  />
                )}
              </RNView>
            )}
          </ScrollView>

          {/* 底部按钮 */}
          <RNView style={styles.modalFooter}>
            <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
              <Text style={styles.confirmButtonText}>我知道了</Text>
            </TouchableOpacity>
          </RNView>
        </RNView>
      </RNView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 20,
    maxHeight: "80%",
    width: screenWidth - 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 400,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageCaption: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  videoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  videoPlaceholder: {
    fontSize: 16,
    color: "#999",
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 8,
    width: "100%",
    textAlign: "center",
    marginBottom: 12,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#5EC0DE",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
}); 