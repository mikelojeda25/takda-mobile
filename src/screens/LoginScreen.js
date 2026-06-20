import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { colors, radius, spacing } from "../utils/theme";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [signing, setSigning] = React.useState(false);

  const handleLogin = async () => {
    setSigning(true);
    await login();
    setSigning(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.logoSection}>
        <View style={styles.iconWrap}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>TAKDA</Text>
        <Text style={styles.sub}>by Michael Joseph Ojeda</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.headline}>MIND. GOAL. TIME.</Text>
        <Text style={styles.hint}>
          Set an alarm once — your whole team wakes up together.
        </Text>

        <TouchableOpacity
          style={[styles.googleBtn, signing && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={signing}
          activeOpacity={0.85}
        >
          {signing ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <>
              <Image
                source={{
                  uri: "https://developers.google.com/identity/images/g-logo.png",
                }}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          By signing in, you agree to sync alarms with your team.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: spacing.xl * 1.5,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  iconImage: {
    width: 72,
    height: 72,
  },
  title: {
    fontFamily: "SpaceMono",
    fontSize: 32,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 4,
  },
  sub: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 30,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 14,
    color: colors.text2,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    gap: 10,
    marginBottom: spacing.md,
  },
  googleIcon: {
    width: 22,
    height: 22,
    backgroundColor: "#fff",
    borderRadius: 11,
  },
  googleText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.bg,
  },
  legal: {
    fontSize: 11,
    color: colors.text3,
    textAlign: "center",
    lineHeight: 16,
  },
});
