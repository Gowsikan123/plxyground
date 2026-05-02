import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export function Input({ label, error, secureTextEntry, style, containerStyle, ...props }) {
  const [hidden, setHidden] = useState(secureTextEntry || false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, focused && styles.focused, error && styles.errBorder]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textFaint}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.eye}>
            <Text style={styles.eyeText}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: Colors.textMuted, fontSize: 13, fontFamily: 'DMSans_500Medium', marginBottom: 6, letterSpacing: 0.3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10 },
  focused: { borderColor: Colors.primary },
  errBorder: { borderColor: Colors.error },
  input: { flex: 1, color: Colors.text, fontSize: 15, fontFamily: 'DMSans_400Regular', paddingHorizontal: 14, paddingVertical: 13 },
  eye: { paddingHorizontal: 12 },
  eyeText: { fontSize: 16 },
  errorText: { color: Colors.error, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 4 },
});
