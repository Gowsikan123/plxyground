import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.username}>@{user?.username || 'creator'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(creator)/settings')}>
          <Text style={styles.btnText}>⚙️ Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleLogout}>
          <Text style={styles.btnText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { alignItems: 'center', padding: 40 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  username: { color: '#fff', fontSize: 20, fontWeight: '700' },
  email: { color: '#888', fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: 24, gap: 12 },
  btn: { backgroundColor: '#111', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1e1e1e' },
  btnDanger: { borderColor: '#7f1d1d', backgroundColor: '#1a0a0a' },
  btnText: { color: '#fff', fontSize: 15 },
});
