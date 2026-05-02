import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

export function Input({
  label, placeholder, value, onChangeText,
  error, secureTextEntry = false, keyboardType = 'default',
  autoCapitalize = 'none', autoCorrect = false,
  returnKeyType, onSubmitEditing, multiline = false,
  numberOfLines = 1, editable = true, style, inputRef,
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, focused && styles.focused, !!error && styles.errored, !editable && styles.disabled]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && { height: numberOfLines * 22, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          editable={editable}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setVisible(v => !v)} style={styles.eyeBtn} hitSlop={8}>
            <Text style={styles.eyeText}>{visible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { marginBottom: spacing[4] },
  label:     { color: colors.textSecondary, fontSize: fontSize.xs, fontFamily: fontFamily.dmSans.medium, marginBottom: spacing[1] },
  inputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing[3] },
  focused:   { borderColor: colors.primary },
  errored:   { borderColor: colors.error },
  disabled:  { opacity: 0.5 },
  input:     { flex: 1, color: colors.textPrimary, fontSize: fontSize.base, fontFamily: fontFamily.dmSans.regular, paddingVertical: spacing[3] },
  eyeBtn:    { paddingLeft: spacing[2] },
  eyeText:   { color: colors.textSecondary, fontSize: fontSize.xs, fontFamily: fontFamily.dmSans.medium },
  errorText: { color: colors.error, fontSize: fontSize.xs, marginTop: spacing[1], fontFamily: fontFamily.dmSans.regular },
});
