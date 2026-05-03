import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Badge } from '../ui/Badge';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/spacing';

export function OpportunityCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        {item.sport ? <Badge label={item.sport} /> : null}
      </View>
      <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.footer}>
        {item.budget ? <Text style={styles.meta}>Budget: {item.budget}</Text> : null}
        {item.location ? <Text style={styles.meta}>Location: {item.location}</Text> : null}
        {item.deadline ? <Text style={styles.meta}>Deadline: {item.deadline}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], borderWidth: 1, borderColor: Colors.border, gap: Spacing[2] },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing[2] },
  title: { flex: 1, fontFamily: Typography.fontDisplay, fontSize: Typography.sizes.lg, color: Colors.text },
  desc: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.textMuted },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  meta: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.textMuted },
});
