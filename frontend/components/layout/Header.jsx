import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export function Header({ title, showLogo = false, rightAction, onBack }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (canGoBack) {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing[2] }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {(canGoBack || onBack) && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.center}>
          {showLogo ? (
            <Text style={styles.logo}>PLXYGROUND</Text>
          ) : (
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          )}
        </View>

        <View style={styles.right}>
          {rightAction}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing[2],
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    height: 44,
  },
  left: { width: 44, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
  backBtn: { padding: spacing[1] },
  backIcon: { color: colors.textPrimary, fontSize: 22 },
  title: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
  },
  logo: {
    color: colors.primary,
    fontFamily: fontFamily.displayExtraBold,
    fontSize: fontSize.lg,
    letterSpacing: 1.5,
  },
});
