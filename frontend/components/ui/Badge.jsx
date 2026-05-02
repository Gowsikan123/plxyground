import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors }   from '../../constants/colors';
import { fontSize } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

const VARIANTS = {
  default: { bg: colors.surfaceElevated, text: colors.textSecondary },
  primary: { bg: 'rgba(255,60,60,0.15)',  text: colors.primary       },
  success: { bg: 'rgba(0,200,83,0.14)',   text: colors.success       },
  warning: { bg: 'rgba(255,179,0,0.14)',  text: colors.warning       },
  error:   { bg: 'rgba(255,60,60,0.14)',  text: colors.error         },
};

export const Badge = React.memo(function Badge({ label, variant = 'default', style }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <View style={[styles.base, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius:    borderRadius.full,
    paddingHorizontal: spacing[2.5],
    paddingVertical:   spacing[0.5],
    alignSelf:       'flex-start',
  },
  text: {
    fontSize:    fontSize.xs,
    fontFamily:  'DMSans_600SemiBold',
    letterSpacing: 0.3,
  },
});
