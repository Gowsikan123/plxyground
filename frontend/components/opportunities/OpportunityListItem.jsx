import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';

export default function OpportunityListItem({ opportunity }) {
  const router = useRouter();
  if (!opportunity) return null;

  const { id, title, business_name, business_logo, budget, content_type, is_open, deadline } = opportunity;

  const deadlineDate = deadline
    ? new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/opportunity/${id}`)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`View opportunity: ${title}`}
    >
      <Avatar uri={business_logo} initials={business_name?.[0] ?? 'B'} size={44} />

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.business} numberOfLines={1}>{business_name}</Text>
        <View style={styles.meta}>
          {content_type ? <Badge label={content_type} variant="outline" /> : null}
          {budget ? (
            <Text style={styles.budget}>£{budget}</Text>
          ) : null}
          {deadlineDate ? (
            <View style={styles.deadlineRow}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.deadline}>{deadlineDate}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {!is_open && <Badge label="Closed" variant="default" />}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 72,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...TYPOGRAPHY.bodyMd,
    fontWeight: '700',
    color: COLORS.text,
  },
  business: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textMuted,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 4,
  },
  budget: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.success,
    fontWeight: '700',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deadline: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.textMuted,
  },
  right: {
    alignItems: 'center',
    gap: 4,
  },
});
