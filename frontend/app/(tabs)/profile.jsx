import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, userType, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.noAuthText}>Sign in to view your profile</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/welcome')} style={{ minWidth: 160, marginTop: 16 }} />
      </View>
    );
  }

  const isBusiness = userType === 'business';
  const name = isBusiness ? user?.company_name : user?.display_name;
  const handle = isBusiness ? user?.email : `@${user?.username}`;

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar uri={user?.avatar_url} name={name || '?'} size={72} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {user?.is_verified && <Text style={styles.tick}> ✓</Text>}
          </View>
          <Text style={styles.handle}>{handle}</Text>
          <View style={styles.badges}>
            <Badge label={isBusiness ? 'Business' : 'Creator'} variant={isBusiness ? 'info' : 'primary'} />
            {!isBusiness && user?.sport && <Badge label={user.sport} variant="muted" />}
          </View>
        </View>
      </View>
      {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
      {!isBusiness && (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{user?.follower_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{user?.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{user?.post_count || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>
      )}
      <Button title="Logout" onPress={logout} variant="outline" style={styles.logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  info: { marginLeft: 16, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { color: Colors.text, fontSize: 20, fontFamily: 'Syne_700Bold' },
  tick: { color: Colors.verified, fontSize: 16 },
  handle: { color: Colors.textMuted, fontSize: 13, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  bio: { color: Colors.textMuted, fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20, marginBottom: 20 },
  stats: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 24, justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { color: Colors.text, fontSize: 20, fontFamily: 'Syne_700Bold' },
  statLabel: { color: Colors.textMuted, fontSize: 12, fontFamily: 'DMSans_400Regular', marginTop: 2 },
  noAuthText: { color: Colors.textMuted, fontSize: 16, fontFamily: 'DMSans_400Regular' },
  logout: { marginTop: 8 },
});
