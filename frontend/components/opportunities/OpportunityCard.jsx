import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors }      from '../../constants/colors';
import { fontSize }    from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';
import { Badge }  from '../ui/Badge';
import { Avatar } from '../ui/Avatar';

export const OpportunityCard = React.memo(function OpportunityCard({ opportunity, onPress }) {
  const handlePress = useCallback(() => onPress && onPress(opportunity), [opportunity, onPress]);

  const poster = opportunity.poster;
  const posterName = poster?.display_name || poster?.company_name || poster?.username || 'Unknown';
  const posterAvatar = poster?.avatar_url || poster?.logo_url || null;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={2}>{opportunity.title}</Text>
          {opportunity.sport && (
            <Badge label={opportunity.sport} variant="primary" style={styles.sportBadge} />
          )}
        </View>
      </View>

      {/* Description preview */}
      <Text style={styles.description} numberOfLines={2}>{opportunity.description}</Text>

      {/* Meta row */}
      <View style={styles.metaRow}>
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
            <Text style={styles.metaValue} numberOfLines={1}>{opportunity.location}</Text>
          </View>
        )}
      </View>

      {/* Poster */}
      <View style={styles.poster}>
        <Avatar uri={posterAvatar} name={posterName} size="xs" />
        <Text style={styles.posterName} numberOfLines={1}>
          Posted by <Text style={styles.posterBold}>{posterName}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius:    borderRadius.xl,
    borderWidth:     1,
    borderColor:     '#2A2A2A',
    padding:         spacing[4],
    marginHorizontal: spacing[4],
    marginBottom:    spacing[3],
  },
  header:      { marginBottom: spacing[2] },
  headerLeft:  { gap: spacing[2] },
  title:       { color: colors.textPrimary, fontSize: fontSize.md, fontFamily: 'Syne_700Bold', lineHeight: 24 },
  sportBadge:  {},
  description: { color: colors.textSecondary, fontSize: fontSize.sm, fontFamily: 'DMSans_400Regular', lineHeight: 20, marginBottom: spacing[3] },
  metaRow:     { flexDirection: 'row', gap: spacing[4], flexWrap: 'wrap', marginBottom: spacing[3] },
  metaItem:    { gap: 2 },
  metaLabel:   { color: colors.textMuted,    fontSize: fontSize.xs, fontFamily: 'DMSans_500Medium' },
  metaValue:   { color: colors.textPrimary,  fontSize: fontSize.sm, fontFamily: 'DMSans_600SemiBold' },
  poster:      { flexDirection: 'row', alignItems: 'center', gap: spacing[2], borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: spacing[3], marginTop: spacing[1] },
  posterName:  { color: colors.textMuted, fontSize: fontSize.xs, fontFamily: 'DMSans_400Regular', flex: 1 },
  posterBold:  { color: colors.textSecondary, fontFamily: 'DMSans_600SemiBold' },
});
