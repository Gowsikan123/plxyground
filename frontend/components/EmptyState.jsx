import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from './theme';

export default function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingTop: 72, paddingHorizontal: 40 },
  icon:  { fontSize: 44, marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  sub:   { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
