import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Animated, FlatList, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/authStore';
import { useBookmarkStore } from '../../store/bookmarkStore';
import { apiRequest } from '../../components/ApiClient';
import BottomNav from '../../components/BottomNav';
import Toast from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { C, R, GRAD_ACCENT } from '../../components/theme';

const STATUS_DOT = { published: C.success, pending: '#f59e0b', rejected: C.error };
const STATUS_LABEL = { published: 'Published', pending: 'Under Review', rejected: 'Rejected' };

export default function Profile() {
  const user   = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const bookmarks = useBookmarkStore((s) => s.posts);

  const [tab, setTab]             = useState('posts');
  const [myPosts, setMyPosts]     = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [editOpen, setEditOpen]   = useState(false);
  const [toast, setToast]         = useState({ visible: false, message: '', type: 'success' });

  // Edit fields
  const [editName, setEditName]   = useState('');
  const [editBio, setEditBio]     = useState('');
  const [editSport, setEditSport] = useState('');
  const [editLoc, setEditLoc]     = useState('');
  const [saving, setSaving]       = useState(false);

  const slideAnim = useRef(new Animated.Value(400)).current;

  const displayName = user?.display_name || user?.username || 'Creator';
  const handle      = user?.username ? `@${user.username}` : '';
  const initials    = displayName[0]?.toUpperCase() ?? '?';
  const verified    = user?.is_verified ?? false;

  const loadMyPosts = async () => {
    setPostsLoading(true);
    try {
      const data = await apiRequest('/api/content?creator_id=me&limit=30');
      setMyPosts(data?.data || []);
    } catch {
      setMyPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => { if (tab === 'posts') loadMyPosts(); }, [tab]);

  const openEdit = () => {
    setEditName(user?.display_name || '');
    setEditBio(user?.bio || '');
    setEditSport(user?.sport || '');
    setEditLoc(user?.location || '');
    setEditOpen(true);
    Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }).start();
  };

  const closeEdit = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 240, useNativeDriver: true }).start(() => setEditOpen(false));
  };

  const saveEdit = async () => {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await apiRequest('/api/auth/profile', {
        method: 'PATCH',
        body: { display_name: editName, bio: editBio, sport: editSport, location: editLoc },
      });
      setUser && setUser({ ...user, display_name: editName, bio: editBio, sport: editSport, location: editLoc });
      closeEdit();
      setToast({ visible: true, message: 'Profile updated ✓', type: 'success' });
    } catch (e) {
      setToast({ visible: true, message: e.message || 'Update failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const StatBox = ({ label, value }) => (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );

  const renderPost = ({ item }) => {
    const status = item.status || 'pending';
    const dotColor = STATUS_DOT[status] || C.textFaint;
    return (
      <TouchableOpacity
        style={s.postRow}
        onPress={() => router.push(`/post/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={[s.statusDot, { backgroundColor: dotColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={s.postTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.postMeta}>{STATUS_LABEL[status] || status} · {item.content_type}</Text>
        </View>
        <Text style={s.postChev}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.hero}>
          <LinearGradient colors={GRAD_ACCENT} style={s.avatarRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          </LinearGradient>
          <View style={s.nameRow}>
            <Text style={s.name}>{displayName}</Text>
            {verified && (
              <View style={s.verifiedBadge}><Text style={s.verifiedText}>✓</Text></View>
            )}
          </View>
          {handle ? <Text style={s.handle}>{handle}</Text> : null}
          {user?.sport    ? <Text style={s.meta}>{user.sport}</Text>    : null}
          {user?.location ? <Text style={s.meta}>{user.location}</Text> : null}
          {user?.bio      ? <Text style={s.bioText}>{user.bio}</Text>    : null}
          <TouchableOpacity style={s.editBtn} onPress={openEdit} activeOpacity={0.8}>
            <Text style={s.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatBox label="Posts"     value={user?.post_count ?? 0} />
          <View style={s.divider} />
          <StatBox label="Followers" value={user?.follower_count ?? 0} />
          <View style={s.divider} />
          <StatBox label="Deals"     value={user?.deal_count ?? 0} />
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          {['posts', 'saved'].map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setTab(t); }}
            >
              <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>{t === 'posts' ? 'My Posts' : 'Saved'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {tab === 'posts' ? (
          postsLoading ? (
            <Text style={s.loadingText}>Loading…</Text>
          ) : myPosts.length === 0 ? (
            <EmptyState icon="✍️" title="No posts yet" subtitle="Create your first post to get started." />
          ) : (
            myPosts.map(item => renderPost({ item }))
          )
        ) : (
          bookmarks.length === 0 ? (
            <EmptyState icon="🔖" title="No saved posts" subtitle="Bookmark posts from the feed to find them here." />
          ) : (
            bookmarks.map(item => renderPost({ item }))
          )
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
          <TouchableOpacity style={[s.actionBtn, s.logoutBtn]} onPress={() => { logout(); router.replace('/'); }} activeOpacity={0.8}>
            <Text style={s.actionIcon}>↩</Text>
            <Text style={[s.actionBtnText, s.logoutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Sheet */}
      {editOpen && (
        <View style={s.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeEdit} activeOpacity={1} />
          <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Edit Profile</Text>
            {[['Display Name', editName, setEditName], ['Bio', editBio, setEditBio], ['Sport', editSport, setEditSport], ['Location', editLoc, setEditLoc]].map(([label, val, setter]) => (
              <View key={label} style={s.sheetField}>
                <Text style={s.sheetLabel}>{label}</Text>
                <TextInput
                  style={s.sheetInput}
                  value={val}
                  onChangeText={setter}
                  placeholder={`Enter ${label.toLowerCase()}…`}
                  placeholderTextColor={C.textFaint}
                  multiline={label === 'Bio'}
                  numberOfLines={label === 'Bio' ? 3 : 1}
                />
              </View>
            ))}
            <TouchableOpacity onPress={saveEdit} activeOpacity={0.85} disabled={saving}>
              <LinearGradient colors={GRAD_ACCENT} style={[s.sheetSave, saving && { opacity: 0.45 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.sheetSaveText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: C.bg },
  scroll:         { paddingBottom: 140 },
  hero:           { alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  avatarRing:     { width: 84, height: 84, borderRadius: 42, padding: 2.5, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatar:         { width: 79, height: 79, borderRadius: 39.5, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: C.text, fontSize: 28, fontWeight: '900' },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name:           { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  verifiedBadge:  { width: 20, height: 20, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  verifiedText:   { color: '#fff', fontSize: 11, fontWeight: '800' },
  handle:         { color: C.textMuted, fontSize: 14, marginBottom: 4 },
  meta:           { color: C.textFaint, fontSize: 13, marginTop: 2 },
  bioText:        { color: C.textMuted, fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center', maxWidth: 300 },
  editBtn:        { marginTop: 14, borderWidth: 1, borderColor: C.accent, borderRadius: R.full, paddingHorizontal: 20, paddingVertical: 8 },
  editBtnText:    { color: C.accent, fontSize: 13, fontWeight: '700' },
  statsRow:       { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, marginBottom: 16, backgroundColor: C.surface, borderRadius: R.xl, paddingVertical: 20, borderWidth: 1, borderColor: C.border },
  statBox:        { flex: 1, alignItems: 'center' },
  statValue:      { color: C.text, fontSize: 20, fontWeight: '900' },
  statLabel:      { color: C.textFaint, fontSize: 11, marginTop: 3 },
  divider:        { width: 1, backgroundColor: C.border },
  tabRow:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: R.lg, backgroundColor: C.surface, padding: 4, borderWidth: 1, borderColor: C.border },
  tabBtn:         { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: R.md },
  tabBtnActive:   { backgroundColor: C.accentDim },
  tabBtnText:     { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  tabBtnTextActive: { color: C.accent, fontWeight: '700' },
  postRow:        { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: C.surface, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.border, gap: 12 },
  statusDot:      { width: 8, height: 8, borderRadius: 4 },
  postTitle:      { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  postMeta:       { color: C.textFaint, fontSize: 12 },
  postChev:       { color: C.textFaint, fontSize: 20 },
  loadingText:    { color: C.textFaint, textAlign: 'center', marginTop: 32 },
  actions:        { marginHorizontal: 16, gap: 8, marginTop: 20 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.lg, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
  actionIcon:     { fontSize: 16, width: 22 },
  actionBtnText:  { color: C.text, fontSize: 15, fontWeight: '500', flex: 1 },
  actionChev:     { color: C.textFaint, fontSize: 20 },
  logoutBtn:      { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.05)', marginTop: 8 },
  logoutText:     { color: C.error },
  sheetOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100 },
  sheet:          { backgroundColor: C.surface2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  sheetTitle:     { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 20 },
  sheetField:     { marginBottom: 16 },
  sheetLabel:     { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  sheetInput:     { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 15 },
  sheetSave:      { borderRadius: R.full, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  sheetSaveText:  { color: '#fff', fontSize: 15, fontWeight: '800' },
});
