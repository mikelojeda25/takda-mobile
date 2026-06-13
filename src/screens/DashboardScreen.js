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
} from "react-native";
import AlarmRingScreen from "../screens/AlarmRingScreen";
import { colors, radius, spacing } from "../utils/theme";
import { useAuth } from "../contexts/AuthContext";
import { useAlarms } from "../hooks/useAlarms";
import AlarmCard from "../components/AlarmCard";
import AlarmModal from "../components/AlarmModal";
import AlarmDetailModal from "../components/AlarmDetailModal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "team", label: "Team" },
];

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { alarms, createAlarm, updateAlarm, deleteAlarm, toggleAlarm } =
    useAlarms((alarm) => setRinging(alarm));
  const [ringing, setRinging] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editAlarm, setEditAlarm] = useState(null);
  const [detailAlarm, setDetailAlarm] = useState(null);

  const filtered = alarms.filter((a) => {
    if (filter === "mine") return a.createdBy === user?.uid;
    if (filter === "team") return a.createdBy !== user?.uid;
    return true;
  });

  const handleSave = async (form) => {
    if (editAlarm) {
      await updateAlarm(editAlarm.id, form);
      setEditAlarm(null);
    } else {
      await createAlarm(form);
      setShowCreate(false);
    }
  };

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
          <TouchableOpacity onPress={logout} style={styles.avatarWrap}>
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

        {/* Filters */}
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

        {ringing && (
          <AlarmRingScreen alarm={ringing} onDismiss={() => setRinging(null)} />
        )}
      </View>

      {/* Modals */}
      {(showCreate || editAlarm) && (
        <AlarmModal
          alarm={editAlarm}
          onSave={handleSave}
          onClose={() => {
            setShowCreate(false);
            setEditAlarm(null);
          }}
        />
      )}

      {detailAlarm && (
        <AlarmDetailModal
          alarm={detailAlarm}
          currentUser={user}
          onClose={() => setDetailAlarm(null)}
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
  greeting: {
    fontSize: 13,
    color: colors.text2,
    marginTop: 2,
  },
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
  filters: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: { fontSize: 13, color: colors.text2, fontWeight: "500" },
  filterTextActive: { color: colors.bg, fontWeight: "700" },
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
