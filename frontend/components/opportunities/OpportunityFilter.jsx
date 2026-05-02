import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const SPORT_FILTERS = [
  { key: 'all', label: 'All Sports' },
  { key: 'basketball', label: '🏀 Basketball' },
  { key: 'football', label: '⚽ Football' },
  { key: 'athletics', label: '🏃 Athletics' },
  { key: 'tennis', label: '🎾 Tennis' },
  { key: 'boxing', label: '🥊 Boxing' },
];

export default function OpportunityFilter({ active, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {SPORT_FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.chip, active === f.key && styles.chipActive]}
          onPress={() => onChange(f.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: active === f.key }}
        >
          <Text style={[styles.chipText, active === f.key && styles.chipTextActive]}>
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  chipTextActive: { color: '#fff' },
});
