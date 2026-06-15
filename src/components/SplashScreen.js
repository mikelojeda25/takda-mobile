import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../utils/theme";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>TAKDA</Text>
      <Text style={styles.tagline}>group alarms, in sync</Text>
      <ActivityIndicator
        size="small"
        color={colors.accent}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontFamily: "SpaceMono",
    fontSize: 36,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 6,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: colors.text2,
    marginBottom: 48,
  },
  spinner: {
    opacity: 0.6,
  },
});
