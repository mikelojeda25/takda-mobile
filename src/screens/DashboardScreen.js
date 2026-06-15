import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radius, spacing } from "../utils/theme";
import { useAuth } from "../contexts/AuthContext";
import { useAlarms } from "../hooks/useAlarms";
import AlarmCard from "../components/AlarmCard";
import AlarmModal from "../components/AlarmModal";
import AlarmDetailModal from "../components/AlarmDetailModal";
import InviteModal from "../components/InviteModal";
import ProfileModal from "../components/ProfileModal";
import LoaderScreen from "../components/LoaderScreen";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "team", label: "Team" },
];

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const {
    alarms,
    alarmsLoading,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
  } = useAlarms();
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editAlarm, setEditAlarm] = useState(null);
  const [detailAlarm, setDetailAlarm] = useState(null);
  const [inviteAlarm, setInviteAlarm] = useState(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const filtered = alarms.filter((a) => {
    if (filter === "mine") return a.createdBy === user?.uid;
    if (filter === "team") return a.createdBy !== user?.uid;
    return true;
  });

  const handleSave = () => {
    setEditAlarm(null);
    setShowCreate(false);
  };

  if (alarmsLoading) {
    return <LoaderScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>TAKDA</Text>
            <Text style={styles.greeting}>
              Hey, {user?.displayName?.split(" ")[0]} 👋
            </Text>
          </View>

          {/* Avatar tap → dropdown */}
          <TouchableOpacity
            onPress={() => setShowAvatarMenu(true)}
            style={styles.avatarWrap}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.[0] || "U"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filters + Join Button */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                filter === f.key && styles.filterActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => navigation.navigate("Invite")}
          >
            <Text style={styles.joinBtnText}>Join</Text>
          </TouchableOpacity>
        </View>

        {/* Alarm count */}
        <Text style={styles.count}>
          {filtered.length} alarm{filtered.length !== 1 ? "s" : ""}
        </Text>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⏰</Text>
              <Text style={styles.emptyTitle}>No alarms yet</Text>
              <Text style={styles.emptyHint}>
                Tap + to create your first alarm
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <AlarmCard
              alarm={item}
              currentUser={user}
              onToggle={toggleAlarm}
              onEdit={setEditAlarm}
              onDelete={deleteAlarm}
              onPress={() => setDetailAlarm(item)}
              onInvite={(alarm) => setInviteAlarm(alarm)}
            />
          )}
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar dropdown menu */}
      <Modal
        visible={showAvatarMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarMenu(false)}
        >
          <View style={styles.menuCard}>
            {/* Mini user info at top of menu */}
            <View style={styles.menuUser}>
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.menuAvatar}
                />
              ) : (
                <View style={[styles.menuAvatar, styles.avatarFallback]}>
                  <Text style={{ color: colors.accent, fontWeight: "700" }}>
                    {user?.displayName?.[0] || "U"}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.menuName} numberOfLines={1}>
                  {user?.displayName || "User"}
                </Text>
                <Text style={styles.menuEmail} numberOfLines={1}>
                  {user?.email || ""}
                </Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            {/* Profile */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAvatarMenu(false);
                setShowProfile(true);
              }}
            >
              <Feather
                name="user"
                size={16}
                color={colors.text2}
                style={styles.menuItemIcon}
              />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Logout */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowAvatarMenu(false);
                logout();
              }}
            >
              <Feather
                name="log-out"
                size={16}
                color="#e05252"
                style={styles.menuItemIcon}
              />
              <Text style={[styles.menuItemText, { color: "#e05252" }]}>
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={logout}
        />
      )}

      {/* Alarm modals */}
      {(showCreate || editAlarm) && (
        <AlarmModal
          alarm={editAlarm}
          onSave={handleSave}
          onClose={() => {
            setShowCreate(false);
            setEditAlarm(null);
          }}
          createAlarm={createAlarm}
          updateAlarm={updateAlarm}
        />
      )}

      {detailAlarm && (
        <AlarmDetailModal
          alarm={detailAlarm}
          currentUser={user}
          onClose={() => setDetailAlarm(null)}
          onEdit={(alarmToEdit) => {
            setDetailAlarm(null);
            setEditAlarm(alarmToEdit);
          }}
        />
      )}

      {inviteAlarm && (
        <InviteModal
          visible={!!inviteAlarm}
          alarm={inviteAlarm}
          onClose={() => setInviteAlarm(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logo: {
    fontFamily: "SpaceMono",
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 3,
  },
  greeting: { fontSize: 13, color: colors.text2, marginTop: 2 },
  avatarWrap: { padding: 2 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accent, fontWeight: "700", fontSize: 16 },

  // Dropdown menu
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: spacing.md,
  },
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 220,
    overflow: "hidden",
  },
  menuUser: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: 10,
  },
  menuAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  menuName: { fontSize: 14, fontWeight: "700", color: colors.text },
  menuEmail: { fontSize: 12, color: colors.text3, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: colors.border },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
  },
  menuItemIcon: { marginRight: 10 },
  menuItemText: { fontSize: 14, color: colors.text2, fontWeight: "500" },

  // Filters
  filters: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { fontSize: 13, color: colors.text2, fontWeight: "500" },
  filterTextActive: { color: colors.bg, fontWeight: "700" },
  joinBtn: {
    marginLeft: "auto",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  joinBtnText: { fontSize: 13, color: colors.accent, fontWeight: "700" },
  count: {
    fontSize: 12,
    color: colors.text3,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptyHint: { fontSize: 14, color: colors.text3 },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: colors.bg, fontWeight: "300", marginTop: -2 },
});
