import { ScrollView, Text, StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function Terms() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: March 2026</Text>
        {[
          { title: '1. Acceptance', body: 'By using PLXYGROUND you agree to these Terms. If you do not agree, do not use the platform.' },
          { title: '2. Your Content', body: 'Content you post remains yours. You grant PLXYGROUND a licence to display and distribute it on the platform. You must not post harmful, misleading, or inappropriate content.' },
          { title: '3. Account Rules', body: 'You must provide accurate information when creating an account. You are responsible for keeping your password secure. We reserve the right to suspend accounts that violate these terms.' },
          { title: '4. Platform Rules', body: 'Do not spam, harass, or abuse other users. Do not attempt to access accounts or systems you are not authorised to access.' },
          { title: '5. Termination', body: 'We may suspend or terminate your account at any time for violations of these Terms.' },
          { title: '6. Contact', body: 'For questions about these Terms, contact support@plxyground.com' },
        ].map(s => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f1623', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  backText: { color: '#3b82f6', fontSize: 18 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inner: { padding: 24, paddingBottom: 60 },
  updated: { color: '#334155', fontSize: 12, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  sectionBody: { color: '#94a3b8', fontSize: 14, lineHeight: 24 },
});