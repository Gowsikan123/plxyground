import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import BottomNav from '../components/BottomNav';
import { C, R, GRAD_ACCENT } from '../components/theme';
import { LinearGradient } from 'expo-linear-gradient';

const Row = ({ icon, label, sub, onPress, danger, right }) => (
  <TouchableOpacity style={[st.row, danger && st.rowDanger]} onPress={onPress} activeOpacity={0.75}>
    <View style={[st.rowIcon, danger && st.rowIconDanger]}>
      <Text style={st.rowIconText}>{icon}</Text>
    </View>
    <View style={st.rowContent}>
      <Text style={[st.rowLabel, danger && st.rowLabelDanger]}>{label}</Text>
      {sub ? <Text style={st.rowSub}>{sub}</Text> : null}
    </View>
    {right || <Text style={st.rowChevron}>›</Text>}
  </TouchableOpacity>
);

export default function Settings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState(true);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  return (
    <SafeAreaView style={st.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* User card */}
        <LinearGradient colors={['#0A1128', C.bg]} style={st.userCard}>
          <View style={st.userAvatar}>
            <Text style={st.userAvatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={st.userName}>{user?.name}</Text>
            <Text style={st.userEmail}>{user?.email}</Text>
          </View>
        </LinearGradient>

        <Text style={st.sectionLabel}>Account</Text>
        <View style={st.group}>
          <Row icon="✏️" label="Edit Profile" sub="Name, bio, location" onPress={() => {}} />
          <Row icon="🔒" label="Change Password" onPress={() => {}} />
          <Row icon="📧" label="Email Preferences" onPress={() => {}} />
        </View>

        <Text style={st.sectionLabel}>Notifications</Text>
        <View style={st.group}>
          <Row
            icon="🔔"
            label="Push Notifications"
            sub="Deals, messages, updates"
            right={<Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: C.accent }} thumbColor="#fff" />}
          />
        </View>

        <Text style={st.sectionLabel}>About</Text>
        <View style={st.group}>
          <Row icon="📋" label="Terms of Service" onPress={() => router.push('/terms')} />
          <Row icon="🔐" label="Privacy Policy" onPress={() => router.push('/privacy')} />
          <Row icon="💬" label="Support & Feedback" onPress={() => {}} />
          <Row icon="⭐" label="Rate the App" onPress={() => {}} />
        </View>

        <Text style={st.sectionLabel}>Danger Zone</Text>
        <View style={st.group}>
          <Row icon="🚪" label="Sign Out" danger onPress={handleLogout} />
        </View>

        <Text style={st.version}>PLXYGROUND v1.0.0</Text>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container:        { flex: 1, backgroundColor: C.bg },
  scroll:           { paddingBottom: 120 },
  userCard:         { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24 },
  userAvatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: C.accentDark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.accent },
  userAvatarText:   { color: C.accent, fontSize: 24, fontWeight: '900' },
  userName:         { color: C.text, fontSize: 18, fontWeight: '800' },
  userEmail:        { color: C.textMuted, fontSize: 13, marginTop: 3 },
  sectionLabel:     { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8, textTransform: 'uppercase' },
  group:            { backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  row:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  rowDanger:        { },
  rowIcon:          { width: 36, height: 36, borderRadius: R.sm, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger:    { backgroundColor: C.redDark },
  rowContent:       { flex: 1 },
  rowLabel:         { color: C.text, fontSize: 15, fontWeight: '600' },
  rowLabelDanger:   { color: C.red },
  rowSub:           { color: C.textMuted, fontSize: 12, marginTop: 2 },
  rowChevron:       { color: C.textFaint, fontSize: 22 },
  version:          { color: C.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: 32 },
});
