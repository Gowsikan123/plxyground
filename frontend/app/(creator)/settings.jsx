import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import BottomNav from '../../components/BottomNav';
import { C, R } from '../../components/theme';

function SettingRow({ icon, label, onPress, danger, right, subtitle }) {
  return (
    <TouchableOpacity
      style={[s.row, danger && s.dangerRow]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {icon ? (
        <View style={[s.rowIcon, danger && s.rowIconDanger]}>
          <Text style={s.rowIconText}>{icon}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && s.dangerLabel]}>{label}</Text>
        {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
      </View>
      {right !== null && (
        right ?? <Text style={s.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function Settings() {
  const logout = useAuthStore(s => s.logout);
  const user   = useAuthStore(s => s.user);
  const router = useRouter();

  return (
    <View style={s.page}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.accentBar} />
          <Text style={s.headerTitle}>SETTINGS</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── User card ── */}
        <View style={s.userCard}>
          <View style={s.userAvatarPlaceholder}>
            <Text style={s.userAvatarInitial}>
              {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{user?.display_name || user?.username || 'Creator'}</Text>
            <Text style={s.userHandle}>@{user?.username}</Text>
            {user?.sport ? <Text style={s.userSport}>{user.sport}</Text> : null}
          </View>
          <View style={s.planBadge}>
            <Text style={s.planText}>CREATOR</Text>
          </View>
        </View>

        {/* ── Account ── */}
        <Text style={s.groupLabel}>ACCOUNT</Text>
        <View style={s.group}>
          <SettingRow
            icon="✏️"
            label="Edit Profile"
            subtitle="Name, bio, sport, location"
            onPress={() => router.push('/(creator)/profile')}
          />
          <SettingRow
            icon="🔒"
            label="Change Password"
            subtitle="Update your login credentials"
            onPress={() => {}}
          />
          <SettingRow
            icon="🔔"
            label="Notifications"
            subtitle="Push, email preferences"
            onPress={() => {}}
          />
        </View>

        {/* ── Content ── */}
        <Text style={s.groupLabel}>CONTENT</Text>
        <View style={s.group}>
          <SettingRow
            icon="📝"
            label="My Posts"
            subtitle="View and manage your content"
            onPress={() => router.push('/(creator)/profile')}
          />
          <SettingRow
            icon="📂"
            label="Drafts"
            subtitle="Continue unfinished posts"
            onPress={() => {}}
          />
        </View>

        {/* ── Legal ── */}
        <Text style={s.groupLabel}>LEGAL</Text>
        <View style={s.group}>
          <SettingRow
            icon="📄"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingRow
            icon="🔐"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        {/* ── Session ── */}
        <Text style={s.groupLabel}>SESSION</Text>
        <View style={s.group}>
          <SettingRow
            icon="🚪"
            label="Sign Out"
            danger
            onPress={() => { logout(); router.replace('/'); }}
            right={null}
          />
        </View>

        {/* ── Version ── */}
        <Text style={s.versionText}>PLXYGROUND · v1.0.0</Text>

      </ScrollView>

      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: C.bg },

  // Header
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  backText:          { color: C.accent, fontSize: 16, fontWeight: '700', width: 60 },
  headerCenter:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accentBar:         { width: 3, height: 16, backgroundColor: C.accent, borderRadius: 2 },
  headerTitle:       { color: C.text, fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  scroll:            { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },

  // User card
  userCard:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.xl, padding: 16, borderWidth: 1, borderColor: C.border, gap: 14, marginBottom: 24 },
  userAvatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,107,0,0.3)' },
  userAvatarInitial: { color: C.accent, fontSize: 22, fontWeight: '900' },
  userName:          { color: C.text, fontSize: 16, fontWeight: '900' },
  userHandle:        { color: C.textMuted, fontSize: 12, marginTop: 1 },
  userSport:         { color: C.accent, fontSize: 11, fontWeight: '700', marginTop: 2 },
  planBadge:         { backgroundColor: C.accentDim, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,107,0,0.25)' },
  planText:          { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  // Groups
  groupLabel:        { color: C.textFaint, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  group:             { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 12 },

  // Rows
  row:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border, gap: 12 },
  rowIcon:           { width: 34, height: 34, borderRadius: R.md, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' },
  rowIconDanger:     { backgroundColor: 'rgba(239,68,68,0.10)' },
  rowIconText:       { fontSize: 16 },
  rowLabel:          { color: C.text, fontSize: 15, fontWeight: '600' },
  rowSub:            { color: C.textFaint, fontSize: 11, marginTop: 1 },
  chevron:           { color: C.textFaint, fontSize: 22, fontWeight: '300' },
  dangerRow:         { backgroundColor: 'rgba(239,68,68,0.04)' },
  dangerLabel:       { color: '#FF5555', fontWeight: '700' },

  versionText:       { color: C.textFaint, fontSize: 11, textAlign: 'center', marginTop: 16, letterSpacing: 1.5, fontWeight: '600' },
});
