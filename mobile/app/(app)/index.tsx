import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { content } from '@/api/endpoints';
import type { Post } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Avatar } from '@/components/Avatar';
import { SkeletonList } from '@/components/Skeleton';
import { Button, Card, CenteredState, Screen, Tag, Title } from '@/components/ui';
import { openReport } from '@/lib/chat';
import { flattenPages, nextOffset } from '@/lib/paging';
import { timeAgo } from '@/lib/time';
import { colors, radius, spacing, type } from '@/theme/tokens';

const PAGE_SIZE = 20;

export default function Feed() {
  const query = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => content.feed({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => nextOffset(last, last.posts.length),
  });
  const posts = query.data ? flattenPages(query.data.pages.map((p) => p.posts)) : [];
  const isCreator = useAuth((s) => s.session?.role === 'creator');
  const myCreatorId = useAuth((s) => (s.session?.role === 'creator' ? s.session.user.creator_id : null));

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Feed</Title>
        {isCreator ? <Button label="New post" variant="secondary" onPress={() => router.push('/post/new')} /> : null}
      </View>
      {query.isPending ? (
        <SkeletonList withMedia />
      ) : query.isError ? (
        <CenteredState
          title="Couldn't load the feed"
          message={query.error.message}
          action={{ label: 'Try again', onPress: () => void query.refetch() }}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(post) => String(post.id)}
          renderItem={({ item }) => <PostCard post={item} canReport={item.creator_id !== myCreatorId} />}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ margin: spacing.lg }} /> : null}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <CenteredState title="No posts yet" message="Approved posts from creators will show up here." />
          }
        />
      )}
    </Screen>
  );
}

function PostCard({ post, canReport }: { post: Post; canReport: boolean }) {
  return (
    <Card accessibilityLabel={`${post.title} by ${post.display_name}`}>
      <View style={styles.authorRow}>
        <Avatar url={post.avatar_url} name={post.display_name} size={32} />
        <Text style={styles.author} numberOfLines={1}>{post.display_name}</Text>
        <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        {canReport ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Report post by ${post.display_name}`}
            onPress={() => openReport('content', post.id, post.title)}
            hitSlop={12}
            style={styles.more}
          >
            <Text style={styles.moreText}>Report</Text>
          </Pressable>
        ) : null}
      </View>
      {post.media_type === 'image' && post.media_url ? (
        <Image source={{ uri: post.media_url }} style={styles.media} contentFit="cover" transition={150} accessibilityLabel={post.title} />
      ) : null}
      <Text style={styles.postTitle}>{post.title}</Text>
      {post.body ? <Text style={styles.postBody} numberOfLines={4}>{post.body}</Text> : null}
      {post.sport ? <View style={{ marginTop: spacing.sm }}><Tag label={post.sport} /></View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  time: { ...type.caption, color: colors.textMuted },
  more: { minHeight: 32, justifyContent: 'center', paddingLeft: spacing.sm },
  moreText: { ...type.caption, color: colors.textMuted, textDecorationLine: 'underline' },
  media: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, marginBottom: spacing.sm, backgroundColor: colors.surfaceRaised },
  list: { padding: spacing.lg, flexGrow: 1 },
  author: { ...type.label, color: colors.text, flex: 1 },
  postTitle: { ...type.heading, color: colors.text },
  postBody: { ...type.body, color: colors.text, marginTop: spacing.xs },
});
