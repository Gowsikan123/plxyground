import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';

export function Card({ children, onPress, style, elevated = false }) {
  const content = (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    padding:         spacing[4],
    borderWidth:     1,
    borderColor:     colors.border,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.3,
    shadowRadius:    6,
    elevation:       4,
  },
});
