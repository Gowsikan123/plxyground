import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, Radius } from '../../constants/spacing';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
