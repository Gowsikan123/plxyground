import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { apiRequest } from '../components/ApiClient';
import { LinearGradient } from 'expo-linear-gradient';

export default function Settings() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [message, setMessage] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const handleLogout = async () => { await logout(); router.replace('/'); };

  const handleExport = async () => {
    setLoadingAction(true);
    try {
      const data = await apiRequest('/api/auth/me/export');
      setMessage(`Export ready: ${Object.keys(data).join(', ')}`);
    } catch (e) {
      setMessage('Export failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    setLoadingAction(true);
    try {
      await apiRequest('/api/auth/me', 'DELETE');
      setMessage('Account soft-deleted (suspended). Redirecting...');
      await logout();
      router.replace('/');
    } catch (e) {
      setMessage('Delete failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Settings</Text>

        {user && (
          <LinearGradient colors={['#0d1e38', '#0f1623']} style={styles.profileCard}>
            <LinearGradient colors={['#3b82f6', '#1d4ed8']} style={styles.avatar}>
              <Text style={styles.avatarText}>{user.name?.[0]?.toUpperCase() || '?'}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role === 'BUSINESS' ? '🏢 Business' : '⭐ Creator'}</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={() => router.push('/terms')} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>📄</Text>
              <Text style={styles.itemText}>Terms of Service</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.item} onPress={() => router.push('/privacy')} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🔒</Text>
              <Text style={styles.itemText}>Privacy Policy</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>💬</Text>
              <Text style={styles.itemText}>Help & Support</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.item} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>⭐</Text>
              <Text style={styles.itemText}>Rate the App</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={handleExport} disabled={loadingAction} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>📤</Text>
              <Text style={styles.itemText}>Export My Data</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.item} onPress={handleDelete} disabled={loadingAction} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🗑️</Text>
              <Text style={styles.itemText}>Delete My Account</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={[styles.item, styles.logoutItem]} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemIcon}>🚪</Text>
              <Text style={styles.logoutText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Text style={styles.version}>PLXYGROUND v1.0.0</Text>

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
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={[styles.navLabel, { color: '#3b82f6' }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080C14' },
  inner: { padding: 24, paddingBottom: 110 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 24, letterSpacing: -0.5 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 20, marginBottom: 32, gap: 16, borderWidth: 1, borderColor: '#1e3a5f' },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  profileInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  userEmail: { color: '#475569', fontSize: 13, marginTop: 3 },
  roleBadge: { backgroundColor: '#1e3a5f', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 8, alignSelf: 'flex-start' },
  roleText: { color: '#60a5fa', fontSize: 11, fontWeight: '700' },
  sectionLabel: { color: '#334155', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  group: { backgroundColor: '#0f1623', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#1a2035', overflow: 'hidden' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemIcon: { fontSize: 18 },
  itemText: { color: '#e2e8f0', fontSize: 15 },
  chevron: { color: '#334155', fontSize: 22 },
  divider: { height: 1, backgroundColor: '#1a2035', marginHorizontal: 16 },
  logoutItem: {},
  logoutText: { color: '#f87171', fontSize: 15, fontWeight: '600' },
  message: { color: '#60a5fa', fontSize: 13, textAlign: 'center', marginTop: 12, paddingHorizontal: 6 },
  version: { color: '#1e293b', fontSize: 12, textAlign: 'center', marginTop: 8 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0a0e1a', borderTopWidth: 1, borderTopColor: '#1a2035', paddingBottom: 24, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIcon: { fontSize: 22 },
  navLabel: { color: '#475569', fontSize: 10, fontWeight: '600' },
  navCreateBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navCreateIcon: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30 },
});
