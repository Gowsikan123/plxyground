import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

const Card = React.memo(({ children, style, onPress }) => {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
});

Card.displayName = 'Card';
export default Card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: { opacity: 0.85 },
});
