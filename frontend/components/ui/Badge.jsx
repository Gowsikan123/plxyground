import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

const VARIANTS = {
  default: { bg: colors.surfaceElevated, text: colors.textSecondary, border: colors.border },
  primary: { bg: 'rgba(255,60,60,0.12)',  text: colors.primary,        border: 'rgba(255,60,60,0.3)' },
  success: { bg: 'rgba(0,200,83,0.12)',   text: colors.success,        border: 'rgba(0,200,83,0.3)' },
  warning: { bg: 'rgba(255,179,0,0.12)',  text: colors.warning,        border: 'rgba(255,179,0,0.3)' },
  error:   { bg: 'rgba(255,60,60,0.12)',  text: colors.error,          border: 'rgba(255,60,60,0.3)' },
};

export const Badge = React.memo(({ label, variant = 'default', style }) => {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.label,
    fontSize: 11,
  },
});
