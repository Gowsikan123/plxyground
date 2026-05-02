import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

const VARIANTS = {
  success: { bg: 'rgba(0,200,83,0.12)', text: colors.success },
  warning: { bg: 'rgba(255,179,0,0.12)', text: colors.warning },
  error:   { bg: 'rgba(255,60,60,0.12)', text: colors.error },
  info:    { bg: 'rgba(41,128,185,0.15)', text: '#5dade2' },
  default: { bg: colors.surfaceElevated, text: colors.textSecondary },
};

const Badge = React.memo(({ label, variant = 'default', size = 'sm', style }) => {
  const v = VARIANTS[variant] || VARIANTS.default;
  const fontSize = size === 'xs' ? fontSizes.xs - 1 : fontSizes.xs;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text, fontSize }]}>{label}</Text>
    </View>
  );
});

Badge.displayName = 'Badge';
export default Badge;

const styles = StyleSheet.create({
  badge: { paddingVertical: 2, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full, alignSelf: 'flex-start' },
  text: { fontFamily: fontFamilies.bodyMedium },
});
