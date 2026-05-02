import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors }  from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

export const Card = React.memo(function Card({ children, onPress, style, contentStyle }) {
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        style={[styles.card, style]}
      >
        <View style={contentStyle}>{children}</View>
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.card, style]}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    borderRadius.xl,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         spacing[4],
    overflow:        'hidden',
  },
});
