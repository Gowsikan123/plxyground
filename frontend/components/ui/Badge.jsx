import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

const VARIANTS = {
  default: { bg: colors.surfaceElevated, text: colors.textSecondary, border: colors.border },
  primary: { bg: 'rgba(255,60,60,0.12)',  text: colors.primary,       border: 'rgba(255,60,60,0.25)' },
  success: { bg: 'rgba(0,200,83,0.12)',   text: colors.success,       border: 'rgba(0,200,83,0.25)' },
  warning: { bg: 'rgba(255,179,0,0.12)',  text: colors.warning,       border: 'rgba(255,179,0,0.25)' },
  error:   { bg: 'rgba(255,60,60,0.12)',  text: colors.error,         border: 'rgba(255,60,60,0.25)' },
};

export function Badge({ label, variant = 'default', style }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }, style]}>
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth:      1,
    borderRadius:     radius.full,
    paddingVertical:  spacing[1],
    paddingHorizontal: spacing[2] + 2,
    alignSelf:        'flex-start',
  },
  label: {
    fontSize:    fontSize.xs,
    fontFamily:  fontFamily.dmSans.semiBold,
    fontWeight:  '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
