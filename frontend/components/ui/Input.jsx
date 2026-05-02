import React, { useState, useCallback, forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const Input = forwardRef(({ label, error, hint, secureToggle = false, icon, rightElement, containerStyle, inputStyle, ...props }, ref) => {
  const [secure, setSecure] = useState(props.secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  const toggleSecure = useCallback(() => setSecure(s => !s), []);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, focused && styles.focused, error && styles.errBorder]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          ref={ref}
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureToggle ? secure : props.secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity onPress={toggleSecure} style={styles.icon}>
            <Text style={styles.toggleTxt}>{secure ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
        {rightElement && <View style={styles.icon}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {!error && hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper:    { marginBottom: spacing.md },
  label:      { ...typography.label, marginBottom: spacing.xs, color: colors.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  focused:    { borderColor: colors.primary },
  errBorder:  { borderColor: colors.error },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
  },
  icon:       { paddingHorizontal: spacing.xs },
  toggleTxt:  { ...typography.caption, color: colors.primary },
  error:      { ...typography.caption, color: colors.error,         marginTop: spacing.xs },
  hint:       { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
