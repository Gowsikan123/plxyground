import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export function Input({ label, error, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.textFaint}
        style={[
          styles.input,
          focused && styles.focused,
          error && styles.errorBorder,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing[1] },
  label: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.sm, color: Colors.textMuted },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingVertical: Spacing[3], paddingHorizontal: Spacing[4], fontSize: Typography.sizes.base, color: Colors.text, minHeight: 48 },
  focused: { borderColor: Colors.accent },
  errorBorder: { borderColor: Colors.error },
  error: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.error },
});
