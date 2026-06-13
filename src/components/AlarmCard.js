import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';
import { formatRepeat, formatTime12, getNextAlarmDate } from '../utils/alarmUtils';
import { format } from 'date-fns';

export default function AlarmCard({ alarm, currentUser, onToggle, onEdit, onDelete, onPress }) {
  const isOwner = alarm.createdBy === currentUser?.uid;
  const nextDate = alarm.active ? getNextAlarmDate(alarm) : null;

  return (
    <TouchableOpacity
      style={[styles.card, !alarm.active && styles.cardInactive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.left}>
        <Text style={[styles.time, !alarm.active && styles.dimmed]}>
          {formatTime12(alarm.time)}
        </Text>
        <Text style={[styles.title, !alarm.active && styles.dimmed]}>
          {alarm.title}
        </Text>
        {alarm.description ? (
          <Text style={styles.desc} numberOfLines={1}>{alarm.description}</Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.repeatBadge}>
            <Text style={styles.repeatText}>{formatRepeat(alarm)}</Text>
          </View>
          {nextDate && (
            <Text style={styles.next}>
              {format(nextDate, 'EEE, MMM d')}
            </Text>
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.members}>
            👥 {alarm.memberDetails?.length || 1} member{alarm.memberDetails?.length !== 1 ? 's' : ''}
          </Text>
          {isOwner && <View style={styles.badge}><Text style={styles.badgeText}>Manager</Text></View>}
        </View>
      </View>

      <View style={styles.right}>
        <Switch
          value={!!alarm.active}
          onValueChange={() => onToggle(alarm.id, alarm.active)}
          trackColor={{ false: colors.surface3, true: colors.accent + '60' }}
          thumbColor={alarm.active ? colors.accent : colors.text3}
        />
        {isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => { e.stopPropagation?.(); onEdit(alarm); }}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.dangerBtn]}
              onPress={(e) => { e.stopPropagation?.(); onDelete(alarm.id); }}
            >
              <Text style={styles.actionIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isOwner && (
          <Text style={styles.byText}>by {alarm.creatorName?.split(' ')[0]}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInactive: { opacity: 0.55 },
  left: { flex: 1, marginRight: spacing.sm },
  time: {
    fontFamily: 'SpaceMono',
    fontSize: 26,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 2,
  },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  desc: { fontSize: 13, color: colors.text3, marginBottom: 6 },
  dimmed: { color: colors.text3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  repeatBadge: {
    backgroundColor: colors.surface3,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  repeatText: { fontSize: 11, color: colors.text2, fontWeight: '500' },
  next: { fontSize: 12, color: colors.text3 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  members: { fontSize: 12, color: colors.text3 },
  badge: {
    backgroundColor: colors.accent + '22',
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  right: { alignItems: 'flex-end', gap: 8 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
  },
  dangerBtn: { backgroundColor: colors.danger + '22' },
  actionIcon: { fontSize: 14 },
  byText: { fontSize: 11, color: colors.text3, marginTop: 4 },
});
