import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Clipboard,
  ToastAndroid,
  Platform,
} from 'react-native';
import { colors, radius, spacing } from '../utils/theme';

export default function InviteModal({ alarm, onClose }) {
  // Deep link format — update scheme to match your app
  const link = `takda://invite/${alarm.id}`;

  const handleShare = async () => {
    await Share.share({
      message: `Join my alarm "${alarm.title}" on Takda!\n\n${link}`,
      title: 'Join Takda alarm',
    });
  };

  const handleCopy = () => {
    Clipboard.setString(link);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Link copied!', ToastAndroid.SHORT);
    }
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <Text style={styles.title}>Invite teammates</Text>
          <Text style={styles.subtitle}>
            Share this link — when they open it, they'll join{'\n'}"{alarm.title}" automatically.
          </Text>

          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>Copy link</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    margin: spacing.md,
    marginBottom: spacing.xl,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.text2, textAlign: 'center', lineHeight: 20 },
  linkBox: {
    width: '100%',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  linkText: { fontSize: 13, color: colors.text3, fontFamily: 'SpaceMono' },
  shareBtn: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: colors.bg },
  copyBtn: {
    width: '100%',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyBtnText: { fontSize: 15, color: colors.text2 },
  cancelText: { fontSize: 14, color: colors.text3, paddingVertical: 4 },
});
