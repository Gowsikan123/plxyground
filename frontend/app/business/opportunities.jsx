import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthContext';
import { apiRequest } from '../../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

const ROLE_TYPES = ['Partnership', 'Sponsored Post', 'Brand Ambassador', 'Event Coverage', 'UGC'];

export default function Opportunities() {
  const router = useRouter();
  const { token } = useAuth();
  const [mine, setMine] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [roleType, setRoleType] = useState('Partnership');
  const [body, setBody] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setRoleType('Partnership');
    setBody('');
    setRequirements('');
    setBenefits('');
  };

  const hydrateForm = (item) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setRoleType(item.role_type || 'Partnership');
    setBody(item.body || '');
    setRequirements(item.requirements || '');
    setBenefits(item.benefits || '');
  };

  const load = async () => {
    try {
      const [mineRes, publicRes] = await Promise.all([
        apiRequest('/api/opportunities/mine', 'GET', null, token),
        apiRequest('/api/opportunities?limit=20'),
      ]);
      setMine(mineRes.data || []);
      setMarketplace(publicRes.data || []);
    } catch (e) {
      setError(e.error || 'Failed to load opportunities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!title.trim() || !body.trim()) {
      setError('Title and summary are required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await apiRequest(`/api/opportunities/${editingId}`, 'PUT', {
          title: title.trim(),
          role_type: roleType,
          body: body.trim(),
          requirements: requirements.trim() || undefined,
          benefits: benefits.trim() || undefined,
        }, token);
        setSuccess('Opportunity updated');
      } else {
        await apiRequest('/api/opportunities', 'POST', {
          title: title.trim(),
          role_type: roleType,
          body: body.trim(),
          requirements: requirements.trim() || undefined,
          benefits: benefits.trim() || undefined,
        }, token);
        setSuccess('Opportunity created as a draft');
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e.error || 'Failed to save opportunity');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (item) => {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/api/opportunities/${item.id}`, 'PUT', {
        is_published: item.is_published ? 0 : 1,
      }, token);
      setSuccess(item.is_published ? 'Opportunity moved to draft' : 'Opportunity published');
      await load();
    } catch (e) {
      setError(e.error || 'Failed to update status');
    }
  };

  const removeOpportunity = async (item) => {
    setError('');
    setSuccess('');
    try {
      await apiRequest(`/api/opportunities/${item.id}`, 'DELETE', null, token);
      if (editingId === item.id) resetForm();
      setSuccess('Opportunity deleted');
      await load();
    } catch (e) {
      setError(e.error || 'Failed to delete opportunity');
    }
  };

  const publishedCount = mine.filter((item) => item.is_published).length;
  const draftCount = mine.length - publishedCount;

  const renderManagedCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, item.is_published ? styles.statusLive : styles.statusDraft]}>
          <Text style={[styles.statusText, item.is_published ? styles.statusTextLive : styles.statusTextDraft]}>
            {item.is_published ? 'Live' : 'Draft'}
          </Text>
        </View>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardMeta}>{item.role_type || 'Partnership'}</Text>
      <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => hydrateForm(item)}>
          <Text style={styles.secondaryBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => togglePublished(item)}>
          <Text style={styles.secondaryBtnText}>{item.is_published ? 'Unpublish' : 'Publish'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerBtn} onPress={() => removeOpportunity(item)}>
          <Text style={styles.dangerBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMarketplaceCard = ({ item }) => (
    <View style={styles.marketCard}>
      <View style={styles.cardHeader}>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>{item.role_type || 'Partnership'}</Text>
        </View>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.marketOwner}>Posted by {item.creator_name}</Text>
      <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
    </View>
  );

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator color="#3b82f6" size="large" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Opportunities</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={mine}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderManagedCard}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={(
          <View>
            <LinearGradient colors={['#0d1e38', '#080C14']} style={styles.hero}>
              <Text style={styles.heroTitle}>Run creator opportunities properly</Text>
              <Text style={styles.heroSub}>Create drafts, publish live briefs, and manage your open roles from one place.</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{mine.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{publishedCount}</Text>
                  <Text style={styles.statLabel}>Live</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{draftCount}</Text>
                  <Text style={styles.statLabel}>Drafts</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>{editingId ? 'Edit Opportunity' : 'Create Opportunity'}</Text>
                {editingId ? (
                  <TouchableOpacity onPress={resetForm}>
                    <Text style={styles.cancelEdit}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
              {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Looking for short-form football creators" placeholderTextColor="#334155" />

              <Text style={styles.inputLabel}>Role Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleRow}>
                {ROLE_TYPES.map((role) => (
                  <TouchableOpacity key={role} style={[styles.rolePill, roleType === role && styles.rolePillActive]} onPress={() => setRoleType(role)}>
                    <Text style={[styles.rolePillText, roleType === role && styles.rolePillTextActive]}>{role}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Summary</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={body}
                onChangeText={setBody}
                placeholder="Describe what the brand needs, the campaign angle, and what success looks like."
                placeholderTextColor="#334155"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Requirements</Text>
              <TextInput
                style={[styles.input, styles.textareaSmall]}
                value={requirements}
                onChangeText={setRequirements}
                placeholder="Audience, niche, posting requirements, turnaround time..."
                placeholderTextColor="#334155"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Benefits</Text>
              <TextInput
                style={[styles.input, styles.textareaSmall]}
                value={benefits}
                onChangeText={setBenefits}
                placeholder="Why should creators apply?"
                placeholderTextColor="#334155"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.primaryBtnGradient}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{editingId ? 'Save Changes' : 'Create Draft'}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Opportunities</Text>
              <Text style={styles.sectionHint}>Publish the strongest ones when they are ready.</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No opportunities yet</Text>
            <Text style={styles.emptySub}>Create your first draft above and publish it when the brief is ready.</Text>
          </View>
        )}
        ListFooterComponent={(
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Marketplace Preview</Text>
              <Text style={styles.sectionHint}>This is what creators currently see.</Text>
            </View>
            {marketplace.length ? (
              marketplace.slice(0, 4).map((item) => (
                <View key={item.id}>{renderMarketplaceCard({ item })}</View>
              ))
            ) : (
              <View style={styles.emptySmall}>
                <Text style={styles.emptySub}>No published opportunities yet.</Text>
              </View>
            )}
          </View>
        )}
      />

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f1623', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  backText: { color: '#3b82f6', fontSize: 18 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  hero: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e3a5f', marginBottom: 18 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  heroSub: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: '#0f1623', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1a2035', alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 4 },
  formCard: { backgroundColor: '#0f1623', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#1a2035', marginBottom: 18 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  formTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cancelEdit: { color: '#60a5fa', fontSize: 13, fontWeight: '700' },
  inputLabel: { color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 14, marginBottom: 8 },
  input: { backgroundColor: '#080C14', color: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', fontSize: 15 },
  textarea: { height: 130, textAlignVertical: 'top', lineHeight: 22 },
  textareaSmall: { height: 100, textAlignVertical: 'top', lineHeight: 22 },
  roleRow: { marginTop: 2, marginBottom: 2 },
  rolePill: { backgroundColor: '#131929', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#1e293b', marginRight: 8 },
  rolePillActive: { backgroundColor: '#0d1e38', borderColor: '#3b82f6' },
  rolePillText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  rolePillTextActive: { color: '#60a5fa' },
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 20 },
  primaryBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  sectionHeader: { marginTop: 8, marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sectionHint: { color: '#64748b', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#0f1623', borderRadius: 16, marginBottom: 14, padding: 18, borderWidth: 1, borderColor: '#1a2035' },
  marketCard: { backgroundColor: '#0b1220', borderRadius: 16, marginBottom: 14, padding: 18, borderWidth: 1, borderColor: '#172036' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusLive: { backgroundColor: '#1a2420' },
  statusDraft: { backgroundColor: '#1a1a2e' },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusTextLive: { color: '#34d399' },
  statusTextDraft: { color: '#a78bfa' },
  roleTag: { backgroundColor: '#1e3a5f', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  roleTagText: { color: '#60a5fa', fontSize: 11, fontWeight: '700' },
  cardDate: { color: '#475569', fontSize: 12 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 24 },
  cardMeta: { color: '#60a5fa', fontSize: 12, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  marketOwner: { color: '#64748b', fontSize: 12, marginTop: 8, marginBottom: 8 },
  cardBody: { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  secondaryBtn: { flex: 1, backgroundColor: '#13213a', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#60a5fa', fontWeight: '700', fontSize: 13 },
  dangerBtn: { flex: 1, backgroundColor: '#2a1115', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  dangerBtnText: { color: '#f87171', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#0f1623', borderRadius: 16, borderWidth: 1, borderColor: '#1a2035', marginBottom: 20 },
  emptySmall: { alignItems: 'center', paddingVertical: 24, marginBottom: 14 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySub: { color: '#64748b', fontSize: 13, textAlign: 'center', paddingHorizontal: 24 },
  errorBox: { backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#7f1d1d', padding: 12, borderRadius: 12, marginTop: 6 },
  errorText: { color: '#f87171', fontSize: 13 },
  successBox: { backgroundColor: '#052e16', borderWidth: 1, borderColor: '#166534', padding: 12, borderRadius: 12, marginTop: 6 },
  successText: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
