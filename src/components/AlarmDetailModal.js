import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { colors, radius, spacing } from '../utils/theme';
import { formatRepeat, formatTime12, getNextAlarmDate } from '../utils/alarmUtils';
import { format, formatDistanceToNow } from 'date-fns';

const FIVE_MIN = 5 * 60 * 1000;

export default function AlarmDetailModal({ alarm, currentUser, onClose }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const isManager = alarm.createdBy === currentUser?.uid;
  const nextDate = alarm.active ? getNextAlarmDate(alarm) : null;

  useEffect(() => {
    const q = query(
      collection(db, 'alarms', alarm.id, 'comments'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [alarm.id]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await addDoc(collection(db, 'alarms', alarm.id, 'comments'), {
      text: text.trim(),
      uid: currentUser.uid,
      name: currentUser.displayName,
      photoURL: currentUser.photoURL,
      createdAt: serverTimestamp(),
    });
    setText('');
    setSending(false);
  };

  const canDelete = (c) => {
    if (isManager) return true;
    if (c.uid !== currentUser.uid) return false;
    if (!c.createdAt) return true;
    return Date.now() - c.createdAt.toMillis() < FIVE_MIN;
  };

  const deleteComment = (id) => deleteDoc(doc(db, 'alarms', alarm.id, 'comments', id));

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
            {c.createdAt ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true }) : 'just now'}
          </Text>
          {canDelete(c) && (
            <TouchableOpacity onPress={() => deleteComment(c.id)}>
              <Text style={styles.deleteBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentText}>{c.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {alarm.creatorPhoto ? (
              <Image source={{ uri: alarm.creatorPhoto }} style={styles.creatorPhoto} />
            ) : (
              <View style={[styles.creatorPhoto, styles.avatarFallback]}>
                <Text style={styles.fallbackText}>{alarm.creatorName?.[0]}</Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.alarmTitle}>{alarm.title}</Text>
              {alarm.description ? (
                <Text style={styles.alarmDesc}>{alarm.description}</Text>
              ) : null}
              <Text style={styles.creatorBy}>by {alarm.creatorName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Time + repeat */}
        <View style={styles.metaRow}>
          <Text style={styles.detailTime}>{formatTime12(alarm.time)}</Text>
          <View style={styles.repeatBadge}>
            <Text style={styles.repeatText}>{formatRepeat(alarm)}</Text>
          </View>
          {nextDate && (
            <Text style={styles.nextText}>Next: {format(nextDate, 'EEE, MMM d')}</Text>
          )}
        </View>

        {/* Members */}
        {alarm.memberDetails?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Members</Text>
            {alarm.memberDetails.map((m) => (
              <View key={m.uid} style={styles.member}>
                {m.photoURL ? (
                  <Image source={{ uri: m.photoURL }} style={styles.memberAvatar} />
                ) : (
                  <View style={[styles.memberAvatar, styles.avatarFallback]}>
                    <Text style={styles.fallbackText}>{m.name?.[0]}</Text>
                  </View>
                )}
                <Text style={styles.memberName}>{m.name}</Text>
                {m.uid === alarm.createdBy && (
                  <View style={styles.managerBadge}>
                    <Text style={styles.managerText}>Manager</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Comments</Text>
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
            <Image source={{ uri: currentUser.photoURL }} style={styles.inputAvatar} />
          ) : (
            <View style={[styles.inputAvatar, styles.avatarFallback]}>
              <Text style={styles.fallbackText}>{currentUser?.displayName?.[0]}</Text>
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
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  creatorPhoto: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  headerInfo: { flex: 1 },
  alarmTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 2 },
  alarmDesc: { fontSize: 13, color: colors.text2, marginBottom: 3, lineHeight: 18 },
  creatorBy: { fontSize: 12, color: colors.text3 },
  closeBtn: {
    padding: 6,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 12, color: colors.text2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
  },
  detailTime: {
    fontFamily: 'SpaceMono',
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
  },
  repeatBadge: {
    backgroundColor: colors.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  repeatText: { fontSize: 12, color: colors.text2 },
  nextText: { fontSize: 12, color: colors.text3 },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  memberAvatar: { width: 30, height: 30, borderRadius: 15 },
  memberName: { fontSize: 14, color: colors.text, flex: 1 },
  managerBadge: {
    backgroundColor: colors.accent + '22',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  managerText: { fontSize: 10, color: colors.accent, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.sm },
  commentsList: { flex: 1 },
  noComments: { fontSize: 13, color: colors.text3, textAlign: 'center', paddingVertical: 24 },
  comment: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14 },
  avatarFallback: { backgroundColor: colors.surface3, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontSize: 12, color: colors.accent, fontWeight: '700' },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  commentName: { fontSize: 13, fontWeight: '600', color: colors.text },
  commentTime: { fontSize: 11, color: colors.text3, flex: 1 },
  deleteBtn: { fontSize: 11, color: colors.danger, paddingHorizontal: 4 },
  commentText: { fontSize: 14, color: colors.text2, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputAvatar: { width: 32, height: 32, borderRadius: 16 },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 16, color: colors.bg, fontWeight: '700' },
});
