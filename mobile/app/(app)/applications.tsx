import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { applications } from '@/api/endpoints';
import { Card, CenteredState, Screen, StatusTag, Tag, Title } from '@/components/ui';
import { SkeletonList } from '@/components/Skeleton';
import { colors, spacing, type } from '@/theme/tokens';

export default function MyApplications() {
  const query = useQuery({ queryKey: ['applications', 'mine'], queryFn: applications.mine });

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Applications</Title>
      </View>
      {query.isPending ? (
        <SkeletonList count={3} />
      ) : query.isError ? (
        <CenteredState
          title="Couldn't load your applications"
          message={query.error.message}
          action={{ label: 'Try again', onPress: () => void query.refetch() }}
        />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <Card
              accessibilityLabel={`${item.opp_title ?? 'Opportunity'}, ${item.status}`}
              onPress={() => router.push({ pathname: '/opportunity/[id]', params: { id: String(item.opportunity_id) } })}
            >
              <Text style={styles.title}>{item.opp_title ?? 'Opportunity'}</Text>
              <Text style={styles.date}>Applied {new Date(item.created_at).toLocaleDateString('en-GB')}</Text>
              <View style={styles.tags}>
                <StatusTag status={item.status} />
                {item.sport ? <Tag label={item.sport} /> : null}
                {item.budget ? <Tag label={item.budget} /> : null}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <CenteredState
              title="No applications yet"
              message="Find an opportunity you like and apply. Its status will show up here."
              action={{ label: 'Browse opportunities', onPress: () => router.navigate('/opportunities') }}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  list: { padding: spacing.lg, flexGrow: 1 },
  title: { ...type.heading, color: colors.text },
  date: { ...type.caption, color: colors.textMuted, marginTop: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
});
