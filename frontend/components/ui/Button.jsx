import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const Button = React.memo(({ title, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, icon, style, textStyle }) => {
  const handlePress = useCallback(() => {
    if (!loading && !disabled) onPress?.();
  }, [onPress, loading, disabled]);

  const containerStyle = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    (loading || disabled) && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      disabled={loading || disabled}
      style={containerStyle}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, styles[`text_${variant}`], styles[`labelSize_${size}`], textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },

  variant_primary:  { backgroundColor: colors.primary },
  variant_secondary:{ backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  variant_ghost:    { backgroundColor: colors.transparent },
  variant_danger:   { backgroundColor: 'rgba(255,60,60,0.12)', borderWidth: 1, borderColor: 'rgba(255,60,60,0.3)' },
  variant_success:  { backgroundColor: 'rgba(0,200,83,0.12)', borderWidth: 1, borderColor: 'rgba(0,200,83,0.3)' },

  text_primary:   { color: colors.white },
  text_secondary: { color: colors.textPrimary },
  text_ghost:     { color: colors.textSecondary },
  text_danger:    { color: colors.error },
  text_success:   { color: colors.success },

  size_sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minHeight: 36 },
  size_md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2, minHeight: 48 },
  size_lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: 56 },

  label:       { ...typography.button },
  labelSize_sm:{ fontSize: 13 },
  labelSize_md:{ fontSize: 15 },
  labelSize_lg:{ fontSize: 17 },
});
