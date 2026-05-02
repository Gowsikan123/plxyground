import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { fontFamily, fontSize } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Badge } from '../ui/Badge';

export const OpportunityCard = memo(function OpportunityCard({ opportunity, onPress }) {
  const { title, description, sport, budget, deadline, location, postedbytype, postername } = opportunity;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {sport && <Badge label={sport} variant="primary" />}
      </View>

      <Text style={styles.description} numberOfLines={2}>{description}</Text>

      <View style={styles.meta}>
        {budget && (
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>💰</Text>
            <Text style={styles.metaText}>{budget}</Text>
          </View>
        )}
        {deadline && (
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{deadline}</Text>
          </View>
        )}
        {location && (
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📍</Text>
            <Text style={styles.metaText}>{location}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.postedBy}>
          Posted by <Text style={styles.posterName}>{postername ?? postedbytype}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.3,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
    marginBottom: spacing[3],
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[3] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  metaIcon: { fontSize: 13 },
  metaText: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  footer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[2] },
  postedBy: {
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  posterName: { color: colors.textSecondary, fontFamily: fontFamily.medium },
});
