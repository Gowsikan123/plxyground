import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import BottomNav from '../../components/BottomNav';
import { C, R, GRAD_HERO } from '../../components/theme';

export default function Profile() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const displayName  = user?.display_name || user?.username || 'Creator';
  const handle       = user?.username ? `@${user.username}` : '';
  const initials     = displayName[0]?.toUpperCase() ?? '?';
  const sport        = user?.sport || null;
  const location     = user?.location || null;
  const bio          = user?.bio || null;
  const followers    = user?.follower_count ?? 0;
  const posts        = user?.post_count ?? 0;
  const verified     = user?.is_verified ?? false;

  const StatBox = ({ label, value }) => (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header band */}
        <LinearGradient colors={['#1a1a2e', C.bg]} style={s.hero}>
          <LinearGradient colors={GRAD_HERO} style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          </LinearGradient>
          <View style={s.nameRow}>
            <Text style={s.name}>{displayName}</Text>
            {verified && (
              <LinearGradient colors={GRAD_HERO} style={s.verifiedBadge}>
                <Text style={s.verifiedText}>✓ Verified</Text>
              </LinearGradient>
            )}
          </View>
          {handle ? <Text style={s.handle}>{handle}</Text> : null}
          {sport   ? <Text style={s.tag}>🏆 {sport}</Text> : null}
          {location ? <Text style={s.tag}>📍 {location}</Text> : null}
        </LinearGradient>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatBox label="Posts"     value={posts} />
          <View style={s.statDivider} />
          <StatBox label="Followers" value={followers} />
          <View style={s.statDivider} />
          <StatBox label="Deals"     value={user?.deal_count ?? 0} />
        </View>

        {/* Bio */}
        {bio && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>About</Text>
            <Text style={s.bioText}>{bio}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(creator)/settings')} activeOpacity={0.8}>
            <Text style={s.actionBtnText}>⚙️  Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.logoutBtn]} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={[s.actionBtnText, s.logoutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  scroll:        { paddingBottom: 120 },
  hero:          { alignItems: 'center', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 20 },
  avatarRing:    { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 14, padding: 3 },
  avatar:        { width: 78, height: 78, borderRadius: 39, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: C.text, fontSize: 30, fontWeight: '900' },
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name:          { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full },
  verifiedText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  handle:        { color: C.textMuted, fontSize: 14, marginBottom: 8 },
  tag:           { color: C.textFaint, fontSize: 13, marginTop: 2 },
  statsRow:      { flexDirection: 'row', backgroundColor: C.surface, marginHorizontal: 16, borderRadius: R.xl, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  statBox:       { flex: 1, alignItems: 'center' },
  statValue:     { color: C.text, fontSize: 20, fontWeight: '900' },
  statLabel:     { color: C.textFaint, fontSize: 12, marginTop: 2 },
  statDivider:   { width: 1, backgroundColor: C.border },
  section:       { marginHorizontal: 16, marginBottom: 16 },
  sectionLabel:  { color: C.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  bioText:       { color: C.text, fontSize: 14, lineHeight: 22 },
  actions:       { marginHorizontal: 16, gap: 10 },
  actionBtn:     { backgroundColor: C.surface, borderRadius: R.lg, padding: 16, borderWidth: 1, borderColor: C.border },
  actionBtnText: { color: C.text, fontSize: 15, fontWeight: '600' },
  logoutBtn:     { borderColor: 'rgba(255,60,60,0.3)', backgroundColor: 'rgba(255,60,60,0.06)' },
  logoutText:    { color: '#FF6060' },
});
