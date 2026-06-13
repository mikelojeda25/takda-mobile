import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../utils/theme';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S' };

const defaultForm = {
  title: '',
  description: '',
  time: '07:00',
  repeat: 'once',
  days: [],
  date: new Date().toISOString(),
};

export default function AlarmModal({ alarm, onSave, onClose }) {
  const [form, setForm] = useState(alarm ? {
    title: alarm.title || '',
    description: alarm.description || '',
    time: alarm.time || '07:00',
    repeat: alarm.repeat || 'once',
    days: alarm.days || [],
    date: alarm.date || new Date().toISOString(),
  } : { ...defaultForm });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const timeAsDate = () => {
    const [h, m] = form.time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const handleTimeChange = (_, selected) => {
    setShowTimePicker(false);
    if (!selected) return;
    const h = String(selected.getHours()).padStart(2, '0');
    const m = String(selected.getMinutes()).padStart(2, '0');
    setForm((f) => ({ ...f, time: `${h}:${m}` }));
  };

  const handleDateChange = (_, selected) => {
    setShowDatePicker(false);
    if (!selected) return;
    setForm((f) => ({ ...f, date: selected.toISOString() }));
  };

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const formatDisplayTime = () => {
    const [h, m] = form.time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${String(hr).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const formatDisplayDate = () => {
    const d = new Date(form.date);
    return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{alarm ? 'Edit Alarm' : 'New Alarm'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || !form.title.trim()}>
            <Text style={[styles.save, (!form.title.trim() || saving) && styles.saveDisabled]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Time */}
          <TouchableOpacity style={styles.timeTap} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timeDisplay}>{formatDisplayTime()}</Text>
            <Text style={styles.timeHint}>Tap to change time</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={timeAsDate()}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholder="e.g. Morning standup"
              placeholderTextColor={colors.text3}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="Add a note…"
              placeholderTextColor={colors.text3}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Repeat */}
          <View style={styles.field}>
            <Text style={styles.label}>Repeat</Text>
            <View style={styles.repeatOptions}>
              {['once', 'daily', 'weekly'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.repeatBtn, form.repeat === r && styles.repeatActive]}
                  onPress={() => setForm((f) => ({ ...f, repeat: r }))}
                >
                  <Text style={[styles.repeatText, form.repeat === r && styles.repeatTextActive]}>
                    {r === 'once' ? 'Once' : r === 'daily' ? 'Daily' : 'Weekly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date picker for "once" */}
          {form.repeat === 'once' && (
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>{formatDisplayDate()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(form.date)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          )}

          {/* Day picker for "weekly" */}
          {form.repeat === 'weekly' && (
            <View style={styles.field}>
              <Text style={styles.label}>Days</Text>
              <View style={styles.days}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayBtn, form.days.includes(day) && styles.dayActive]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[styles.dayText, form.days.includes(day) && styles.dayTextActive]}>
                      {DAY_LABELS[day]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Presets */}
              <View style={styles.presets}>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => setForm((f) => ({ ...f, days: ['mon', 'tue', 'wed', 'thu', 'fri'] }))}
                >
                  <Text style={styles.presetText}>Weekdays</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => setForm((f) => ({ ...f, days: ['sat', 'sun'] }))}
                >
                  <Text style={styles.presetText}>Weekends</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => setForm((f) => ({ ...f, days: [...DAYS] }))}
                >
                  <Text style={styles.presetText}>Every day</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancel: { fontSize: 15, color: colors.text2 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  save: { fontSize: 15, color: colors.accent, fontWeight: '700' },
  saveDisabled: { opacity: 0.4 },
  body: { flex: 1, padding: spacing.md },
  timeTap: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeDisplay: {
    fontFamily: 'SpaceMono',
    fontSize: 48,
    fontWeight: '700',
    color: colors.accent,
  },
  timeHint: { fontSize: 12, color: colors.text3, marginTop: 4 },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  inputText: { color: colors.text, fontSize: 15 },
  textarea: { height: 80, textAlignVertical: 'top' },
  repeatOptions: { flexDirection: 'row', gap: spacing.sm },
  repeatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  repeatActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  repeatText: { fontSize: 13, color: colors.text2, fontWeight: '500' },
  repeatTextActive: { color: colors.bg, fontWeight: '700' },
  days: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayText: { fontSize: 12, color: colors.text2, fontWeight: '600' },
  dayTextActive: { color: colors.bg },
  presets: { flexDirection: 'row', gap: 8 },
  presetBtn: {
    flex: 1,
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    alignItems: 'center',
  },
  presetText: { fontSize: 12, color: colors.text2 },
});
