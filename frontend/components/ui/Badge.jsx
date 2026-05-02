import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export function Badge({ label, color = Colors.accent }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 2, paddingHorizontal: Spacing[2], borderRadius: Radius.full, borderWidth: 1 },
  text: { fontFamily: Typography.fontBodyMedium, fontSize: Typography.sizes.xs },
});
