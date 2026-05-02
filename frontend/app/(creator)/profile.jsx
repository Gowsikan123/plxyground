import { View, Text, StyleSheet, ScrollView, Pressable, Image, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useFeed } from '../../hooks/useFeed';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import PostCard from '../../components/feed/PostCard';
import EmptyState from '../../components/ui/EmptyState';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { posts, loading } = useFeed({ creatorId: user?.id });

  if (!user) return null;

  const stats = [
    { label: 'Posts', value: user.post_count ?? posts.length },
    { label: 'Views', value: user.total_views ?? 0 },
    { label: 'Deals', value: user.deal_count ?? 0 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Cover */}
      <View style={styles.cover} />

      {/* Profile header */}
      <View style={styles.profileHeader}>
        <Avatar
          uri={user.avatar_url}
          name={user.display_name || user.username}
          size={80}
          style={styles.avatar}
        />
        <View style={styles.meta}>
          <Text style={styles.displayName}>{user.display_name || user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.sports_niche && (
            <Badge label={user.sports_niche} color={COLORS.primary} style={styles.nicheBadge} />
          )}
        </View>
      </View>

      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

      {/* Stats row */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statItem}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* My posts */}
      <Text style={styles.sectionTitle}>My Posts</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING[6] }} />
      ) : posts.length === 0 ? (
        <EmptyState icon="image-outline" title="No posts yet" message="Hit the + tab to publish your first post" />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { paddingBottom: SPACING[20] },
  cover: { height: 140, backgroundColor: COLORS.surface },
  profileHeader: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING[4], marginTop: -40, gap: SPACING[4] },
  avatar: { borderWidth: 3, borderColor: COLORS.background },
  meta: { flex: 1, paddingBottom: SPACING[1] },
  displayName: { ...TYPOGRAPHY.headingMd, color: COLORS.text },
  username: { ...TYPOGRAPHY.bodySm, color: COLORS.textMuted },
  nicheBadge: { marginTop: SPACING[1] },
  bio: { ...TYPOGRAPHY.bodyMd, color: COLORS.text, paddingHorizontal: SPACING[4], marginBottom: SPACING[4] },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginHorizontal: SPACING[4] },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING[3] },
  statValue: { ...TYPOGRAPHY.headingMd, color: COLORS.text },
  statLabel: { ...TYPOGRAPHY.labelSm, color: COLORS.textMuted },
  sectionTitle: { ...TYPOGRAPHY.headingMd, color: COLORS.text, padding: SPACING[4], paddingBottom: SPACING[2] },
  logoutBtn: { margin: SPACING[6], padding: SPACING[4], borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  logoutText: { ...TYPOGRAPHY.labelMd, color: COLORS.error },
});
