import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { opportunities } from '@/api/endpoints';
import type { Opportunity } from '@/api/types';
import { Card, CenteredState, Loading, Screen, Tag, TextField, Title } from '@/components/ui';
import { colors, spacing, type } from '@/theme/tokens';

export default function Opportunities() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const query = useQuery({
    queryKey: ['opportunities', deferredSearch],
    queryFn: () => opportunities.list({ search: deferredSearch, limit: 30 }),
  });

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
      </View>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <CenteredState
          title="Couldn't load opportunities"
          message={query.error.message}
          action={{ label: 'Try again', onPress: () => void query.refetch() }}
        />
      ) : (
        <FlatList
          data={query.data.opportunities}
          keyExtractor={(opp) => String(opp.id)}
          renderItem={({ item }) => <OpportunityCard opp={item} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <CenteredState
              title={deferredSearch ? 'No matches' : 'No opportunities yet'}
              message={deferredSearch ? 'Try a different search.' : 'New brand opportunities will appear here.'}
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
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
  poster: { ...type.caption, color: colors.textMuted, marginBottom: spacing.xs },
  title: { ...type.heading, color: colors.text },
  description: { ...type.body, color: colors.textMuted, marginTop: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.xs },
});
