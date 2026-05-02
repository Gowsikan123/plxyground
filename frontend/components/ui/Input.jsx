import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

const Input = React.memo(({ label, value, onChangeText, placeholder, secureTextEntry = false, error, hint, multiline = false, maxLength, keyboardType = 'default', autoCapitalize = 'none', rightIcon, leftIcon, style, inputStyle }) => {
  const [showPwd, setShowPwd] = useState(false);
  const actualSecure = secureTextEntry && !showPwd;

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, !!error && styles.errorBorder]}>
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={actualSecure}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeft,
            (rightIcon || secureTextEntry) && styles.inputWithRight,
            multiline && styles.multiline,
            inputStyle,
          ]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setShowPwd((v) => !v)} style={styles.iconRight}>
            <Text style={styles.toggleText}>{showPwd ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : rightIcon ? (
          <View style={styles.iconRight}>{rightIcon}</View>
        ) : null}
      </View>
      {maxLength && value ? (
        <Text style={styles.counter}>{value.length}/{maxLength}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

Input.displayName = 'Input';
export default Input;

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm, overflow: 'hidden' },
  errorBorder: { borderColor: colors.error },
  input: { flex: 1, fontFamily: fontFamilies.body, fontSize: fontSizes.md, color: colors.textPrimary, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, minHeight: 44 },
  inputWithLeft: { paddingLeft: spacing.xs },
  inputWithRight: { paddingRight: spacing.xs },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  iconLeft: { paddingLeft: spacing.md },
  iconRight: { paddingRight: spacing.md },
  toggleText: { fontFamily: fontFamilies.bodyMedium, fontSize: fontSizes.xs, color: colors.primary },
  error: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.error, marginTop: spacing.xs },
  hint: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
  counter: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
});
