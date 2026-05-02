import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export function Badge({ label, variant = 'default', style }) {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  default: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  primary: { backgroundColor: colors.primary },
  success: { backgroundColor: colors.success },
  warning: { backgroundColor: colors.warning },
  error: { backgroundColor: colors.error },

  label: { fontFamily: fontFamily.medium, fontSize: fontSize.xs },
  label_default: { color: colors.textSecondary },
  label_primary: { color: colors.white },
  label_success: { color: '#000' },
  label_warning: { color: '#000' },
  label_error: { color: colors.white },
});
