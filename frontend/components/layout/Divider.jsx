import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';

/**
 * Divider — a thin horizontal rule using the border token.
 * Pass `spacing` to add vertical margin above and below.
 */
export default function Divider({ spacing = 0, style }) {
  return (
    <View
      style={[
        styles.line,
        spacing ? { marginVertical: spacing } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: COLORS.border,
    width: '100%',
  },
});
