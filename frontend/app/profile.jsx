import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../components/BottomNav';
import { C, R, GRAD_ACCENT, GRAD_SURFACE } from '../components/theme';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    apiRequest(`/api/creators/${user.id}`, 'GET', null, token)
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => { setError('Could not load profile'); setLoading(false); });
  }, [user]);

  if (loading) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><ActivityIndicator color={C.accent} size="large" /></View>
    </SafeAreaView>
  );

  if (error || !profile) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}>
        <Text style={s.errorText}>{error || 'Could not load profile'}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => router.replace('/profile')}>
          <Text style={s.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const posts = profile.posts || [];

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Hero */}
        <LinearGradient colors={['#0A1128', C.bg]} style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.heroTitle}>Profile</Text>
            <TouchableOpacity style={s.editBtn} onPress={() => router.push('/settings')}>
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient colors={GRAD_ACCENT} style={s.avatarRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.avatarInner}>
              <Text style={s.avatarText}>{profile.name?.[0]?.toUpperCase()}</Text>
            </View>
          </LinearGradient>

          <Text style={s.name}>{profile.name}</Text>
          {profile.location ? <Text style={s.location}>📍 {profile.location}</Text> : null}
          {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

          <View style={s.roleTag}>
            <Text style={s.roleTagText}>{profile.role === 'BUSINESS' ? '🏢 Business' : '⭐ Creator'}</Text>
          </View>

          <View style={s.stats}>
            {[['Posts', posts.length], ['Following', '—'], ['Followers', '—']].map(([label, val], i, arr) => (
              <View key={label} style={s.statItem}>
                <Text style={s.statNum}>{val}</Text>
                <Text style={s.statLabel}>{label}</Text>
                {i < arr.length - 1 && <View style={s.statDivider} />}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Posts */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Posts</Text>
          {posts.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📝</Text>
              <Text style={s.emptyText}>No posts yet</Text>
              <TouchableOpacity style={s.createBtn} onPress={() => router.push('/create')}>
                <Text style={s.createBtnText}>Create your first post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            posts.map(p => (
              <TouchableOpacity key={p.id} style={s.postCard} onPress={() => router.push(`/post/${p.id}`)} activeOpacity={0.88}>
                <Image source={{ uri: p.media_url }} style={s.postThumb} defaultSource={require('../assets/placeholder.png')} />
                <View style={s.postInfo}>
                  <Text style={s.postTitle} numberOfLines={2}>{p.title}</Text>
                  <View style={s.postMeta}>
                    <View style={s.postTypeBadge}>
                      <Text style={s.postTypeText}>{p.content_type}</Text>
                    </View>
                    <Text style={s.postDate}>{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                </View>
                <Text style={s.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  scroll:        { paddingBottom: 120 },
  errorText:     { color: C.red, fontSize: 16 },
  retryBtn:      { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 20, paddingVertical: 10, borderRadius: R.md },
  retryText:     { color: C.accent, fontWeight: '700' },
  hero:          { padding: 24, paddingTop: 16, alignItems: 'center' },
  heroTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 28 },
  heroTitle:     { color: C.text, fontSize: 20, fontWeight: '900' },
  editBtn:       { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: R.full },
  editBtnText:   { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  avatarRing:    { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 14, padding: 3 },
  avatarInner:   { width: 94, height: 94, borderRadius: 47, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: C.accent, fontSize: 42, fontWeight: '900' },
  name:          { color: C.text, fontSize: 26, fontWeight: '900', marginBottom: 6, letterSpacing: -0.4 },
  location:      { color: C.textMuted, fontSize: 13, marginBottom: 8 },
  bio:           { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 12 },
  roleTag:       { backgroundColor: C.accentDark, borderWidth: 1, borderColor: '#1E3A8A', paddingHorizontal: 14, paddingVertical: 5, borderRadius: R.full, marginBottom: 20 },
  roleTagText:   { color: C.accent, fontSize: 12, fontWeight: '700' },
  stats:         { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, width: '100%', paddingVertical: 18 },
  statItem:      { flex: 1, alignItems: 'center', position: 'relative' },
  statNum:       { color: C.text, fontSize: 22, fontWeight: '900' },
  statLabel:     { color: C.textMuted, fontSize: 11, marginTop: 4, fontWeight: '600' },
  statDivider:   { position: 'absolute', right: 0, top: '10%', width: 1, height: '80%', backgroundColor: C.border },
  section:       { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle:  { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  empty:         { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon:     { fontSize: 40 },
  emptyText:     { color: C.textMuted, fontSize: 15 },
  createBtn:     { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 20, paddingVertical: 10, borderRadius: R.md },
  createBtnText: { color: C.accent, fontWeight: '700', fontSize: 14 },
  postCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.lg, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  postThumb:     { width: 76, height: 76, backgroundColor: C.surface2 },
  postInfo:      { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  postTitle:     { color: C.text, fontWeight: '700', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  postMeta:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postTypeBadge: { backgroundColor: C.accentDark, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.xs },
  postTypeText:  { color: C.accent, fontSize: 10, fontWeight: '700' },
  postDate:      { color: C.textFaint, fontSize: 11 },
  chevron:       { color: C.textFaint, fontSize: 24, paddingRight: 16 },
});
