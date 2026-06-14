import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  NativeModules,
} from "react-native";
import { colors, radius, spacing } from "../utils/theme";
import { formatTime12 } from "../utils/alarmUtils";

export default function AlarmRingScreen({ alarm, onDismiss }) {
  const wobble = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (NativeModules.ActivityModule) {
      NativeModules.ActivityModule.showWhenLocked();
    }
    // Wobble animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: -1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: -1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 0,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]),
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Vibration pattern
    const pattern = [0, 500, 300, 500];
    Vibration.vibrate(pattern, true);

    return () => {
      Vibration.cancel();
    };
  }, []);

  const rotate = wobble.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-12deg", "12deg"],
  });

  return (
    <View style={styles.container}>
      {/* Background rings */}
      <Animated.View
        style={[styles.ring, styles.ring3, { transform: [{ scale: pulse }] }]}
      />
      <Animated.View
        style={[styles.ring, styles.ring2, { transform: [{ scale: pulse }] }]}
      />
      <Animated.View
        style={[styles.ring, styles.ring1, { transform: [{ scale: pulse }] }]}
      />

      <View style={styles.content}>
        {/* Clock emoji with wobble */}
        <Animated.Text style={[styles.clockEmoji, { transform: [{ rotate }] }]}>
          ⏰
        </Animated.Text>

        {/* Time */}
        <Animated.Text style={[styles.time, { transform: [{ scale: pulse }] }]}>
          {formatTime12(alarm.time)}
        </Animated.Text>

        {/* Title */}
        <Text style={styles.title}>{alarm.title}</Text>

        {/* Description */}
        {alarm.description ? (
          <Text style={styles.desc}>{alarm.description}</Text>
        ) : null}

        {/* Creator */}
        <Text style={styles.by}>Set by {alarm.creatorName}</Text>

        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onDismiss}
          activeOpacity={0.85}
        >
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  ring: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  ring1: { width: 220, height: 220, opacity: 0.15 },
  ring2: { width: 320, height: 320, opacity: 0.08 },
  ring3: { width: 420, height: 420, opacity: 0.04 },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  clockEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  time: {
    fontFamily: "SpaceMono",
    fontSize: 56,
    fontWeight: "700",
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  desc: {
    fontSize: 15,
    color: colors.text2,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  by: {
    fontSize: 13,
    color: colors.text3,
    marginBottom: spacing.xl * 1.5,
  },
  dismissBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: radius.full,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.bg,
    letterSpacing: 0.5,
  },
});
