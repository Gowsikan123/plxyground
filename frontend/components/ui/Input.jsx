import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors }   from '../../constants/colors';
import { fontSize } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

export const Input = React.memo(function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType    = 'default',
  autoCapitalize  = 'none',
  autoCorrect     = false,
  multiline       = false,
  numberOfLines   = 1,
  maxLength,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  editable        = true,
}) {
  const [focused, setFocused] = useState(false);
  const [hideText, setHideText] = useState(secureTextEntry);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.container,
        focused  && styles.focused,
        !!error  && styles.errorBorder,
        !editable && styles.disabled,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, multiline && styles.multiline, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hideText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={()  => setFocused(false)}
          editable={editable}
          selectionColor={colors.primary}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHideText(h => !h)} style={styles.rightIcon}>
            <Text style={styles.toggleText}>{hideText ? 'Show' : 'Hide'}</Text>
          </TouchableOpacity>
        )}
        {!secureTextEntry && rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper:     { marginBottom: spacing[4] },
  label:       { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: 'DMSans_500Medium', marginBottom: spacing[1.5] },
  container:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, paddingHorizontal: spacing[4], minHeight: 48 },
  focused:     { borderColor: colors.primary },
  errorBorder: { borderColor: colors.error },
  disabled:    { opacity: 0.5 },
  input:       { flex: 1, color: colors.textPrimary, fontSize: fontSize.base, fontFamily: 'DMSans_400Regular', paddingVertical: spacing[3] },
  multiline:   { minHeight: 100, textAlignVertical: 'top' },
  leftIcon:    { marginRight: spacing[2] },
  rightIcon:   { marginLeft: spacing[2], padding: spacing[1] },
  toggleText:  { color: colors.textSecondary, fontSize: fontSize.xs, fontFamily: 'DMSans_500Medium' },
  errorText:   { color: colors.error, fontSize: fontSize.xs, fontFamily: 'DMSans_400Regular', marginTop: spacing[1] },
});
