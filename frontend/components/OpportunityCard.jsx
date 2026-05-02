import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Colors } from '../constants/colors';

export function OpportunityCard({ opportunity }) {
  const isBusinessPosted = opportunity.posted_by_type === 'business';
  const posterName = isBusinessPosted
    ? opportunity.poster?.company_name
    : opportunity.poster?.display_name;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Badge label={isBusinessPosted ? '🏢 Business' : '🎬 Creator'} variant={isBusinessPosted ? 'info' : 'primary'} />
        {opportunity.sport && <Badge label={opportunity.sport} variant="muted" />}
      </View>
      <Text style={styles.title} numberOfLines={2}>{opportunity.title}</Text>
      <Text style={styles.description} numberOfLines={3}>{opportunity.description}</Text>
      <View style={styles.footer}>
        {posterName && <Text style={styles.poster}>{posterName}</Text>}
        {opportunity.budget && (
          <View style={styles.budgetWrap}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budget}>{opportunity.budget}</Text>
          </View>
        )}
      </View>
      {opportunity.deadline && (
        <Text style={styles.deadline}>Deadline: {opportunity.deadline}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  title: { color: Colors.text, fontSize: 15, fontFamily: 'Syne_700Bold', lineHeight: 21, marginBottom: 6 },
  description: { color: Colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 19, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  poster: { color: Colors.primary, fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  budgetWrap: { alignItems: 'flex-end' },
  budgetLabel: { color: Colors.textFaint, fontSize: 10, fontFamily: 'DMSans_400Regular' },
  budget: { color: Colors.success, fontSize: 13, fontFamily: 'Syne_700Bold' },
  deadline: { color: Colors.textFaint, fontSize: 11, fontFamily: 'DMSans_400Regular', marginTop: 8 },
});
