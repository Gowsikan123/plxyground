import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { colors } from '../../constants/colors';
import { fontFamilies, fontSizes } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const OpportunityCard = React.memo(({ opportunity, onPress }) => {
  const o = opportunity;
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{o.title}</Text>
        {o.sport ? <Badge label={o.sport} variant="info" /> : null}
      </View>
      <Text style={styles.desc} numberOfLines={2}>{o.description}</Text>
      <View style={styles.meta}>
        {o.budget ? <Text style={styles.metaItem}>💰 {o.budget}</Text> : null}
        {o.location ? <Text style={styles.metaItem}>📍 {o.location}</Text> : null}
        {o.deadline ? <Text style={styles.metaItem}>📅 {o.deadline}</Text> : null}
      </View>
      {o.poster_name ? (
        <Text style={styles.poster}>Posted by {o.poster_name}</Text>
      ) : null}
    </Card>
  );
});

OpportunityCard.displayName = 'OpportunityCard';
export default OpportunityCard;

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  title: { flex: 1, fontFamily: fontFamilies.heading, fontSize: fontSizes.lg, color: colors.textPrimary },
  desc: { fontFamily: fontFamilies.body, fontSize: fontSizes.md, color: colors.textSecondary, lineHeight: fontSizes.md * 1.5, marginBottom: spacing.sm },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  metaItem: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.textMuted },
  poster: { fontFamily: fontFamilies.body, fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
});
