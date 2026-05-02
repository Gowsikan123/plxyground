import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { opportunityService } from '../../services/opportunityService';
import Badge from '../../components/ui/Badge';

export default function OpportunityDetailScreen() {
  const { id, edit } = useLocalSearchParams();
  const { user, token, userType } = useAuth();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (id === 'new') { setLoading(false); return; }
      const { data, error: err } = await opportunityService.getById(id);
      if (err) setError(err); else setOpp(data.opportunity);
      setLoading(false);
    })();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    const { error: err } = await opportunityService.apply(id, token);
    setApplying(false);
    if (err) { Alert.alert('Error', err); return; }
    setApplied(true);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  if (id === 'new') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
        <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></Pressable>
        <Text style={styles.heading}>New Opportunity</Text>
        <Text style={styles.sub}>Post a new partnership opportunity</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>Opportunity creation form goes here</Text>
        </View>
      </ScrollView>
    );
  }

  if (error || !opp) return <View style={styles.center}><Text style={styles.errorText}>{error || 'Opportunity not found'}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></Pressable>

      <Badge label={opp.status || 'open'} color={opp.status === 'open' ? COLORS.success : COLORS.textMuted} style={styles.statusBadge} />
      <Text style={styles.title}>{opp.title}</Text>
      <Text style={styles.business}>{opp.business_name}</Text>
      {opp.budget && <Text style={styles.budget}>💰 Budget: {opp.budget}</Text>}
      {opp.deadline && <Text style={styles.deadline}>📅 Deadline: {new Date(opp.deadline).toLocaleDateString()}</Text>}
      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.description}>{opp.description}</Text>

      {opp.requirements && (
        <><Text style={styles.sectionTitle}>Requirements</Text>
        <Text style={styles.description}>{opp.requirements}</Text></>
      )}

      {userType === 'creator' && (
        <Pressable
          style={[styles.applyBtn, applied && styles.applyBtnDone]}
          onPress={applied ? null : handleApply}
          disabled={applying || applied}
        >
          {applying ? <ActivityIndicator color="#fff" /> : <Text style={styles.applyBtnText}>{applied ? '✓ Applied' : 'Apply Now'}</Text>}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING[6], paddingTop: SPACING[12], paddingBottom: SPACING[16] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { marginBottom: SPACING[4] },
  backText: { ...TYPOGRAPHY.bodySm, color: COLORS.primary },
  statusBadge: { alignSelf: 'flex-start', marginBottom: SPACING[3] },
  heading: { ...TYPOGRAPHY.displaySm, color: COLORS.text, marginBottom: SPACING[1] },
  sub: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted, marginBottom: SPACING[6] },
  title: { ...TYPOGRAPHY.headingLg, color: COLORS.text, marginBottom: SPACING[2] },
  business: { ...TYPOGRAPHY.labelMd, color: COLORS.primary, marginBottom: SPACING[2] },
  budget: { ...TYPOGRAPHY.bodyMd, color: COLORS.text, marginBottom: SPACING[1] },
  deadline: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted, marginBottom: SPACING[4] },
  sectionTitle: { ...TYPOGRAPHY.labelMd, color: COLORS.textMuted, letterSpacing: 1, marginTop: SPACING[4], marginBottom: SPACING[2] },
  description: { ...TYPOGRAPHY.bodyMd, color: COLORS.text, lineHeight: 24 },
  applyBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: SPACING[4], alignItems: 'center', marginTop: SPACING[8] },
  applyBtnDone: { backgroundColor: COLORS.success },
  applyBtnText: { ...TYPOGRAPHY.labelLg, color: '#fff' },
  placeholderBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING[8], alignItems: 'center' },
  placeholderText: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted },
  errorText: { ...TYPOGRAPHY.bodyMd, color: COLORS.error },
});
