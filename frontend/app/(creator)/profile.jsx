import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Modal, ActivityIndicator, StatusBar,
} from 'react-native';
import * as Haptics from '../../utils/haptics';
import { useRouter } from 'expo-router';
import { C, R } from '../../components/theme';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiRequest } from '../../components/ApiClient';
import { useAuthStore } from '../../store/authStore';
import { useSavedStore } from '../../store/savedStore';
import { useToastStore } from '../../components/ui/Toast';
import BottomNav from '../../components/BottomNav';

function StatusDot({ status }) {
  const isPublished = status === 'published' || status === 'approved';
  const color = isPublished ? C.success : C.warning;
  const label = isPublished ? 'Published' : 'Pending';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

export default function Profile() {
  const router    = useRouter();
  const showToast = useToastStore(s => s.show);
  const user      = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const { savedPosts } = useSavedStore();

  const [tab, setTab]           = useState('posts');
  const [myPosts, setMyPosts]   = useState([]);
  const [loadingPosts, setLP]   = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const [eName, setEName]       = useState('');
  const [eBio, setEBio]         = useState('');
  const [eSport, setESport]     = useState('');
  const [eLocation, setELoc]    = useState('');
  const [saving, setSaving]     = useState(false);
  const [editError, setEditError] = useState('');

  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('/api/content?creator_id=me');
        setMyPosts(data.data || []);
      } catch (_) {}
      setLP(false);
    })();
  }, []);

  const openEdit = () => {
    setEName(user?.display_name || '');
    setEBio(user?.bio || '');
    setESport(user?.sport || '');
    setELoc(user?.location || '');
    setEditError('');
    setEditOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 160 }).start();
  };

  const closeEdit = () => {
    Animated.timing(slideAnim, { toValue: 600, duration: 230, useNativeDriver: true }).start(() => setEditOpen(false));
  };

  const saveProfile = async () => {
    setSaving(true); setEditError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = await apiRequest('/api/auth/profile', {
        method: 'PATCH',
        body: { display_name: eName.trim(), bio: eBio.trim(), sport: eSport.trim(), location: eLocation.trim() },
      });
      if (updateUser) updateUser(data.user || data);
      showToast('Profile updated!', 'success');
      closeEdit();
    } catch (e) {
      setEditError(e.message || 'Failed to save.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setSaving(false);
  };

  const totalViews = myPosts.reduce((a, p) => a + (p.view_count || 0), 0);
  const stats = [
    { label: 'Posts',  value: myPosts.length },
    { label: 'Views',  value: totalViews },
    { label: 'Saved',  value: savedPosts.length },
  ];

  return (
    <View style={s.page}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <TouchableOpacity style={s.settingsBtn} onPress={() => router.push('/(creator)/settings')}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero banner area ── */}
        <View style={s.heroBanner}>
          <View style={s.heroBannerAccent} />
        </View>

        {/* ── Avatar + info row ── */}
        <View style={s.heroSection}>
          <View style={s.avatarRing}>
            <Avatar uri={user?.avatar_url} name={user?.display_name} size={76} />
          </View>
          <View style={s.heroInfo}>
            <Text style={s.displayName}>{user?.display_name || 'Creator'}</Text>
            <Text style={s.handle}>@{user?.username}</Text>
            {user?.sport    ? <View style={s.sportBadge}><Text style={s.sportText}>⚽ {user.sport}</Text></View> : null}
            {user?.location ? <Text style={s.location}>📍 {user.location}</Text> : null}
          </View>
        </View>

        {/* ── Bio ── */}
        {user?.bio ? (
          <Text style={s.bio}>{user.bio}</Text>
        ) : (
          <Text style={s.bioEmpty}>No bio yet — tap Edit Profile to add one</Text>
        )}

        {/* ── Edit button ── */}
        <TouchableOpacity style={s.editBtn} onPress={openEdit} activeOpacity={0.85}>
          <Text style={s.editBtnText}>✏️  Edit Profile</Text>
        </TouchableOpacity>

        {/* ── Stats row (ESPN scoreboard style) ── */}
        <View style={s.statsRow}>
          {stats.map((st, i) => (
            <View key={st.label} style={[s.statBox, i < stats.length - 1 && s.statBoxBorder]}>
              <Text style={s.statValue}>{st.value.toLocaleString()}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Section label ── */}
        <View style={s.sectionHeader}>
          <View style={s.sectionAccentBar} />
          <Text style={s.sectionTitle}>CONTENT</Text>
        </View>

        {/* ── Tab bar ── */}
        <View style={s.tabBar}>
          {['posts', 'saved'].map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tabItem, tab === t && s.tabItemActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'posts' ? `My Posts${myPosts.length > 0 ? ` (${myPosts.length})` : ''}` : `Saved${savedPosts.length > 0 ? ` (${savedPosts.length})` : ''}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        {tab === 'posts' ? (
          loadingPosts
            ? <ActivityIndicator color={C.accent} style={{ marginTop: 24 }} />
            : myPosts.length === 0
              ? <EmptyState title="No posts yet" message="Create your first post to get started." />
              : myPosts.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={s.postRow}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/post/${p.id}`); }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text style={s.postTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={s.postMeta}>
                        {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {'  ·  '}{(p.view_count || 0).toLocaleString()} views
                      </Text>
                    </View>
                    <StatusDot status={p.status} />
                  </TouchableOpacity>
                ))
        ) : (
          savedPosts.length === 0
            ? <EmptyState title="Nothing saved" message="Bookmark any post to save it here." />
            : savedPosts.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={s.postRow}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/post/${p.id}`); }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={s.postTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={s.postMeta}>{p.display_name}</Text>
                  </View>
                  <Text style={{ color: C.accent, fontSize: 16 }}>🔖</Text>
                </TouchableOpacity>
              ))
        )}

        {/* bottom padding for nav */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Edit Profile Bottom Sheet ── */}
      <Modal transparent visible={editOpen} animationType="none" onRequestClose={closeEdit}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeEdit} />
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Edit Profile</Text>
          {editError ? <Text style={s.editError}>{editError}</Text> : null}
          {[
            { label: 'Display Name', value: eName,     set: setEName,  placeholder: 'Your name' },
            { label: 'Bio',          value: eBio,      set: setEBio,   placeholder: 'Tell your story…', multi: true },
            { label: 'Sport',        value: eSport,    set: setESport, placeholder: 'e.g. Football' },
            { label: 'Location',     value: eLocation, set: setELoc,   placeholder: 'e.g. London, UK' },
          ].map(f => (
            <View key={f.label} style={s.editField}>
              <Text style={s.editLabel}>{f.label}</Text>
              <TextInput
                style={[s.editInput, f.multi && { minHeight: 72, textAlignVertical: 'top' }]}
                value={f.value}
                onChangeText={f.set}
                placeholder={f.placeholder}
                placeholderTextColor={C.textFaint}
                multiline={!!f.multi}
              />
            </View>
          ))}
          <TouchableOpacity style={s.saveBtn} onPress={saveProfile} disabled={saving} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>

      {/* ── Bottom navigation ── */}
      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  page:             { flex: 1, backgroundColor: C.bg },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 12 },
  headerTitle:      { color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  settingsBtn:      { padding: 6 },

  // Hero banner
  heroBanner:       { height: 72, backgroundColor: C.surface2, marginHorizontal: -0, overflow: 'hidden', position: 'relative' },
  heroBannerAccent: { position: 'absolute', left: -20, top: -20, width: 180, height: 180, borderRadius: 90, backgroundColor: C.accentDark, opacity: 0.8 },

  // Avatar + info
  heroSection:      { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: -36, paddingHorizontal: 16 },
  avatarRing:       { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: C.accent, overflow: 'hidden', backgroundColor: C.surface },
  heroInfo:         { flex: 1, paddingBottom: 6, gap: 3 },
  displayName:      { color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  handle:           { color: C.textMuted, fontSize: 13 },
  sportBadge:       { alignSelf: 'flex-start', backgroundColor: C.accentDim, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' },
  sportText:        { color: C.accent, fontSize: 11, fontWeight: '800' },
  location:         { color: C.textFaint, fontSize: 11 },

  // Bio
  bio:              { color: C.textMuted, fontSize: 14, lineHeight: 20, paddingHorizontal: 16, marginTop: 10 },
  bioEmpty:         { color: C.textFaint, fontSize: 13, fontStyle: 'italic', paddingHorizontal: 16, marginTop: 10 },

  // Edit button
  editBtn:          { marginHorizontal: 16, marginTop: 14, backgroundColor: C.surface2, borderRadius: R.lg, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  editBtnText:      { color: C.text, fontSize: 14, fontWeight: '700' },

  // Stats
  statsRow:         { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  statBox:          { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statBoxBorder:    { borderRightWidth: 1, borderRightColor: C.border },
  statValue:        { color: C.text, fontSize: 22, fontWeight: '900' },
  statLabel:        { color: C.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 },

  // Section
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  sectionAccentBar: { width: 3, height: 16, backgroundColor: C.accent, borderRadius: 2 },
  sectionTitle:     { color: C.text, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },

  // Tab bar
  tabBar:           { flexDirection: 'row', marginHorizontal: 16, backgroundColor: C.surface2, borderRadius: R.lg, padding: 4, gap: 4 },
  tabItem:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: R.md },
  tabItemActive:    { backgroundColor: C.accent },
  tabText:          { color: C.textMuted, fontSize: 12, fontWeight: '700' },
  tabTextActive:    { color: '#fff' },

  // Post rows
  content:          { gap: 10, paddingBottom: 100 },
  postRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, marginHorizontal: 16, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.border, gap: 12 },
  postTitle:        { color: C.text, fontSize: 14, fontWeight: '700' },
  postMeta:         { color: C.textFaint, fontSize: 11 },

  // Sheet
  overlay:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet:            { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, paddingBottom: 52, gap: 14 },
  sheetHandle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 8 },
  sheetTitle:       { color: C.text, fontSize: 18, fontWeight: '900' },
  editError:        { color: C.error, fontSize: 13 },
  editField:        { gap: 6 },
  editLabel:        { color: C.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  editInput:        { backgroundColor: C.surface2, borderRadius: R.lg, padding: 13, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  saveBtn:          { backgroundColor: C.accent, borderRadius: R.xl, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText:      { color: '#fff', fontSize: 16, fontWeight: '900' },
});
