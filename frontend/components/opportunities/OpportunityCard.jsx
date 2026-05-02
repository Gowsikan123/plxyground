import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../ui/Badge';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontFamily } from '../../constants/typography';

export const OpportunityCard = memo(function OpportunityCard({ opportunity, onPress }) {
  const opp = opportunity;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {opp.sport && <Badge label={opp.sport} variant="primary" style={{ marginBottom: spacing[2] }} />}
          <Text style={styles.title} numberOfLines={2}>{opp.title}</Text>
        </View>
      </View>

      {/* Description preview */}
      <Text style={styles.description} numberOfLines={2}>{opp.description}</Text>

      {/* Meta row */}
      <View style={styles.metaRow}>
        {opp.budget && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>💰 Budget</Text>
            <Text style={styles.metaValue}>{opp.budget}</Text>
          </View>
        )}
        {opp.deadline && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>📅 Deadline</Text>
            <Text style={styles.metaValue}>{opp.deadline}</Text>
          </View>
        )}
        {opp.location && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>📍 Location</Text>
            <Text style={styles.metaValue}>{opp.location}</Text>
          </View>
        )}
      </View>

      {/* Posted by */}
      {opp.poster && (
        <Text style={styles.poster}>
          Posted by {opp.poster.display_name || opp.poster.company_name || 'Unknown'}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius:    radius.lg,
    padding:         spacing[4],
    marginBottom:    spacing[3],
    borderWidth:     1,
    borderColor:     colors.border,
  },
  pressed: { opacity: 0.85 },
  header:  { marginBottom: spacing[2] },
  headerLeft: { flex: 1 },
  title: {
    color:      colors.textPrimary,
    fontSize:   fontSize.md,
    fontFamily: fontFamily.syne.bold,
    fontWeight: '700',
    lineHeight: 24,
  },
  description: {
    color:        colors.textSecondary,
    fontSize:     fontSize.sm,
    fontFamily:   fontFamily.dmSans.regular,
    lineHeight:   20,
    marginBottom: spacing[3],
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[2] },
  metaItem: { gap: 2 },
  metaLabel: { color: colors.textMuted,     fontSize: fontSize.xs, fontFamily: fontFamily.dmSans.regular },
  metaValue: { color: colors.textPrimary,   fontSize: fontSize.sm, fontFamily: fontFamily.dmSans.medium, fontWeight: '500' },
  poster:    { color: colors.textMuted,     fontSize: fontSize.xs, fontFamily: fontFamily.dmSans.regular, marginTop: spacing[1] },
});
