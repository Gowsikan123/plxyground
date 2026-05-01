import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, Switch } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, GRAD_HERO } from '../components/theme';

export default function Settings() {
  const { logout } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState(true);
  const [emails, setEmails] = useState(false);

  const handleLogout = async () => { await logout(); router.replace('/'); };

  const Section = ({ title, children }) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );

  const Row = ({ icon, label, sub, onPress, danger, right }) => (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <View style={s.rowLeft}>
        <Text style={s.rowIcon}>{icon}</Text>
        <View>
          <Text style={[s.rowLabel, danger && s.dangerText]}>{label}</Text>
          {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
        </View>
      </View>
      {right ?? (onPress ? <Text style={s.rowArrow}>›</Text> : null)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Section title="Account">
          <Row icon="👤" label="Edit Profile" onPress={() => {}} />
          <View style={s.divider} />
          <Row icon="🔒" label="Change Password" onPress={() => {}} />
          <View style={s.divider} />
          <Row icon="📧" label="Email Address" sub="Update your email" onPress={() => {}} />
        </Section>

        <Section title="Notifications">
          <Row icon="🔔" label="Push Notifications" right={<Switch value={notifs} onValueChange={setNotifs} trackColor={{ false: C.surface3, true: C.accent }} thumbColor="#fff" />} />
          <View style={s.divider} />
          <Row icon="📬" label="Email Digest" right={<Switch value={emails} onValueChange={setEmails} trackColor={{ false: C.surface3, true: C.accent }} thumbColor="#fff" />} />
        </Section>

        <Section title="About">
          <Row icon="📋" label="Terms of Service" onPress={() => router.push('/terms')} />
          <View style={s.divider} />
          <Row icon="🛡" label="Privacy Policy" onPress={() => router.push('/privacy')} />
          <View style={s.divider} />
          <Row icon="ℹ️" label="App Version" sub="v1.0.0" />
        </Section>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll:       { paddingHorizontal: 20, paddingBottom: 48 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
  backText:     { color: C.accent, fontSize: 15, fontWeight: '600' },
  headerTitle:  { color: C.text, fontSize: 18, fontWeight: '900' },
  section:      { marginBottom: 24 },
  sectionTitle: { color: C.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },
  sectionCard:  { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 },
  rowLeft:      { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  rowIcon:      { fontSize: 20, width: 26, textAlign: 'center' },
  rowLabel:     { color: C.text, fontSize: 15, fontWeight: '600' },
  rowSub:       { color: C.textMuted, fontSize: 12, marginTop: 2 },
  rowArrow:     { color: C.textFaint, fontSize: 22 },
  dangerText:   { color: C.red },
  divider:      { height: 1, backgroundColor: C.border, marginLeft: 58 },
  logoutBtn:    { marginTop: 8, paddingVertical: 16, alignItems: 'center', backgroundColor: C.redDark, borderRadius: R.xl, borderWidth: 1, borderColor: 'rgba(255,68,68,0.2)' },
  logoutText:   { color: C.red, fontSize: 16, fontWeight: '800' },
});
