import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

const VARIANTS = {
  primary:  { bg: colors.primary,         text: colors.white,         activeBg: colors.primaryDark },
  secondary:{ bg: colors.surfaceElevated, text: colors.textPrimary,   activeBg: colors.border },
  outline:  { bg: 'transparent',          text: colors.primary,       activeBg: 'rgba(255,60,60,0.08)', border: colors.primary },
  ghost:    { bg: 'transparent',          text: colors.textSecondary,  activeBg: 'rgba(255,255,255,0.06)' },
  danger:   { bg: 'rgba(255,60,60,0.12)', text: colors.error,         activeBg: 'rgba(255,60,60,0.22)', border: 'rgba(255,60,60,0.3)' },
};

const SIZES = {
  sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[3], fontSize: fontSize.xs },
  md: { paddingVertical: spacing[3], paddingHorizontal: spacing[5], fontSize: fontSize.sm },
  lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[6], fontSize: fontSize.base },
};

export function Button({
  children, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, fullWidth = false, style,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size]       || SIZES.md;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? v.activeBg : v.bg, borderColor: v.border || 'transparent' },
        { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        v.border && styles.bordered,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base:      { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing[2] },
  bordered:  { borderWidth: 1 },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.4 },
  label: {
    fontFamily:  fontFamily.dmSans.semiBold,
    fontWeight:  '600',
    letterSpacing: 0.2,
  },
});
