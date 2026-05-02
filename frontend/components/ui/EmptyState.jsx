import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';

export function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📭</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8], gap: Spacing[3] },
  emoji: { fontSize: 48 },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.xl, color: Colors.text, textAlign: 'center' },
  message: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted, textAlign: 'center', maxWidth: 280 },
  btn: { marginTop: Spacing[2], paddingHorizontal: Spacing[8] },
});
