import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    apiRequest(`/api/creators/${user.id}`, 'GET', null, token)
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => { setError('Could not load profile'); setLoading(false); });
  }, []);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View>
    </SafeAreaView>
  );

  if (error || !profile) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Could not load profile'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.replace('/profile')}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.inner}>

        <LinearGradient colors={['#0d1e38', '#080C14']} style={styles.headerBg}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/settings')}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarWrap}>
            <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name?.[0]?.toUpperCase()}</Text>
            </LinearGradient>
            <View style={[styles.roleBadge, profile.role === 'BUSINESS' && styles.roleBadgeBusiness]}>
              <Text style={[styles.roleText, profile.role === 'BUSINESS' && styles.roleTextBusiness]}>
                {profile.role === 'BUSINESS' ? '🏢 Business' : '⭐ Creator'}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{profile.name}</Text>
          {profile.location ? <Text style={styles.location}>📍 {profile.location}</Text> : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.posts?.length ?? 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {(profile.posts || []).length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No posts yet</Text>
              <TouchableOpacity style={styles.createPostBtn} onPress={() => router.push('/create')}>
                <Text style={styles.createPostBtnText}>Create your first post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (profile.posts || []).map(p => (
              <TouchableOpacity key={p.id} style={styles.postCard} onPress={() => router.push(`/post/${p.id}`)} activeOpacity={0.85}>
                <Image
                  source={{ uri: p.media_url }}
                  style={styles.postThumb}
                  defaultSource={require('../assets/placeholder.png')}
                  onError={e => { e.target.setNativeProps({ opacity: 0 }); }}
                />
                <View style={styles.postInfo}>
                  <Text style={styles.postTitle} numberOfLines={2}>{p.title}</Text>
                  <View style={styles.postMeta}>
                    <View style={styles.postTypeBadge}>
                      <Text style={styles.postTypeText}>{p.content_type}</Text>
                    </View>
                    <Text style={styles.postDate}>{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                </View>
                <Text style={styles.postChevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/feed')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/opportunities')}>
          <Text style={styles.navIcon}>O</Text>
          <Text style={styles.navLabel}>Opps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/create')}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.navCreateBtn}>
            <Text style={styles.navCreateIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navLabel, { color: '#3b82f6' }]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  inner: { paddingBottom: 100 },
  headerBg: { padding: 24, paddingTop: 16, alignItems: 'center' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  editBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  editBtnText: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  avatarWrap: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  roleBadge: { backgroundColor: '#1e3a5f', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  roleBadgeBusiness: { backgroundColor: '#1a2420' },
  roleText: { color: '#60a5fa', fontSize: 12, fontWeight: '700' },
  roleTextBusiness: { color: '#34d399' },
  name: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6, letterSpacing: -0.3 },
  location: { color: '#475569', fontSize: 13, marginBottom: 8 },
  bio: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1623', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: '#1a2035' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#475569', fontSize: 11, marginTop: 3, fontWeight: '600' },
  statDivider: { width: 1, height: 36, backgroundColor: '#1a2035' },
  section: { padding: 20 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: '#475569', fontSize: 15 },
  createPostBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  createPostBtnText: { color: '#60a5fa', fontWeight: '700', fontSize: 14 },
  postCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1623', borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#1a2035' },
  postThumb: { width: 76, height: 76, backgroundColor: '#1a2035' },
  postInfo: { flex: 1, padding: 14 },
  postTitle: { color: '#fff', fontWeight: '700', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postTypeBadge: { backgroundColor: '#1e3a5f', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  postTypeText: { color: '#60a5fa', fontSize: 10, fontWeight: '700' },
  postDate: { color: '#334155', fontSize: 11 },
  postChevron: { color: '#334155', fontSize: 24, paddingRight: 14 },
  errorText: { color: '#f87171', fontSize: 16 },
  retryBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#60a5fa', fontWeight: '700' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 22 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
