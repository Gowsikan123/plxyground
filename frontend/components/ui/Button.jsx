import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.bg : Colors.accent} size="small" />
      ) : (
        <Text style={[
          styles.label,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'ghost' && styles.labelGhost,
        ]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[3], paddingHorizontal: Spacing[6], borderRadius: Radius.md, minHeight: 48 },
  primary: { backgroundColor: Colors.accent },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.accent },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  label: { fontFamily: Typography.fontBodyBold, fontSize: Typography.sizes.base, color: Colors.bg },
  labelSecondary: { color: Colors.accent },
  labelGhost: { color: Colors.textMuted },
});
