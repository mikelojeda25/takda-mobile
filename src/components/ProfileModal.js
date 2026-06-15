import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing } from "../utils/theme";

export default function ProfileModal({ user, onClose, onLogout }) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.text2} />
          </TouchableOpacity>
        </View>

        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {user?.displayName?.[0] || "U"}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{user?.displayName || "User"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
        </View>

        {/* Info rows */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather
              name="user"
              size={16}
              color={colors.text3}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user?.displayName || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Feather
              name="mail"
              size={16}
              color={colors.text3}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.email || "—"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Feather
              name="shield"
              size={16}
              color={colors.text3}
              style={styles.infoIcon}
            />
            <Text style={styles.infoLabel}>Account</Text>
            <Text style={styles.infoValue}>Google</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            onClose();
            onLogout();
          }}
        >
          <Feather
            name="log-out"
            size={16}
            color="#e05252"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  closeBtn: { padding: 4 },

  profileSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.accent,
    marginBottom: spacing.md,
  },
  avatarFallback: {
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: colors.accent },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  email: { fontSize: 13, color: colors.text3 },

  infoCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  infoIcon: { marginRight: 10 },
  infoLabel: { fontSize: 14, color: colors.text3, width: 60 },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e05252",
    backgroundColor: "#e0525211",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#e05252" },
});
