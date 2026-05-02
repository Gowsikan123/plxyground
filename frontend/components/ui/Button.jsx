import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors }      from '../../constants/colors';
import { fontSize }    from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const Button = React.memo(function Button({
  title,
  onPress,
  variant   = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size      = 'md',      // 'sm' | 'md' | 'lg'
  disabled  = false,
  loading   = false,
  fullWidth = false,
  leftIcon,
  style,
  textStyle,
}) {
  const vs = variantStyles[variant] || variantStyles.primary;
  const ss = sizeStyles[size]       || sizeStyles.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        ss.container,
        vs.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <Text style={[styles.text, ss.text, { color: vs.textColor }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const variantStyles = {
  primary: {
    container: { backgroundColor: colors.primary },
    textColor: colors.white,
  },
  secondary: {
    container: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
    textColor: colors.textPrimary,
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    textColor: colors.textSecondary,
  },
  danger: {
    container: { backgroundColor: 'rgba(255,60,60,0.12)', borderWidth: 1, borderColor: 'rgba(255,60,60,0.3)' },
    textColor: colors.error,
  },
};

const sizeStyles = {
  sm: { container: { paddingHorizontal: spacing[3], paddingVertical: spacing[1.5], borderRadius: borderRadius.md },  text: { fontSize: fontSize.xs } },
  md: { container: { paddingHorizontal: spacing[5], paddingVertical: spacing[3],   borderRadius: borderRadius.lg },  text: { fontSize: fontSize.sm } },
  lg: { container: { paddingHorizontal: spacing[6], paddingVertical: spacing[4],   borderRadius: borderRadius.xl },  text: { fontSize: fontSize.base } },
};

const styles = StyleSheet.create({
  base:      { alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  disabled:  { opacity: 0.45 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  icon:      { marginRight: spacing[1] },
  text:      { fontFamily: 'DMSans_600SemiBold', letterSpacing: 0.2 },
});
