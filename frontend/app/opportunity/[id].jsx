import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import SafeScreen from '../../components/layout/SafeScreen';
import ScreenHeader from '../../components/layout/ScreenHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import opportunityService from '../../services/opportunityService';

export default function OpportunityDetail() {
  const { id } = useLocalSearchParams();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await opportunityService.getById(id);
        if (err) throw new Error(err);
        setOpp(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleApply() {
    setApplying(true);
    try {
      const { error: err } = await opportunityService.apply(id);
      if (err) throw new Error(err);
      Alert.alert('Applied! 🎉', 'The business will be in touch.');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <SafeScreen>
        <ScreenHeader title="Opportunity" />
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      </SafeScreen>
    );
  }

  if (error || !opp) {
    return (
      <SafeScreen>
        <ScreenHeader title="Opportunity" />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Not found'}</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScreenHeader title="Opportunity" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Badge label={opp.sport} />
          {opp.is_paid && <Badge label="Paid" variant="success" />}
          {opp.is_remote && <Badge label="Remote" variant="info" />}
        </View>
        <Text style={styles.title}>{opp.title}</Text>
        <Text style={styles.business}>{opp.business_name}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this opportunity</Text>
          <Text style={styles.body}>{opp.description}</Text>
        </View>

        {opp.requirements ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.body}>{opp.requirements}</Text>
          </View>
        ) : null}

        {opp.compensation ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compensation</Text>
            <Text style={styles.body}>{opp.compensation}</Text>
          </View>
        ) : null}

        <View style={styles.deadline}>
          <Text style={styles.deadlineLabel}>Deadline</Text>
          <Text style={styles.deadlineValue}>
            {opp.deadline
              ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Open'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={applying ? 'Applying...' : 'Apply Now'}
          onPress={handleApply}
          disabled={applying}
          fullWidth
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.error, fontFamily: TYPOGRAPHY.fonts.body, fontSize: TYPOGRAPHY.sizes.base },
  header: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  title: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 30,
  },
  business: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: { gap: SPACING.xs },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fonts.display,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  body: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
  deadline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deadlineLabel: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  deadlineValue: {
    fontFamily: TYPOGRAPHY.fonts.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontWeight: '700',
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
});
