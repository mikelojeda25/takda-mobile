import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuth } from "../contexts/AuthContext";
import { colors, radius, spacing } from "../utils/theme";

export default function InviteScreen({ navigation }) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [alarmTitle, setAlarmTitle] = useState("");

  const handleJoin = async () => {
    if (!code.trim()) return;
    setStatus("joining");
    try {
      const q = query(
        collection(db, "alarms"),
        where("inviteCode", "==", code.trim().toLowerCase()),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setStatus("notfound");
        return;
      }

      const alarmDoc = snap.docs[0];
      const data = alarmDoc.data();
      setAlarmTitle(data.title);

      if (data.members.includes(user.uid)) {
        setStatus("existing");
        return;
      }

      await updateDoc(doc(db, "alarms", alarmDoc.id), {
        members: arrayUnion(user.uid),
        memberDetails: arrayUnion({
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
        }),
      });

      setStatus("done");
      setTimeout(() => navigation.replace("Dashboard"), 2000);
    } catch (e) {
      setStatus("error");
    }
  };

  if (status === "done")
    return (
      <View style={styles.center}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.successText}>You're in!</Text>
        <Text style={styles.hint}>You joined "{alarmTitle}". Redirecting…</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⏰</Text>
        <Text style={styles.title}>Join an Alarm</Text>
        <Text style={styles.subtitle}>
          Enter the invite code shared by your team.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. hde-rfr-1234"
          placeholderTextColor={colors.text3}
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={handleJoin}
        />

        {status === "notfound" && (
          <Text style={styles.error}>❌ Code not found. Try again.</Text>
        )}
        {status === "existing" && (
          <Text style={styles.warn}>✅ You're already a member.</Text>
        )}
        {status === "error" && (
          <Text style={styles.error}>Something went wrong.</Text>
        )}

        <TouchableOpacity
          style={styles.joinBtn}
          onPress={handleJoin}
          disabled={status === "joining"}
        >
          {status === "joining" ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.joinText}>Join Alarm</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace("Dashboard")}>
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
    justifyContent: "center",
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    gap: 12,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.text2, textAlign: "center" },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    color: colors.text,
    fontSize: 15,
  },
  joinBtn: {
    width: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: "center",
  },
  joinText: { fontWeight: "700", fontSize: 15, color: colors.bg },
  cancelText: { fontSize: 14, color: colors.text3, paddingVertical: 4 },
  error: { color: colors.danger, fontSize: 13 },
  warn: { color: colors.success, fontSize: 13 },
  successText: { fontSize: 24, fontWeight: "700", color: colors.text },
  hint: { fontSize: 14, color: colors.text3 },
});
