import { ScrollView, Text, StyleSheet, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';

export default function Privacy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: March 2026</Text>
        {[
          { title: '1. What We Collect', body: 'We collect your name, email address, and content you post. We also collect basic usage data to improve the platform.' },
          { title: '2. How We Use It', body: 'We use your data to provide and improve our service, send important account notifications, and connect creators with brands.' },
          { title: '3. Data Sharing', body: 'We do not sell your personal data. We do not share your data with third parties except as required by law.' },
          { title: '4. Security', body: 'Your password is stored as a secure hash and never in plain text. We use industry-standard security practices to protect your data.' },
          { title: '5. Your Rights', body: 'You may request deletion of your account and all associated data at any time by contacting our support team.' },
          { title: '6. Contact', body: 'For privacy questions, contact privacy@plxyground.com' },
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