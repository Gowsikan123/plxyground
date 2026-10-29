import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { opportunities } from '@/api/endpoints';
import type { Opportunity } from '@/api/types';
import { SkeletonList } from '@/components/Skeleton';
import { Card, CenteredState, Screen, Tag, TextField, Title } from '@/components/ui';
import { flattenPages, nextOffset } from '@/lib/paging';
import { colors, minTouchSize, radius, spacing, type } from '@/theme/tokens';

const PAGE_SIZE = 20;
// Quick filters; the API matches the sport exactly, so these match the sport names creators use.
const SPORTS = ['Basketball', 'Football', 'Athletics', 'Tennis', 'Boxing', 'Cricket'];

export default function Opportunities() {
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim());
  const query = useInfiniteQuery({
    queryKey: ['opportunities', deferredSearch, sport],
    queryFn: ({ pageParam }) =>
      opportunities.list({ search: deferredSearch, sport: sport ?? undefined, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => nextOffset(last, last.opportunities.length),
  });
  const items = query.data ? flattenPages(query.data.pages.map((p) => p.opportunities)) : [];
  const filtered = Boolean(deferredSearch || sport);

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Opportunities</Title>
        <View style={{ height: spacing.md }} />
        <TextField
          label="Search"
          value={search}
          onChangeText={setSearch}
          placeholder="Title or description"
          autoCapitalize="none"
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[null, ...SPORTS].map((s) => {
            const selected = sport === s;
            return (
              <Pressable
                key={s ?? 'all'}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={s ? `Filter by ${s}` : 'All sports'}
                onPress={() => setSport(s)}
                style={[styles.chip, selected && styles.chipOn]}
              >
                <Text style={[styles.chipText, selected && { color: colors.accentText }]}>{s ?? 'All'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {query.isPending ? (
        <SkeletonList />
      ) : query.isError ? (
        <CenteredState
          title="Couldn't load opportunities"
          message={query.error.message}
          action={{ label: 'Try again', onPress: () => void query.refetch() }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(opp) => String(opp.id)}
          renderItem={({ item }) => <OpportunityCard opp={item} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ margin: spacing.lg }} /> : null}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <CenteredState
              title={filtered ? 'No matches' : 'No opportunities yet'}
              message={filtered ? 'Try a different search or sport.' : 'New brand opportunities will appear here.'}
            />
          }
        />
      )}
    </Screen>
  );
}

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <Card
      accessibilityLabel={`${opp.title} from ${opp.poster?.display_name ?? 'a brand'}`}
      onPress={() => router.push({ pathname: '/opportunity/[id]', params: { id: String(opp.id) } })}
    >
      <Text style={styles.poster}>{opp.poster?.display_name ?? 'PLXYGROUND'}</Text>
      <Text style={styles.title}>{opp.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{opp.description}</Text>
      <View style={styles.tags}>
        {opp.sport ? <Tag label={opp.sport} /> : null}
        {opp.budget ? <Tag label={opp.budget} /> : null}
        {opp.location ? <Tag label={opp.location} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  chips: { gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    minHeight: minTouchSize - 8, justifyContent: 'center', paddingHorizontal: spacing.md,
    borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...type.label, color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  poster: { ...type.caption, color: colors.textMuted, marginBottom: spacing.xs },
  title: { ...type.heading, color: colors.text },
  description: { ...type.body, color: colors.textMuted, marginTop: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.xs },
});
