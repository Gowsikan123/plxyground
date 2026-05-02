import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const variantMap = {
  primary: { bg: 'rgba(255,61,0,0.15)', text: Colors.primary },
  success: { bg: 'rgba(34,197,94,0.15)', text: Colors.success },
  warning: { bg: 'rgba(245,158,11,0.15)', text: Colors.warning },
  error: { bg: 'rgba(239,68,68,0.15)', text: Colors.error },
  info: { bg: 'rgba(59,130,246,0.15)', text: Colors.info },
  muted: { bg: Colors.surfaceElevated, text: Colors.textMuted },
};

export function Badge({ label, variant = 'muted', style }) {
  const v = variantMap[variant] || variantMap.muted;
  return (
    <View style={[styles.base, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontFamily: 'DMSans_500Medium', letterSpacing: 0.3 },
});
