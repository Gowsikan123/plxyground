import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { opportunityService } from '../../services/opportunityService';
import { useAuthStore } from '../../store/authStore';

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await opportunityService.getById(id);
      if (err) { setError(err); setLoading(false); return; }
      setOpportunity(data);
      setLoading(false);
    })();
  }, [id]);

  const handleApply = async () => {
    if (!token) { router.push('/login'); return; }
    setApplying(true);
    const { error: err } = await opportunityService.apply(id);
    setApplying(false);
    if (err) {
      Alert.alert('Error', err);
    } else {
      Alert.alert('Applied!', 'Your application has been submitted.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !opportunity) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Opportunity not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.title}>{opportunity.title}</Text>
            <Text style={styles.company}>{opportunity.business_name}</Text>
          </View>

          <View style={styles.tags}>
            {opportunity.sport ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{opportunity.sport}</Text>
              </View>
            ) : null}
            {opportunity.deal_type ? (
              <View style={[styles.tag, styles.tagSecondary]}>
                <Text style={styles.tagText}>{opportunity.deal_type}</Text>
              </View>
            ) : null}
          </View>

          {opportunity.budget ? (
            <View style={styles.budgetRow}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              <Text style={styles.budget}>£{opportunity.budget}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{opportunity.description}</Text>

          {opportunity.requirements ? (
            <>
              <Text style={styles.sectionTitle}>Requirements</Text>
              <Text style={styles.description}>{opportunity.requirements}</Text>
            </>
          ) : null}

          <View style={styles.metaGrid}>
            {opportunity.deadline ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>
                  Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
            {opportunity.min_followers ? (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.metaText}>
                  Min followers: {opportunity.min_followers.toLocaleString()}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
          onPress={handleApply}
          disabled={applying}
        >
          {applying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.applyBtnText}>Apply Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  backRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.xs },
  backLabel: { color: COLORS.text, ...TYPOGRAPHY.body },
  body: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  header: { marginBottom: SPACING.md },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: 4 },
  company: { ...TYPOGRAPHY.label, color: COLORS.textMuted },
  tags: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md },
  tag: { backgroundColor: COLORS.primaryLight, borderRadius: 12, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  tagSecondary: { backgroundColor: COLORS.surface },
  tagText: { ...TYPOGRAPHY.caption, color: COLORS.primary },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md },
  budget: { ...TYPOGRAPHY.h3, color: COLORS.primary },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.md },
  description: { ...TYPOGRAPHY.body, color: COLORS.textMuted, lineHeight: 24 },
  metaGrid: { marginTop: SPACING.lg, gap: SPACING.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  metaText: { ...TYPOGRAPHY.caption, color: COLORS.textMuted },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  applyBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: SPACING.md, alignItems: 'center',
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: { color: '#fff', ...TYPOGRAPHY.label, fontSize: 16 },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.error, marginVertical: SPACING.md },
  backBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: 8 },
  backBtnText: { color: '#fff', ...TYPOGRAPHY.label },
});
