import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const Header = React.memo(({ title, showLogo = false, rightAction, onBack, hideBack = false }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const canGoBack = navigation.canGoBack();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.left}>
        {!hideBack && canGoBack ? (
          <Pressable onPress={onBack || (() => navigation.goBack())} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.center}>
        {showLogo ? (
          <Text style={styles.logo}>PLXYGROUND</Text>
        ) : (
          <Text style={styles.title}>{title}</Text>
        )}
      </View>

      <View style={styles.right}>
        {rightAction || null}
      </View>
    </View>
  );
});

Header.displayName = 'Header';
export default Header;

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { width: 44, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 44, alignItems: 'flex-end' },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: fontSizes.xl, color: colors.textPrimary },
  logo: { fontFamily: fontFamilies.heading, fontSize: fontSizes.xl, color: colors.primary, letterSpacing: 1.5 },
  title: { fontFamily: fontFamilies.heading, fontSize: fontSizes.lg, color: colors.textPrimary },
});
