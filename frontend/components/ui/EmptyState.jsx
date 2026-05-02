import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';
import { Button } from './Button';

export function EmptyState({ icon, title, message, actionLabel, onAction, style }) {
  return (
    <View style={[styles.container, style]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="md"
          onPress={onAction}
          style={{ marginTop: spacing[4] }}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical:   spacing[16],
    paddingHorizontal: spacing[6],
  },
  icon: {
    fontSize:     40,
    marginBottom: spacing[4],
  },
  title: {
    color:        colors.textPrimary,
    fontSize:     fontSize.md,
    fontFamily:   fontFamily.syne.bold,
    fontWeight:   '700',
    textAlign:    'center',
    marginBottom: spacing[2],
  },
  message: {
    color:      colors.textSecondary,
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.dmSans.regular,
    textAlign:  'center',
    maxWidth:   280,
    lineHeight: 20,
  },
});
