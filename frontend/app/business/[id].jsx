import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { businessService } from '../../services/businessService';
import OpportunityCard from '../../components/OpportunityCard';

export default function BusinessProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await businessService.getById(id);
      if (err) { setError(err); setLoading(false); return; }
      setBusiness(data.business);
      setOpportunities(data.opportunities || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Business not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        {business.logo_url ? (
          <Image source={{ uri: business.logo_url }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business" size={40} color="#fff" />
          </View>
        )}
        <Text style={styles.name}>{business.company_name}</Text>
        {business.industry ? (
          <Text style={styles.industry}>{business.industry}</Text>
        ) : null}
        {business.description ? (
          <Text style={styles.description}>{business.description}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Opportunities</Text>
        {opportunities.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No active opportunities</Text>
          </View>
        ) : (
          opportunities.map((opp) => <OpportunityCard key={opp.id} item={opp} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  backRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.xs },
  backLabel: { color: COLORS.text, ...TYPOGRAPHY.body },
  header: { alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  logo: { width: 96, height: 96, borderRadius: 16, marginBottom: SPACING.sm },
  logoPlaceholder: {
    width: 96, height: 96, borderRadius: 16,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  name: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: 4 },
  industry: { ...TYPOGRAPHY.label, color: COLORS.primary, marginBottom: SPACING.sm },
  description: { ...TYPOGRAPHY.body, color: COLORS.textMuted, textAlign: 'center' },
  section: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.md },
  empty: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyText: { ...TYPOGRAPHY.body, color: COLORS.textMuted },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.error, marginVertical: SPACING.md },
  backBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: 8 },
  backBtnText: { color: '#fff', ...TYPOGRAPHY.label },
});
