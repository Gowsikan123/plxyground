import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { safety } from '@/api/endpoints';
import type { BlockedAccount } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { Button, CenteredState, Loading, Screen, Title } from '@/components/ui';
import { colors, spacing, type } from '@/theme/tokens';

export default function Blocked() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['blocks'], queryFn: safety.blocks });
  const unblock = useMutation({
    mutationFn: (b: BlockedAccount) => safety.unblock(b.blocked_type, b.blocked_id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['blocks'] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <Title>Blocked accounts</Title>
      </View>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <CenteredState title="Couldn't load blocked accounts" message={query.error.message} action={{ label: 'Try again', onPress: () => void query.refetch() }} />
      ) : (
        <FlatList
          data={query.data}
          keyExtractor={(b) => `${b.blocked_type}-${b.blocked_id}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar url={item.avatar_url} name={item.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name ?? 'Deleted account'}</Text>
                <Text style={styles.kind}>{item.blocked_type === 'business' ? 'Brand' : 'Creator'}</Text>
              </View>
              <Button
                label="Unblock"
                variant="secondary"
                onPress={() => unblock.mutate(item)}
                loading={unblock.isPending && unblock.variables === item}
              />
            </View>
          )}
          ListEmptyComponent={
            <CenteredState
              title="No one is blocked"
              message="Blocked people can't message you, and you won't see their posts. Block someone from a conversation."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  name: { ...type.body, color: colors.text },
  kind: { ...type.caption, color: colors.textMuted },
});
