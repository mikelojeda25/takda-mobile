import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAlarms } from '../hooks/useAlarms';
import { useAuth } from '../contexts/AuthContext';
import { colors, radius, spacing } from '../utils/theme';
import { formatTime12 } from '../utils/alarmUtils';

export default function InviteScreen({ route, navigation }) {
  const { alarmId } = route.params || {};
  const { user } = useAuth();
  const { joinAlarm } = useAlarms();
  const [alarm, setAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!alarmId) return;
    getDoc(doc(db, 'alarms', alarmId)).then((snap) => {
      if (snap.exists()) setAlarm({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [alarmId]);

  const handleJoin = async () => {
    await joinAlarm(alarmId);
    setJoined(true);
    setTimeout(() => navigation.replace('Dashboard'), 1500);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!alarm) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Invite not found</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (joined) {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successText}>Joined!</Text>
        <Text style={styles.hint}>Going to your alarms…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.inviteLabel}>You're invited to join</Text>
        <Text style={styles.alarmTime}>{formatTime12(alarm.time)}</Text>
        <Text style={styles.alarmTitle}>{alarm.title}</Text>
        {alarm.description ? <Text style={styles.alarmDesc}>{alarm.description}</Text> : null}
        <Text style={styles.by}>Created by {alarm.creatorName}</Text>

        <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
          <Text style={styles.joinText}>Join this alarm</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.cancelText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  inviteLabel: { fontSize: 13, color: colors.text3, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 0.8 },
  alarmTime: { fontFamily: 'SpaceMono', fontSize: 42, fontWeight: '700', color: colors.accent, marginBottom: 4 },
  alarmTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  alarmDesc: { fontSize: 14, color: colors.text2, marginBottom: spacing.sm, textAlign: 'center' },
  by: { fontSize: 12, color: colors.text3, marginBottom: spacing.lg },
  joinBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: spacing.md,
  },
  joinText: { fontSize: 16, fontWeight: '700', color: colors.bg },
  cancelText: { fontSize: 14, color: colors.text3 },
  btn: { backgroundColor: colors.surface2, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 24 },
  btnText: { color: colors.text2, fontSize: 14 },
  errorText: { fontSize: 18, color: colors.text2 },
  successIcon: { fontSize: 56 },
  successText: { fontSize: 24, fontWeight: '700', color: colors.text },
  hint: { fontSize: 14, color: colors.text3 },
});
