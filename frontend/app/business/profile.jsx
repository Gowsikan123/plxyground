import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { apiRequest } from '../../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function BusinessProfile() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/business-login'); return; }
    apiRequest(`/api/creators/${user.id}`, 'GET', null, token)
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.inner}>

        <LinearGradient colors={['#0d1e38', '#080C14']} style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Business Profile</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/business/edit-profile')}>
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoWrap}>
            <LinearGradient colors={['#34d399', '#059669']} style={styles.logo}>
              <Text style={styles.logoText}>{profile?.name?.[0]?.toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>🏢 Business</Text>
            </View>
          </View>

          <Text style={styles.name}>{profile?.name}</Text>
          {profile?.location ? <Text style={styles.location}>📍 {profile.location}</Text> : null}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile?.posts?.length || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Campaigns</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Partners</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Posts</Text>
            <TouchableOpacity onPress={() => router.push('/business/create-post')}>
              <Text style={styles.sectionAction}>+ New Post</Text>
            </TouchableOpacity>
          </View>
          {(profile?.posts || []).length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySub}>Share announcements and updates with creators</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/business/create-post')}>
                <Text style={styles.emptyBtnText}>Create First Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (profile?.posts || []).map(p => (
              <TouchableOpacity key={p.id} style={styles.postCard} onPress={() => router.push(`/post/${p.id}`)} activeOpacity={0.85}>
                <View style={styles.postIcon}><Text style={styles.postIconText}>📝</Text></View>
                <View style={styles.postInfo}>
                  <Text style={styles.postTitle} numberOfLines={2}>{p.title}</Text>
                  <Text style={styles.postDate}>{new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={styles.postChevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/search-creators')}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/create-post')}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.navCreateBtn}>
            <Text style={styles.navCreateIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/profile')}>
          <Text style={styles.navIcon}>🏢</Text>
          <Text style={[styles.navLabel, { color: '#3b82f6' }]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { paddingBottom: 100 },
  header: { padding: 24, paddingTop: 16, alignItems: 'center' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 24 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  editBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  editBtnText: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  logoWrap: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  verifiedBadge: { backgroundColor: '#1a2420', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#166534' },
  verifiedText: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  name: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6, letterSpacing: -0.3 },
  location: { color: '#475569', fontSize: 13, marginBottom: 8 },
  bio: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16, marginBottom: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1623', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: '#1a2035' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#475569', fontSize: 11, marginTop: 3, fontWeight: '600' },
  statDivider: { width: 1, height: 36, backgroundColor: '#1a2035' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sectionAction: { color: '#3b82f6', fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptySub: { color: '#475569', fontSize: 13, textAlign: 'center' },
  emptyBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: '#60a5fa', fontWeight: '700', fontSize: 14 },
  postCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f1623', borderRadius: 14, marginBottom: 10, padding: 16, borderWidth: 1, borderColor: '#1a2035' },
  postIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e3a5f', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  postIconText: { fontSize: 20 },
  postInfo: { flex: 1 },
  postTitle: { color: '#fff', fontWeight: '700', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  postDate: { color: '#475569', fontSize: 12 },
  postChevron: { color: '#334155', fontSize: 24 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});