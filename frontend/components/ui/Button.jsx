import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

const Button = React.memo(({ label, onPress, variant = 'primary', loading = false, disabled = false, fullWidth = false, size = 'md', style }) => {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';
export default Button;

const styles = StyleSheet.create({
  base: { borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },

  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: '#3d0d0d' },
  ghost: { backgroundColor: 'transparent' },

  size_sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, minHeight: 34 },
  size_md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minHeight: 44 },
  size_lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },

  label: { fontFamily: fontFamilies.bodyMedium },
  label_primary: { color: colors.white },
  label_secondary: { color: colors.textPrimary },
  label_danger: { color: colors.error },
  label_ghost: { color: colors.primary },

  labelSize_sm: { fontSize: fontSizes.xs },
  labelSize_md: { fontSize: fontSizes.md },
  labelSize_lg: { fontSize: fontSizes.lg },
});
