import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { Button } from './Button';

export const EmptyState = React.memo(({ icon, title, message, actionLabel, onAction, style }) => (
  <View style={[styles.container, style]}>
    {icon && <View style={styles.iconWrap}>{icon}</View>}
    <Text style={styles.title}>{title}</Text>
    {message && <Text style={styles.message}>{message}</Text>}
    {actionLabel && onAction && (
      <Button
        title={actionLabel}
        onPress={onAction}
        variant="secondary"
        style={styles.btn}
      />
    )}
  </View>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  iconWrap: {
    marginBottom: spacing.sm,
    opacity: 0.4,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    maxWidth: 280,
  },
  btn: {
    marginTop: spacing.sm,
  },
});
