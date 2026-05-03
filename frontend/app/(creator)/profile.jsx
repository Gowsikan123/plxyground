import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, Modal, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { C, R } from '../../components/theme';
import { Header } from '../../components/layout/Header';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { apiRequest } from '../../components/ApiClient';
import { useAuthStore } from '../../store/authStore';
import { useSavedStore } from '../../store/savedStore';
import { useToastStore } from '../../components/ui/Toast';

function StatusDot({ status }) {
  const isPublished = status === 'published' || status === 'approved';
  const color = isPublished ? C.success : C.warning;
  const label = isPublished ? 'Published' : 'Under Review';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{label}</Text>
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

  const slideAnim = useRef(new Animated.Value(500)).current;

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
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
  };

  const closeEdit = () => {
    Animated.timing(slideAnim, { toValue: 500, duration: 220, useNativeDriver: true }).start(() => setEditOpen(false));
  };

  const saveProfile = async () => {
    setSaving(true); setEditError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const data = await apiRequest('/api/auth/profile', {
        method: 'PATCH',
        body: {
          display_name: eName.trim(),
          bio:          eBio.trim(),
          sport:        eSport.trim(),
          location:     eLocation.trim(),
        },
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
      <Header title="Profile" />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={s.heroRow}>
          <Avatar uri={user?.avatar_url} name={user?.display_name} size={72} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.displayName}>{user?.display_name || 'Creator'}</Text>
            <Text style={s.handle}>@{user?.username}</Text>
            {user?.bio      ? <Text style={s.bio}    numberOfLines={2}>{user.bio}</Text>   : null}
            {user?.sport    ? <Text style={s.sport}>⚽ {user.sport}</Text>                  : null}
            {user?.location ? <Text style={s.location}>📍 {user.location}</Text>            : null}
          </View>
        </View>

        {/* Edit button */}
        <TouchableOpacity style={s.editBtn} onPress={openEdit} activeOpacity={0.8}>
          <Text style={s.editBtnText}>✏️  Edit Profile</Text>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={s.statsRow}>
          {stats.map((st, i) => (
            <View key={st.label} style={[s.statBox, i < stats.length - 1 && { borderRightWidth: 1, borderColor: C.border }]}>
              <Text style={s.statValue}>{st.value.toLocaleString()}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Tab bar */}
        <View style={s.tabBar}>
          {['posts', 'saved'].map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tabItem, tab === t && s.tabItemActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'posts' ? 'My Posts' : 'Saved'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
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
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={s.postTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={s.postMeta}>{new Date(p.created_at).toLocaleDateString()}</Text>
                    </View>
                    <StatusDot status={p.status} />
                  </TouchableOpacity>
                ))
        ) : (
          savedPosts.length === 0
            ? <EmptyState title="Nothing saved" message="Tap the bookmark on any post to save it here." />
            : savedPosts.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={s.postRow}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/post/${p.id}`); }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.postTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={s.postMeta}>{p.display_name}</Text>
                  </View>
                </TouchableOpacity>
              ))
        )}
      </ScrollView>

      {/* Edit Profile Bottom Sheet */}
      <Modal transparent visible={editOpen} animationType="none" onRequestClose={closeEdit}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeEdit} />
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Edit Profile</Text>
          {editError ? <Text style={s.editError}>{editError}</Text> : null}
          {[
            { label: 'Display Name', value: eName,      set: setEName,    placeholder: 'Your name' },
            { label: 'Bio',          value: eBio,       set: setEBio,     placeholder: 'Tell the world about yourself…', multi: true },
            { label: 'Sport',        value: eSport,     set: setESport,   placeholder: 'e.g. Football' },
            { label: 'Location',     value: eLocation,  set: setELoc,     placeholder: 'e.g. London, UK' },
          ].map(f => (
            <View key={f.label} style={s.editField}>
              <Text style={s.editLabel}>{f.label}</Text>
              <TextInput
                style={[s.editInput, f.multi && { minHeight: 80, textAlignVertical: 'top' }]}
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
    </View>
  );
}

const s = StyleSheet.create({
  page:          { flex: 1, backgroundColor: C.bg },
  content:       { padding: 20, gap: 14, paddingBottom: 48 },
  heroRow:       { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  displayName:   { color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  handle:        { color: C.textMuted, fontSize: 13 },
  bio:           { color: C.textMuted, fontSize: 13, lineHeight: 18 },
  sport:         { color: C.accent, fontSize: 12, fontWeight: '700' },
  location:      { color: C.textFaint, fontSize: 12 },
  editBtn:       { backgroundColor: C.surface2, borderRadius: R.lg, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  editBtnText:   { color: C.text, fontSize: 14, fontWeight: '700' },
  statsRow:      { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  statBox:       { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValue:     { color: C.text, fontSize: 20, fontWeight: '900' },
  statLabel:     { color: C.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  tabBar:        { flexDirection: 'row', backgroundColor: C.surface2, borderRadius: R.lg, padding: 4, gap: 4 },
  tabItem:       { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: R.md },
  tabItemActive: { backgroundColor: C.accent },
  tabText:       { color: C.textMuted, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  postRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.border, gap: 12 },
  postTitle:     { color: C.text, fontSize: 14, fontWeight: '700' },
  postMeta:      { color: C.textFaint, fontSize: 11 },
  overlay:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 52, gap: 14 },
  sheetHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 8 },
  sheetTitle:    { color: C.text, fontSize: 18, fontWeight: '900' },
  editError:     { color: C.error, fontSize: 13 },
  editField:     { gap: 6 },
  editLabel:     { color: C.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  editInput:     { backgroundColor: C.surface2, borderRadius: R.lg, padding: 12, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border },
  saveBtn:       { backgroundColor: C.accent, borderRadius: R.xl, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText:   { color: '#fff', fontSize: 16, fontWeight: '900' },
});
