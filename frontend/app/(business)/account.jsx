import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Header from '../../components/layout/Header';

export default function BusinessAccountScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Header title="Account" />
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.card}>
          <View style={styles.bizInitial}>
            <Text style={styles.bizInitialText}>{(user?.business_name || 'B')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.bizName}>{user?.business_name || 'Business'}</Text>
          <Text style={styles.bizEmail}>{user?.email}</Text>
          {user?.website ? <Text style={styles.bizWebsite}>{user.website}</Text> : null}
        </View>

        <View style={styles.section}>
          {[
            { label: 'Edit Profile', icon: '✏️' },
            { label: 'Billing', icon: '💳' },
            { label: 'Privacy Policy', icon: '🔒' },
            { label: 'Terms of Service', icon: '📄' },
          ].map((item) => (
            <Pressable key={item.label} style={styles.row}>
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING[4], paddingBottom: SPACING[16] },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING[6], alignItems: 'center', marginBottom: SPACING[6], borderWidth: 1, borderColor: COLORS.border },
  bizInitial: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#2d6a2d', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING[3] },
  bizInitialText: { ...TYPOGRAPHY.displaySm, color: '#fff' },
  bizName: { ...TYPOGRAPHY.headingLg, color: COLORS.text, marginBottom: SPACING[1] },
  bizEmail: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  bizWebsite: { ...TYPOGRAPHY.bodySm, color: COLORS.primary, marginTop: SPACING[1] },
  section: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: SPACING[6] },
  row: { flexDirection: 'row', alignItems: 'center', padding: SPACING[4], borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING[3] },
  rowIcon: { fontSize: 18 },
  rowLabel: { ...TYPOGRAPHY.bodyMd, color: COLORS.text, flex: 1 },
  arrow: { ...TYPOGRAPHY.headingMd, color: COLORS.textMuted },
  logoutBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING[4], alignItems: 'center' },
  logoutText: { ...TYPOGRAPHY.labelMd, color: COLORS.error },
});
