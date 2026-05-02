import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export function Input({
  label,
  error,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  editable = true,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  inputRef,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError, !editable && styles.inputDisabled]}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.multiline,
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={editable}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing[4] },
  label: {
    color: colors.textSecondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    marginBottom: spacing[1] + 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[4],
  },
  inputError: { borderColor: colors.error },
  inputDisabled: { opacity: 0.5 },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    paddingVertical: spacing[3] + 2,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing[3],
  },
  eyeBtn: { paddingLeft: spacing[2] },
  eyeText: { fontSize: fontSize.md },
  errorText: {
    color: colors.error,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },
});
