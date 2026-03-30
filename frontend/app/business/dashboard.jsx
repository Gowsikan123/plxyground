import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Image, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { apiRequest } from '../../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function BusinessDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState([]);
  const [creators, setCreators] = useState([]);
  const [myContent, setMyContent] = useState([]);
  const [myOpportunities, setMyOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [contentRes, creatorsRes, myContentRes, myOpportunitiesRes] = await Promise.all([
        apiRequest('/api/content?limit=50', 'GET', null, token),
        apiRequest('/api/creators?limit=10', 'GET', null, token),
        apiRequest('/api/business/content/mine', 'GET', null, token),
        apiRequest('/api/opportunities/mine', 'GET', null, token),
      ]);
      setContent(contentRes.data || []);
      setCreators(creatorsRes.data || []);
      setMyContent(myContentRes.data || []);
      setMyOpportunities(myOpportunitiesRes.data || []);
    } catch (e) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const myPosts = myContent;

  const quickActions = [
    { icon: '📢', label: 'Post Announcement', route: '/business/create-post' },
    { icon: '🔍', label: 'Find Creators', route: '/business/search-creators' },
    { icon: '🤝', label: 'Opportunities', route: '/business/opportunities' },
    { icon: '📊', label: 'My Content', route: '/business/my-content' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.inner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
      >
        {/* HEADER */}
        <LinearGradient colors={['#0d1e38', '#080C14']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>{user?.name}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.businessBadge}>
            <Text style={styles.businessBadgeText}>🏢 Business Account</Text>
          </View>
        </LinearGradient>

        {/* KPI CARDS */}
        <View style={styles.kpiRow}>
          {[
            { label: 'My Posts', value: myPosts.length, icon: '📝', color: '#3b82f6' },
            { label: 'Creators', value: creators.filter(c => c.role === 'CREATOR').length, icon: '⭐', color: '#a78bfa' },
            { label: 'Opportunities', value: myOpportunities.length, icon: '🤝', color: '#34d399' },
            { label: 'Reach', value: '—', icon: '📈', color: '#f59e0b' },
          ].map(k => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiIcon}>{k.icon}</Text>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(a => (
            <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route)} activeOpacity={0.8}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT CREATORS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Creators</Text>
          <TouchableOpacity onPress={() => router.push('/business/search-creators')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.creatorsRow}>
          {creators.filter(c => c.role === 'CREATOR').slice(0, 8).map(c => (
            <TouchableOpacity key={c.id} style={styles.creatorCard} activeOpacity={0.8}>
              <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.creatorAvatar}>
                <Text style={styles.creatorAvatarText}>{c.name?.[0]?.toUpperCase()}</Text>
              </LinearGradient>
              <Text style={styles.creatorName} numberOfLines={1}>{c.name}</Text>
              <Text style={styles.creatorSlug}>@{c.profile_slug}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* RECENT FEED */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Content</Text>
          <TouchableOpacity onPress={() => router.push('/feed')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} /> : (
          content.slice(0, 3).map(post => (
            <TouchableOpacity key={post.id} style={styles.postCard} onPress={() => router.push(`/post/${post.id}`)} activeOpacity={0.85}>
              <Image source={{ uri: post.media_url }} style={styles.postThumb} />
              <View style={styles.postInfo}>
                <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                <Text style={styles.postCreator}>by {post.creator_name}</Text>
                <View style={styles.postTypeBadge}>
                  <Text style={styles.postTypeText}>{post.content_type}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/business/dashboard')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, { color: '#3b82f6' }]}>Home</Text>
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
          <Text style={styles.navLabel}>Profile</Text>
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
  inner: { paddingBottom: 100 },
  header: { padding: 24, paddingTop: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerGreeting: { color: '#64748b', fontSize: 14 },
  headerName: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0f1623', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  notifIcon: { fontSize: 18 },
  businessBadge: { backgroundColor: '#1a2420', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#166534' },
  businessBadgeText: { color: '#34d399', fontSize: 12, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16, marginBottom: 8 },
  kpiCard: { flex: 1, backgroundColor: '#0f1623', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1a2035' },
  kpiIcon: { fontSize: 20, marginBottom: 6 },
  kpiValue: { fontSize: 20, fontWeight: '900' },
  kpiLabel: { color: '#475569', fontSize: 10, fontWeight: '600', marginTop: 3 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16, marginTop: 24, marginBottom: 12 },
  seeAll: { color: '#3b82f6', fontSize: 13, fontWeight: '700' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  actionCard: { width: '47%', backgroundColor: '#0f1623', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1a2035', gap: 8 },
  actionIcon: { fontSize: 28 },
  actionLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  creatorsRow: { paddingLeft: 16, marginBottom: 8 },
  creatorCard: { alignItems: 'center', marginRight: 16, width: 80 },
  creatorAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  creatorAvatarText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  creatorName: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  creatorSlug: { color: '#475569', fontSize: 10, textAlign: 'center', marginTop: 2 },
  postCard: { flexDirection: 'row', backgroundColor: '#0f1623', marginHorizontal: 16, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#1a2035' },
  postThumb: { width: 80, height: 80 },
  postInfo: { flex: 1, padding: 14 },
  postTitle: { color: '#fff', fontWeight: '700', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  postCreator: { color: '#475569', fontSize: 12, marginBottom: 8 },
  postTypeBadge: { backgroundColor: '#1e3a5f', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  postTypeText: { color: '#60a5fa', fontSize: 10, fontWeight: '700' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
