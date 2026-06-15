import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { colors, radius, spacing } from "../utils/theme";
import {
  formatRepeat,
  formatTime12,
  getNextAlarmDate,
} from "../utils/alarmUtils";
import { format, formatDistanceToNow } from "date-fns";

const FIVE_MIN = 5 * 60 * 1000;

export default function AlarmDetailModal({
  alarm,
  currentUser,
  onClose,
  onEdit,
}) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [isMembersExpanded, setIsMembersExpanded] = useState(false);
  const [liveAlarm, setLiveAlarm] = useState(alarm);

  const isManager = liveAlarm.createdBy === currentUser?.uid;
  const nextDate = liveAlarm.active ? getNextAlarmDate(liveAlarm) : null;

  // FIXED: Real-time listener for the alarm document
  useEffect(() => {
    const unsubAlarm = onSnapshot(doc(db, "alarms", alarm.id), (docSnap) => {
      if (docSnap.exists()) {
        setLiveAlarm({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsubAlarm();
  }, [alarm.id]);

  useEffect(() => {
    const q = query(
      collection(db, "alarms", alarm.id, "comments"),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [alarm.id]);

  const confirmDeleteComment = (commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteComment(commentId),
        },
      ],
    );
  };

  const confirmRemoveMember = (member) => {
    Alert.alert("Remove Member", `Remove ${member.name} from this alarm?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeMember(member),
      },
    ]);
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await addDoc(collection(db, "alarms", alarm.id, "comments"), {
      text: text.trim(),
      uid: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      createdAt: serverTimestamp(),
    });
    setText("");
    setSending(false);
  };

  const canDelete = (c) => {
    if (isManager) return true;
    if (c.uid !== currentUser.uid) return false;
    if (!c.createdAt) return true;
    return isManager;
  };

  const deleteComment = (id) =>
    deleteDoc(doc(db, "alarms", alarm.id, "comments", id));

  const removeMember = async (member) => {
    try {
      await updateDoc(doc(db, "alarms", alarm.id), {
        members: arrayRemove(member.uid),
        memberDetails: arrayRemove({
          uid: member.uid,
          name: member.name,
          photoURL: member.photoURL || null, // Ensure no undefined fields are passed to Firestore
        }),
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to remove member.");
    }
  };

  const renderComment = ({ item: c }) => (
    <View style={styles.comment}>
      {c.photoURL ? (
        <Image source={{ uri: c.photoURL }} style={styles.commentAvatar} />
      ) : (
        <View style={[styles.commentAvatar, styles.avatarFallback]}>
          <Text style={styles.fallbackText}>{c.name?.[0]}</Text>
        </View>
      )}
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentName}>{c.name}</Text>
          <Text style={styles.commentTime}>
            {c.createdAt
              ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true })
              : "just now"}
          </Text>
          {canDelete(c) && (
            <TouchableOpacity
              onPress={() => confirmDeleteComment(c.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentText}>{c.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {liveAlarm.creatorPhoto ? (
              <Image
                source={{ uri: liveAlarm.creatorPhoto }}
                style={styles.creatorPhoto}
              />
            ) : (
              <View style={[styles.creatorPhoto, styles.avatarFallback]}>
                <Text style={styles.fallbackText}>
                  {liveAlarm.creatorName?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text
                style={[
                  styles.alarmTitle,
                  { fontSize: liveAlarm.title.length > 10 ? 30 : 40 },
                ]}
              >
                {liveAlarm.title}
              </Text>
              {liveAlarm.description ? (
                <Text style={styles.alarmDesc}>{liveAlarm.description}</Text>
              ) : null}
              <Text style={styles.creatorBy}>by {liveAlarm.creatorName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Time + repeat */}
        <View style={styles.metaRow}>
          <Text style={styles.detailTime}>{formatTime12(liveAlarm.time)}</Text>
          <View style={styles.repeatBadge}>
            <Text style={styles.repeatText}>{formatRepeat(liveAlarm)}</Text>
          </View>
          {nextDate && (
            <Text style={styles.nextText}>
              Next: {format(nextDate, "EEE, MMM d")}
            </Text>
          )}
        </View>

        {/* Edit Button - Full Row */}
        {isManager && (
          <View style={styles.editRowContainer}>
            <TouchableOpacity
              style={styles.fullWidthEditBtn}
              onPress={() => onEdit(liveAlarm)}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>Edit Alarm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Members */}
        {liveAlarm.memberDetails?.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsMembersExpanded(!isMembersExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionLabel}>
                Members ({liveAlarm.memberDetails.length})
              </Text>
              <Text style={styles.dropdownIcon}>
                {isMembersExpanded ? "▼" : "▶"}
              </Text>
            </TouchableOpacity>

            {isMembersExpanded && (
              <View style={styles.membersContainer}>
                {liveAlarm.memberDetails.map((m) => (
                  <View key={m.uid} style={styles.memberCard}>
                    {m.photoURL ? (
                      <Image
                        source={{ uri: m.photoURL }}
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <View
                        style={[styles.memberAvatar, styles.avatarFallback]}
                      >
                        <Text style={styles.fallbackText}>{m.name?.[0]}</Text>
                      </View>
                    )}

                    {/* Tinanggal ang flex: 1 dito para hindi niya kainin ang buong space */}
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{m.name}</Text>
                    </View>

                    {/* Dito sa dulo mag-ja-justify gamit ang space-between ng card */}
                    {m.uid === liveAlarm.createdBy && (
                      <View style={styles.managerBadge}>
                        <Text style={styles.managerText}>Manager</Text>
                      </View>
                    )}

                    {isManager && m.uid !== liveAlarm.createdBy && (
                      <TouchableOpacity
                        style={styles.removeMemberBtn}
                        onPress={() => confirmRemoveMember(m)}
                      >
                        <Text style={styles.removeMemberText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Discussion</Text>
        </View>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          style={styles.commentsList}
          contentContainerStyle={{ padding: spacing.md, paddingTop: 0 }}
          ListEmptyComponent={
            <Text style={styles.noComments}>No comments yet. Be first!</Text>
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          {currentUser?.photoURL ? (
            <Image
              source={{ uri: currentUser.photoURL }}
              style={styles.inputAvatar}
            />
          ) : (
            <View style={[styles.inputAvatar, styles.avatarFallback]}>
              <Text style={styles.fallbackText}>
                {currentUser?.displayName?.[0]}
              </Text>
            </View>
          )}
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Write a comment…"
            placeholderTextColor={colors.text3}
            multiline
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendDisabled,
            ]}
            onPress={send}
            disabled={!text.trim() || sending}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: "row", gap: 14, flex: 1 },
  creatorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerInfo: { flex: 1, justifyContent: "center" },
  alarmTitle: {
    fontSize: 30,
    textTransform: "uppercase",
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  alarmDesc: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: 4,
    lineHeight: 20,
  },
  creatorBy: { fontSize: 12, color: colors.text3, fontWeight: "500" },
  closeBtn: {
    padding: 6,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 14, color: colors.text2, fontWeight: "600" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: "wrap",
  },
  detailTime: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 24,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.5,
  },
  repeatBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repeatText: { fontSize: 12, color: colors.text, fontWeight: "600" },
  nextText: { fontSize: 13, color: colors.text3, fontWeight: "500" },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text3,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  membersContainer: {
    gap: 8,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberAvatar: { width: 36, height: 36, borderRadius: 18 },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberName: { fontSize: 15, fontWeight: "600", color: colors.text },
  managerBadge: {
    backgroundColor: colors.accent + "15",
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.accent + "30",
  },
  managerText: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  removeMemberBtn: {
    backgroundColor: colors.danger + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  removeMemberText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  commentsList: { flex: 1 },
  noComments: {
    fontSize: 14,
    color: colors.text3,
    textAlign: "center",
    paddingVertical: 30,
    fontWeight: "500",
  },
  comment: { flexDirection: "row", gap: 12, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    backgroundColor: colors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: { fontSize: 14, color: colors.accent, fontWeight: "800" },
  commentBody: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentName: { fontSize: 14, fontWeight: "700", color: colors.text },
  commentTime: { fontSize: 12, color: colors.text3 },
  deleteBtn: { fontSize: 14, color: colors.danger, fontWeight: "bold" },
  commentText: { fontSize: 15, color: colors.text2, lineHeight: 22 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    padding: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 32 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputAvatar: { width: 36, height: 36, borderRadius: 18 },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.text,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  sendDisabled: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  sendIcon: {
    fontSize: 18,
    color: colors.bg,
    fontWeight: "800",
    marginBottom: 2,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  dropdownIcon: {
    fontSize: 12,
    color: colors.text3,
    marginLeft: 16,
    marginTop: -12,
  },
  editRowContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  fullWidthEditBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: 0.5,
  },
});
