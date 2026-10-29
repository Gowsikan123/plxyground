import { useQuery } from '@tanstack/react-query';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { content } from '@/api/endpoints';
import type { Post } from '@/api/types';
import { Card, CenteredState, Loading, Screen, Tag, Title } from '@/components/ui';
import { colors, spacing, type } from '@/theme/tokens';

export default function Feed() {
  const query = useQuery({ queryKey: ['feed'], queryFn: () => content.feed({ limit: 30 }) });

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Feed</Title>
      </View>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <CenteredState
          title="Couldn't load the feed"
          message={query.error.message}
          action={{ label: 'Try again', onPress: () => void query.refetch() }}
        />
      ) : (
        <FlatList
          data={query.data.posts}
          keyExtractor={(post) => String(post.id)}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <CenteredState title="No posts yet" message="Approved posts from creators will show up here." />
          }
        />
      )}
    </Screen>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Card accessibilityLabel={`${post.title} by ${post.display_name}`}>
      <Text style={styles.author}>{post.display_name}</Text>
      <Text style={styles.postTitle}>{post.title}</Text>
      {post.body ? <Text style={styles.postBody} numberOfLines={4}>{post.body}</Text> : null}
      {post.sport ? <View style={{ marginTop: spacing.sm }}><Tag label={post.sport} /></View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  list: { padding: spacing.lg, flexGrow: 1 },
  author: { ...type.caption, color: colors.textMuted, marginBottom: spacing.xs },
  postTitle: { ...type.heading, color: colors.text },
  postBody: { ...type.body, color: colors.text, marginTop: spacing.xs },
});
