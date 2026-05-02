import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

export default function OpportunityDetailCard({ opportunity, onApply, applying }) {
  if (!opportunity) return null;

  const {
    title,
    description,
    budget,
    content_type,
    deadline,
    requirements,
    business_name,
    business_logo,
    is_open,
  } = opportunity;

  const deadlineDate = deadline ? new Date(deadline).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : null;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.businessRow}>
        <Avatar uri={business_logo} initials={business_name?.[0] ?? 'B'} size={44} />
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business_name}</Text>
          <Badge label={is_open ? 'Open' : 'Closed'} variant={is_open ? 'success' : 'default'} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.tagsRow}>
        {content_type ? <Badge label={content_type} variant="outline" /> : null}
        {budget ? (
          <View style={styles.budgetChip}>
            <Ionicons name="cash-outline" size={14} color={COLORS.success} />
            <Text style={styles.budgetText}>£{budget}</Text>
          </View>
        ) : null}
        {deadlineDate ? (
          <View style={styles.budgetChip}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.budgetText}>{deadlineDate}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>About this opportunity</Text>
      <Text style={styles.description}>{description}</Text>

      {requirements ? (
        <>
          <Text style={styles.sectionLabel}>Requirements</Text>
          <Text style={styles.description}>{requirements}</Text>
        </>
      ) : null}

      <Button
        label={applying ? 'Submitting…' : 'Apply Now'}
        onPress={onApply}
        disabled={!is_open || applying}
        loading={applying}
        style={styles.applyBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  businessInfo: {
    gap: 4,
  },
  businessName: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  title: {
    ...TYPOGRAPHY.bodyLg,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  budgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.textMuted,
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelMd,
    color: COLORS.text,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  description: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  applyBtn: {
    marginTop: SPACING.lg,
  },
});
