import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, radius, spacing } from "../utils/theme";
import { Audio } from "expo-av";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = {
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "T",
  fri: "F",
  sat: "S",
  sun: "S",
};

const SOUNDS = [
  { file: "alarm_sound", label: "Default Alarm" },
  { file: "clock_in_darfred", label: "Clock In" },
  { file: "clock_out_darfred", label: "Clock Out" },
  { file: "dawn", label: "Dawn" },
  { file: "classic", label: "Classic" },
  { file: "savour", label: "Savour" },
  { file: "astute", label: "Astute" },
  { file: "poignant", label: "Poignant" },
];

const getSoundLabel = (file) =>
  SOUNDS.find((s) => s.file === file)?.label ?? file;

const SOUND_FILES = {
  alarm_sound: require("../../assets/sounds/alarm_sound.mp3"),
  clock_in_darfred: require("../../assets/sounds/clock_in_darfred.mp3"),
  clock_out_darfred: require("../../assets/sounds/clock_out_darfred.mp3"),
  dawn: require("../../assets/sounds/dawn.mp3"),
  classic: require("../../assets/sounds/classic.mp3"),
  savour: require("../../assets/sounds/savour.mp3"),
  astute: require("../../assets/sounds/astute.mp3"),
  poignant: require("../../assets/sounds/poignant.mp3"),
};

const defaultForm = {
  title: "",
  description: "",
  time: "07:00",
  repeat: "once",
  days: [],
  date: new Date().toISOString(),
};

function SoundPickerModal({ current, onSelect, onClose }) {
  const [preview, setPreview] = useState(current);
  const [playingSound, setPlayingSound] = useState(null);

  const playPreview = async (file) => {
    try {
      if (playingSound) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(SOUND_FILES[file]);
      setPlayingSound(sound);
      await sound.playAsync();
    } catch (e) {
      console.warn("Preview play error:", e);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose ringtone</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {SOUNDS.map((sound) => {
            const active = preview === sound.file;
            return (
              <TouchableOpacity
                key={sound.file}
                style={[soundStyles.row, active && soundStyles.rowActive]}
                onPress={() => setPreview(sound.file)}
              >
                <Text
                  style={[soundStyles.name, active && soundStyles.nameActive]}
                >
                  {sound.label}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <TouchableOpacity onPress={() => playPreview(sound.file)}>
                    <Text style={{ fontSize: 18 }}>▶️</Text>
                  </TouchableOpacity>
                  {active && <Text style={soundStyles.check}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              onSelect(preview);
              onClose();
            }}
          >
            <Text style={styles.saveText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const soundStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowActive: { backgroundColor: colors.accent + "22" },
  name: { fontSize: 15, color: colors.text },
  nameActive: { color: colors.accent, fontWeight: "700" },
  check: { fontSize: 16, color: colors.accent, fontWeight: "700" },
});

// FIX: createAlarm and updateAlarm now received as props instead of used as globals
export default function AlarmModal({
  alarm,
  onSave,
  onClose,
  createAlarm,
  updateAlarm,
}) {
  const [form, setForm] = useState(
    alarm
      ? {
          title: alarm.title || "",
          description: alarm.description || "",
          time: alarm.time || "07:00",
          repeat: alarm.repeat || "once",
          days: alarm.days || [],
          date: alarm.date || new Date().toISOString(),
        }
      : { ...defaultForm },
  );

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSound, setSelectedSound] = useState(
    alarm?.sound || "alarm_sound",
  );

  const timeAsDate = () => {
    const [h, m] = form.time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const handleTimeChange = (_, selected) => {
    setShowTimePicker(false);
    if (!selected) return;
    const h = String(selected.getHours()).padStart(2, "0");
    const m = String(selected.getMinutes()).padStart(2, "0");
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
      days: f.days.includes(day)
        ? f.days.filter((d) => d !== day)
        : [...f.days, day],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const alarmData = { ...form, sound: selectedSound, active: true };

    try {
      if (alarm) {
        await updateAlarm(alarm.id, alarmData);
      } else {
        await createAlarm(alarmData);
      }
      onSave();
      onClose();
    } catch (e) {
      console.error("Failed to save alarm:", e);
    } finally {
      setSaving(false);
    }
  };

  const formatDisplayTime = () => {
    const [h, m] = form.time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `${String(hr).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatDisplayDate = () => {
    const d = new Date(form.date);
    return d.toLocaleDateString("en-PH", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {alarm ? "Edit Alarm" : "New Alarm"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.timeTap}
            onPress={() => setShowTimePicker(true)}
          >
            <Feather
              name="edit-2"
              size={16}
              color={colors.text3}
              style={styles.timeEditIcon}
            />
            <Text style={styles.timeDisplay}>{formatDisplayTime()}</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={timeAsDate()}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          )}

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

          <View style={styles.field}>
            <Text style={styles.label}>Repeat</Text>
            <View style={styles.repeatOptions}>
              {["once", "daily", "weekly"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.repeatBtn,
                    form.repeat === r && styles.repeatActive,
                  ]}
                  onPress={() => setForm((f) => ({ ...f, repeat: r }))}
                >
                  <Text
                    style={[
                      styles.repeatText,
                      form.repeat === r && styles.repeatTextActive,
                    ]}
                  >
                    {r === "once" ? "Once" : r === "daily" ? "Daily" : "Weekly"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {form.repeat === "once" && (
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>{formatDisplayDate()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={new Date(form.date)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          )}

          {form.repeat === "weekly" && (
            <View style={styles.field}>
              <Text style={styles.label}>Days</Text>
              <View style={styles.days}>
                {DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayBtn,
                      form.days.includes(day) && styles.dayActive,
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        form.days.includes(day) && styles.dayTextActive,
                      ]}
                    >
                      {DAY_LABELS[day]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Sound</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowSoundPicker(true)}
            >
              <Text style={styles.inputText}>
                {getSoundLabel(selectedSound)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {showSoundPicker && (
          <SoundPickerModal
            current={selectedSound}
            onSelect={(s) => setSelectedSound(s)}
            onClose={() => setShowSoundPicker(false)}
          />
        )}

        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!form.title.trim() || saving) && styles.saveDisabled,
            ]}
            onPress={handleSave}
            disabled={saving || !form.title.trim()}
          >
            <Text style={styles.saveText}>{saving ? "Saving…" : "Save"}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  cancel: { fontSize: 15, color: colors.text2 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  body: { flex: 1, padding: spacing.md },
  timeTap: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeEditIcon: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  timeDisplay: {
    fontFamily: "SpaceMono",
    fontSize: 48,
    fontWeight: "700",
    color: colors.accent,
  },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text3,
    textTransform: "uppercase",
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
  textarea: { height: 80, textAlignVertical: "top" },
  repeatOptions: { flexDirection: "row", gap: spacing.sm },
  repeatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  repeatActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  repeatText: { fontSize: 13, color: colors.text2, fontWeight: "500" },
  repeatTextActive: { color: colors.bg, fontWeight: "700" },
  days: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayText: { fontSize: 12, color: colors.text2, fontWeight: "600" },
  dayTextActive: { color: colors.bg },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  saveDisabled: { opacity: 0.4 },
  saveText: { fontSize: 16, fontWeight: "700", color: "#000" },
});
