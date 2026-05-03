import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import BottomNav from '../../components/BottomNav';
import { C, R } from '../../components/theme';

export default function Settings() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const Row = ({ label, onPress, danger, right }) => (
    <TouchableOpacity style={[s.row, danger && s.dangerRow]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.rowLabel, danger && s.dangerLabel]}>{label}</Text>
      {right ?? <Text style={s.chevron}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.groupLabel}>Account</Text>
        <View style={s.group}>
          <Row label="Edit Profile"       onPress={() => {}} />
          <Row label="Change Password"    onPress={() => {}} />
          <Row label="Notifications"      onPress={() => {}} />
        </View>

        <Text style={s.groupLabel}>Content</Text>
        <View style={s.group}>
          <Row label="My Posts"           onPress={() => {}} />
          <Row label="Drafts"             onPress={() => {}} />
        </View>

        <Text style={s.groupLabel}>Legal</Text>
        <View style={s.group}>
          <Row label="Terms of Service"   onPress={() => router.push('/terms')} />
          <Row label="Privacy Policy"     onPress={() => router.push('/privacy')} />
        </View>

        <Text style={s.groupLabel}>Session</Text>
        <View style={s.group}>
          <Row
            label="Sign Out"
            danger
            onPress={() => { logout(); router.replace('/'); }}
            right={null}
          />
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  back:        { color: C.accent, fontSize: 16, fontWeight: '600' },
  title:       { color: C.text, fontSize: 17, fontWeight: '800' },
  scroll:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },
  groupLabel:  { color: C.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 20 },
  group:       { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: C.border },
  rowLabel:    { color: C.text, fontSize: 15 },
  chevron:     { color: C.textFaint, fontSize: 20 },
  dangerRow:   { backgroundColor: 'rgba(255,60,60,0.05)' },
  dangerLabel: { color: '#FF6060' },
});
