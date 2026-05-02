import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Header from '../../components/layout/Header';

const KPI = ({ label, value, sub }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
    {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
  </View>
);

export default function BusinessDashboard() {
  const { user } = useAuth();

  const kpis = [
    { label: 'Active Opportunities', value: '0', sub: 'Live now' },
    { label: 'Applications', value: '0', sub: 'Received' },
    { label: 'Active Deals', value: '0', sub: 'In progress' },
    { label: 'Total Reach', value: '0', sub: 'Creator views' },
  ];

  return (
    <View style={styles.container}>
      <Header title={user?.business_name ?? 'Dashboard'} />
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.greeting}>Good to see you back</Text>
        <Text style={styles.sub}>Manage your creator partnerships</Text>

        <View style={styles.kpiGrid}>
          {kpis.map((k) => <KPI key={k.label} {...k} />)}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(business)/opportunities')}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Post Opportunity</Text>
          </Pressable>
          <Pressable style={styles.actionCard} onPress={() => router.push('/(business)/discover')}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionLabel}>Find Creators</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING[4], paddingBottom: SPACING[12] },
  greeting: { ...TYPOGRAPHY.headingLg, color: COLORS.text, marginTop: SPACING[2] },
  sub: { ...TYPOGRAPHY.bodyMd, color: COLORS.textMuted, marginBottom: SPACING[6] },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[3], marginBottom: SPACING[6] },
  kpiCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: 14,
    padding: SPACING[4], borderWidth: 1, borderColor: COLORS.border,
  },
  kpiValue: { ...TYPOGRAPHY.displaySm, color: COLORS.text },
  kpiLabel: { ...TYPOGRAPHY.labelMd, color: COLORS.textMuted, marginTop: SPACING[1] },
  kpiSub: { ...TYPOGRAPHY.labelSm, color: COLORS.textFaint, marginTop: 2 },
  sectionTitle: { ...TYPOGRAPHY.headingMd, color: COLORS.text, marginBottom: SPACING[3] },
  actionsGrid: { flexDirection: 'row', gap: SPACING[3] },
  actionCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: SPACING[5],
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  actionIcon: { fontSize: 32, marginBottom: SPACING[2] },
  actionLabel: { ...TYPOGRAPHY.labelMd, color: COLORS.text, textAlign: 'center' },
});
