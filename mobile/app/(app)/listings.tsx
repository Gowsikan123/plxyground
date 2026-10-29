import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { opportunities } from '@/api/endpoints';
import { Button, Card, CenteredState, Screen, Tag, Title } from '@/components/ui';
import { SkeletonList } from '@/components/Skeleton';
import { colors, spacing, type } from '@/theme/tokens';

export default function MyListings() {
  const query = useQuery({ queryKey: ['opportunities', 'mine'], queryFn: opportunities.mine });

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Your listings</Title>
        <View style={{ height: spacing.md }} />
        <Button label="Post an opportunity" onPress={() => router.push('/listing/new')} />
      </View>
      {query.isPending ? (
        <SkeletonList count={3} />
      ) : query.isError ? (
        <CenteredState
          title="Couldn't load your listings"
          message={query.error.message}
          action={{ label: 'Try again', onPress: () => void query.refetch() }}
        />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <Card
              accessibilityLabel={`${item.title}, ${item.application_count} applications`}
              onPress={() => router.push({ pathname: '/listing/[id]', params: { id: String(item.id) } })}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.counts}>
                {item.application_count} {item.application_count === 1 ? 'application' : 'applications'}
                {item.pending_count ? ` · ${item.pending_count} to review` : ''}
              </Text>
              <View style={styles.tags}>
                <Tag label={item.status === 'closed' ? 'Closed' : 'Open'} tone={item.status === 'closed' ? 'neutral' : 'good'} />
                {item.sport ? <Tag label={item.sport} /> : null}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <CenteredState title="No listings yet" message="Post an opportunity and creators can start applying." />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, flexGrow: 1 },
  title: { ...type.heading, color: colors.text },
  counts: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
});
