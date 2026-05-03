import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import BottomNav from '../../components/BottomNav';
import { C, R, GRAD_ACCENT } from '../../components/theme';

export default function Profile() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = () => { logout(); router.replace('/'); };

  const displayName = user?.display_name || user?.username || 'Creator';
  const handle      = user?.username ? `@${user.username}` : '';
  const initials    = displayName[0]?.toUpperCase() ?? '?';
  const sport       = user?.sport    || null;
  const location    = user?.location || null;
  const bio         = user?.bio      || null;
  const followers   = user?.follower_count ?? 0;
  const postCount   = user?.post_count ?? 0;
  const deals       = user?.deal_count ?? 0;
  const verified    = user?.is_verified ?? false;

  const StatBox = ({ label, value }) => (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar block */}
        <View style={s.hero}>
          <View style={s.avatarWrap}>
            <LinearGradient colors={GRAD_ACCENT} style={s.avatarRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={s.nameRow}>
            <Text style={s.name}>{displayName}</Text>
            {verified && (
              <View style={s.verifiedBadge}>
                <Text style={s.verifiedText}>✓</Text>
              </View>
            )}
          </View>

          {handle   ? <Text style={s.handle}>{handle}</Text>   : null}
          {sport    ? <Text style={s.meta}>{sport}</Text>      : null}
          {location ? <Text style={s.meta}>{location}</Text>   : null}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatBox label="Posts"     value={postCount} />
          <View style={s.divider} />
          <StatBox label="Followers" value={followers} />
          <View style={s.divider} />
          <StatBox label="Deals"     value={deals} />
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
            <Text style={s.actionIcon}>⚙</Text>
            <Text style={s.actionBtnText}>Settings</Text>
            <Text style={s.actionChev}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/privacy')} activeOpacity={0.8}>
            <Text style={s.actionIcon}>🔒</Text>
            <Text style={s.actionBtnText}>Privacy Policy</Text>
            <Text style={s.actionChev}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.logoutBtn]} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={s.actionIcon}>↩</Text>
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

  hero:          { alignItems: 'center', paddingTop: 40, paddingBottom: 28, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  avatarWrap:    { marginBottom: 16 },
  avatarRing:    { width: 84, height: 84, borderRadius: 42, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatar:        { width: 79, height: 79, borderRadius: 39.5, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: C.text, fontSize: 28, fontWeight: '900' },

  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name:          { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  verifiedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  verifiedText:  { color: '#fff', fontSize: 11, fontWeight: '800' },
  handle:        { color: C.textMuted, fontSize: 14, marginBottom: 6 },
  meta:          { color: C.textFaint, fontSize: 13, marginTop: 2 },

  statsRow:      { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, marginBottom: 20, backgroundColor: C.surface, borderRadius: R.xl, paddingVertical: 20, borderWidth: 1, borderColor: C.border },
  statBox:       { flex: 1, alignItems: 'center' },
  statValue:     { color: C.text, fontSize: 20, fontWeight: '900' },
  statLabel:     { color: C.textFaint, fontSize: 11, marginTop: 3, letterSpacing: 0.3 },
  divider:       { width: 1, backgroundColor: C.border },

  section:       { marginHorizontal: 16, marginBottom: 20 },
  sectionLabel:  { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  bioText:       { color: C.text, fontSize: 14, lineHeight: 22 },

  actions:       { marginHorizontal: 16, gap: 8 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.lg, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
  actionIcon:    { fontSize: 16, width: 22 },
  actionBtnText: { color: C.text, fontSize: 15, fontWeight: '500', flex: 1 },
  actionChev:    { color: C.textFaint, fontSize: 20, fontWeight: '300' },
  logoutBtn:     { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.05)', marginTop: 8 },
  logoutText:    { color: C.error },
});
