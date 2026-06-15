import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Clipboard,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "../utils/theme";

export default function InviteModal({ visible, alarm, onClose }) {
  const [copied, setCopied] = useState(false);
  const code = alarm.inviteCode || alarm.id || "—";
  console.log(Clipboard);

  const handleCopy = () => {
    // 1. Subukan ang legacy method
    try {
      Clipboard.setString(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // 2. Kung mag-fail, ipakita na lang sa Alert
      Alert.alert("Copy Code", `Copy this CODE: ${code}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>Invite Team</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.desc}>
                Share this code with your team to join{" "}
                <Text style={styles.bold}>"{alarm.title}"</Text>.
              </Text>

              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{code}</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, copied && styles.copiedBtn]}
                  onPress={handleCopy}
                >
                  <Text style={styles.copyBtnText}>
                    {copied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.note}>
                💡 They can use this code to join automatically.
              </Text>

              <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  closeBtn: { padding: 4 },
  desc: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  bold: { fontWeight: "600", color: colors.text },
  codeContainer: {
    backgroundColor: colors.surface2,
    padding: spacing.md,
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  codeText: {
    fontFamily: "SpaceMono",
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 2,
  },
  copyBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  copiedBtn: { backgroundColor: colors.success || "#2ecc71" },
  copyBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  note: { fontSize: 12, color: colors.text3, marginBottom: spacing.lg },
  doneBtn: {
    backgroundColor: colors.surface3,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  doneBtnText: { fontWeight: "600", color: colors.text },
});
