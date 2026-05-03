import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../components/BottomNav';
import { C, R, GRAD_HERO } from '../components/theme';

export default function Profile() {
  const [profile, setProfile]       = useState(null);
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError]   = useState(false);

  // Migrated from useAuth() to useAuthStore
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const router  = useRouter();

  const load = async () => {
    setLoadError(false);
    try {
      const [prof, content] = await Promise.all([
        apiRequest('/api/auth/me'),
        apiRequest('/api/content?limit=50'),
      ]);
      setProfile(prof ?? null);
      setPosts((content?.data || []).filter(p => p.creator_id === prof?.id));
    } catch (e) {
      console.warn('Profile load error:', e?.message);
      setProfile(user ?? null);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (token) load(); else setLoading(false); }, [token]);
  const onRefresh = () => { setRefreshing(true); load(); };
  const handleLogout = async () => { await signOut(); router.replace('/'); };

  if (!token) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.noAuthIcon}>🔒</Text>
        <Text style={s.noAuthTitle}>Sign in to view your profile</Text>
        <TouchableOpacity style={s.signInWrap} onPress={() => router.push('/login')}>
          <LinearGradient colors={GRAD_HERO} style={s.signInBtn}>
            <Text style={s.signInText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.loadingIcon}>⚡</Text>
        <Text style={s.loadingLabel}>Loading profile…</Text>
      </View>
    </SafeAreaView>
  );

  const displayName  = profile?.name  ?? user?.name  ?? 'Creator';
  const displayEmail = profile?.email ?? user?.email ?? '';
  const initial      = displayName[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        contentContainerStyle={s.scroll}
      >
        {loadError && (
          <View style={s.warnBox}>
            <Text style={s.warnText}>⚡ Showing cached profile — pull down to refresh</Text>
          </View>
        )}

        {/* Profile hero */}
        <LinearGradient colors={['rgba(255,77,109,0.15)', 'transparent']} style={s.profileHero}>
          <View style={s.profileTop}>
            <LinearGradient colors={GRAD_HERO} style={s.avatarLarge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.avatarLargeText}>{initial}</Text>
            </LinearGradient>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{displayName}</Text>
              <Text style={s.profileHandle}>@{displayEmail.split('@')[0] || '—'}</Text>
              <View style={s.rolePill}>
                <Text style={s.roleText}>⚡ Creator</Text>
              </View>
            </View>
          </View>

          <View style={s.statsRow}>
            {[
              { val: posts.length, label: 'Posts'    },
              { val: '—',          label: 'Followers' },
              { val: '—',          label: 'Deals'     },
            ].map((stat, i) => (
              <View key={i} style={[s.stat, i < 2 && s.statBorder]}>
                <Text style={s.statVal}>{stat.val}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.editBtn} activeOpacity={0.8}>
            <Text style={s.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingsBtn} onPress={() => router.push('/settings')} activeOpacity={0.8}>
            <Text style={s.settingsBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>

        {/* Posts section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>My Posts</Text>
          {posts.length === 0 ? (
            <View style={s.emptyPosts}>
              <Text style={s.emptyPostsIcon}>📝</Text>
              <Text style={s.emptyPostsTitle}>No posts yet</Text>
              <Text style={s.emptyPostsSub}>Share your first story with the world</Text>
              <TouchableOpacity onPress={() => router.push('/create')}>
                <LinearGradient colors={GRAD_HERO} style={s.createWrap}>
                  <Text style={s.createText}>Create Post →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.postGrid}>
              {posts.map(post => (
                <TouchableOpacity key={post.id} style={s.postCard} onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.85}>
                  <LinearGradient colors={GRAD_HERO} style={s.postCardBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <View style={s.postCardBody}>
                    <Text style={s.postCardTitle} numberOfLines={2}>{post.title}</Text>
                    <Text style={s.postCardDate}>{new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  scroll:          { paddingBottom: 120 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  noAuthIcon:      { fontSize: 52 },
  noAuthTitle:     { color: C.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  signInWrap:      { borderRadius: R.xl, overflow: 'hidden', width: '100%' },
  signInBtn:       { paddingVertical: 16, alignItems: 'center' },
  signInText:      { color: '#fff', fontWeight: '800', fontSize: 16 },
  loadingIcon:     { fontSize: 44 },
  loadingLabel:    { color: C.textMuted, fontSize: 15, fontWeight: '600' },
  warnBox:         { backgroundColor: 'rgba(255,165,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,165,0,0.2)', padding: 10, marginHorizontal: 20, marginTop: 8, borderRadius: R.md },
  warnText:        { color: '#FFA500', fontSize: 12, textAlign: 'center' },
  profileHero:     { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  profileTop:      { flexDirection: 'row', gap: 18, alignItems: 'center', marginBottom: 24 },
  avatarLarge:     { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  profileInfo:     { flex: 1 },
  profileName:     { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  profileHandle:   { color: C.textMuted, fontSize: 14, marginTop: 2 },
  rolePill:        { alignSelf: 'flex-start', backgroundColor: C.accentDark, borderWidth: 1, borderColor: 'rgba(255,77,109,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.full, marginTop: 8 },
  roleText:        { color: C.accent, fontSize: 12, fontWeight: '700' },
  statsRow:        { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  stat:            { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder:      { borderRightWidth: 1, borderRightColor: C.border },
  statVal:         { color: C.text, fontSize: 20, fontWeight: '900' },
  statLabel:       { color: C.textMuted, fontSize: 11, marginTop: 2 },
  actions:         { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  editBtn:         { flex: 1, paddingVertical: 13, alignItems: 'center', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.borderBright },
  editBtnText:     { color: C.text, fontWeight: '700', fontSize: 14 },
  settingsBtn:     { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border },
  settingsBtnText: { fontSize: 22 },
  section:         { paddingHorizontal: 20 },
  sectionTitle:    { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 16, letterSpacing: -0.3 },
  emptyPosts:      { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyPostsIcon:  { fontSize: 44 },
  emptyPostsTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  emptyPostsSub:   { color: C.textMuted, fontSize: 14, textAlign: 'center' },
  createWrap:      { borderRadius: R.lg, overflow: 'hidden', marginTop: 6 },
  createText:      { color: '#fff', fontWeight: '800', fontSize: 14, paddingHorizontal: 24, paddingVertical: 13 },
  postGrid:        { gap: 12 },
  postCard:        { backgroundColor: C.surface, borderRadius: R.lg, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  postCardBar:     { height: 3 },
  postCardBody:    { padding: 14 },
  postCardTitle:   { color: C.text, fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 6 },
  postCardDate:    { color: C.textMuted, fontSize: 12 },
  logoutBtn:       { marginHorizontal: 20, marginTop: 28, paddingVertical: 15, alignItems: 'center', backgroundColor: C.redDark, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,68,68,0.2)' },
  logoutText:      { color: C.red, fontSize: 15, fontWeight: '700' },
});
