import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors }   from '../../constants/colors';
import { fontSize } from '../../constants/typography';
import { spacing }  from '../../constants/spacing';

export const Header = React.memo(function Header({
  title,
  showLogo  = false,
  rightAction,
  onBack,
  showBack,
}) {
  const router     = useRouter();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const canGoBack  = showBack !== undefined ? showBack : navigation.canGoBack();

  const handleBack = onBack || (() => router.back());

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {/* Left — back button */}
        {canGoBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.sideSlot} hitSlop={12}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sideSlot} />
        )}

        {/* Centre — title or logo */}
        <View style={styles.centre}>
          {showLogo ? (
            <Text style={styles.logo}>PLXYGROUND</Text>
          ) : (
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          )}
        </View>

        {/* Right — action */}
        <View style={[styles.sideSlot, styles.rightSlot]}>
          {rightAction || null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  inner: {
    height:         52,
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: spacing[4],
  },
  sideSlot:  { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  rightSlot: { alignItems: 'flex-end' },
  centre:    { flex: 1, alignItems: 'center' },
  logo:      { color: colors.primary, fontSize: fontSize.base, fontFamily: 'Syne_700Bold', letterSpacing: 2 },
  title:     { color: colors.textPrimary, fontSize: fontSize.base, fontFamily: 'Syne_600SemiBold' },
  backText:  { color: colors.textPrimary, fontSize: fontSize.lg },
});
