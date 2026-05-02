import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Colors } from '../../constants/colors';

export function EmptyState({ icon = '📭', title, message, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { color: Colors.text, fontSize: 18, fontFamily: 'Syne_700Bold', textAlign: 'center', marginBottom: 8 },
  message: { color: Colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  button: { minWidth: 160 },
});
