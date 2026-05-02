import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Video' },
  { key: 'photo', label: 'Photo' },
  { key: 'blog', label: 'Blog' },
  { key: 'podcast', label: 'Podcast' },
];

export default function FeedFilter({ active, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.pill, active === f.key && styles.pillActive]}
          onPress={() => onChange(f.key)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityState={{ selected: active === f.key }}
        >
          <Text style={[styles.label, active === f.key && styles.labelActive]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  label: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.textMuted,
  },
  labelActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
