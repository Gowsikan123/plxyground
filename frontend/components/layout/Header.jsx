import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export const Header = React.memo(({ title, showLogo = false, rightAction, onBack, showBack }) => {
  const insets     = useSafeAreaInsets();
  const router     = useRouter();
  const navigation = useNavigation();

  const canGoBack   = navigation.canGoBack();
  const shouldShowBack = showBack !== undefined ? showBack : (canGoBack && !showLogo);

  const handleBack = useCallback(() => {
    if (onBack) { onBack(); return; }
    router.back();
  }, [onBack]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {/* Left */}
        <View style={styles.side}>
          {shouldShowBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
              <Text style={styles.backChevron}>‹</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        {showLogo ? (
          <Text style={styles.logo}>PLXYGROUND</Text>
        ) : (
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        )}

        {/* Right */}
        <View style={[styles.side, styles.sideRight]}>
          {rightAction}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inner: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  side:      { width: 48, alignItems: 'flex-start', justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  backBtn:   { padding: spacing.xs },
  backChevron: { ...typography.h2, color: colors.textPrimary, fontSize: 28, lineHeight: 28, marginTop: -2 },
  logo:  { flex: 1, textAlign: 'center', ...typography.h3, color: colors.primary, letterSpacing: 2, textTransform: 'uppercase' },
  title: { flex: 1, textAlign: 'center', ...typography.bodyMd, color: colors.textPrimary },
});
