import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const OpportunityCard = React.memo(({ opportunity, onPress }) => {
  const handlePress = useCallback(() => onPress?.(opportunity), [opportunity, onPress]);

  const poster = opportunity.poster;
  const posterName = poster?.display_name || poster?.company_name || 'Unknown';

  return (
    <Card onPress={handlePress} style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{opportunity.title}</Text>
        {opportunity.sport && <Badge label={opportunity.sport} variant="primary" />}
      </View>

      {/* Description */}
      <Text style={styles.desc} numberOfLines={2}>{opportunity.description}</Text>

      {/* Meta row */}
      <View style={styles.meta}>
        {opportunity.budget && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Budget</Text>
            <Text style={styles.metaValue}>{opportunity.budget}</Text>
          </View>
        )}
        {opportunity.deadline && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Deadline</Text>
            <Text style={styles.metaValue}>{opportunity.deadline}</Text>
          </View>
        )}
        {opportunity.location && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{opportunity.location}</Text>
          </View>
        )}
      </View>

      {/* Posted by */}
      <View style={styles.footer}>
        <Text style={styles.postedBy}>Posted by </Text>
        <Text style={styles.posterName}>{posterName}</Text>
        <Text style={styles.postedBy}> · {opportunity.posted_by_type}</Text>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card:        { marginBottom: spacing.sm },
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.xs },
  title:       { ...typography.h3, flex: 1, fontSize: 15 },
  desc:        { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  meta:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
  metaItem:    { gap: 2 },
  metaLabel:   { ...typography.label },
  metaValue:   { ...typography.caption, color: colors.textPrimary },
  footer:      { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs },
  postedBy:    { ...typography.caption },
  posterName:  { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
