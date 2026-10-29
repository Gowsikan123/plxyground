import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { messages, notifications } from '@/api/endpoints';
import type { AppNotification, Thread } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Avatar } from '@/components/Avatar';
import { Button, CenteredState, Loading, Screen, Title } from '@/components/ui';
import { goToChat } from '@/lib/chat';
import { timeAgo } from '@/lib/time';
import { colors, minTouchSize, radius, spacing, type } from '@/theme/tokens';

type Section = 'messages' | 'notifications';

export default function Inbox() {
  const [section, setSection] = useState<Section>('messages');

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Inbox</Title>
        <View style={styles.segments} accessibilityRole="tablist">
          {(['messages', 'notifications'] as const).map((s) => (
            <Pressable
              key={s}
              accessibilityRole="tab"
              accessibilityState={{ selected: section === s }}
              onPress={() => setSection(s)}
              style={[styles.segment, section === s && styles.segmentOn]}
            >
              <Text style={[styles.segmentLabel, section === s && { color: colors.text }]}>
                {s === 'messages' ? 'Messages' : 'Notifications'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {section === 'messages' ? <Threads /> : <Notifications />}
    </Screen>
  );
}

function Threads() {
  const query = useQuery({ queryKey: ['threads'], queryFn: messages.threads, refetchInterval: 15_000 });
  if (query.isPending) return <Loading />;
  if (query.isError) {
    return <CenteredState title="Couldn't load messages" message={query.error.message} action={{ label: 'Try again', onPress: () => void query.refetch() }} />;
  }
  return (
    <FlatList
      data={query.data}
      keyExtractor={(t) => String(t.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}
      renderItem={({ item }) => <ThreadRow thread={item} />}
      ListEmptyComponent={
        <CenteredState
          title="No messages yet"
          message="Message a brand from an opportunity, or an applicant from your listing."
        />
      }
    />
  );
}

function ThreadRow({ thread }: { thread: Thread }) {
  const name = thread.other_name ?? 'Deleted account';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${name}${thread.unread_count ? `, ${thread.unread_count} unread` : ''}`}
      onPress={() => goToChat(thread.id, { type: thread.other_type, id: thread.other_id, name })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Avatar url={thread.other_avatar} name={name} size={48} />
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, thread.unread_count > 0 && styles.bold]} numberOfLines={1}>{name}</Text>
          <Text style={styles.rowTime}>{timeAgo(thread.last_message_at ?? thread.created_at)}</Text>
        </View>
        <Text style={[styles.rowPreview, thread.unread_count > 0 && { color: colors.text }]} numberOfLines={1}>
          {thread.last_message ?? 'No messages yet'}
        </Text>
      </View>
      {thread.unread_count > 0 ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

function Notifications() {
  const role = useAuth((s) => s.session?.role);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: notifications.list });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['unread'] });
  };
  const readAll = useMutation({ mutationFn: notifications.readAll, onSuccess: refresh });
  const markRead = useMutation({ mutationFn: notifications.markRead, onSuccess: refresh });

  function open(n: AppNotification) {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.reference_type === 'opportunity' && n.reference_id) {
      const isOwnListing = n.type === 'application_received';
      router.push(
        isOwnListing && role === 'business'
          ? { pathname: '/listing/[id]', params: { id: String(n.reference_id) } }
          : { pathname: '/opportunity/[id]', params: { id: String(n.reference_id) } },
      );
    }
  }

  if (query.isPending) return <Loading />;
  if (query.isError) {
    return <CenteredState title="Couldn't load notifications" message={query.error.message} action={{ label: 'Try again', onPress: () => void query.refetch() }} />;
  }
  const hasUnread = query.data.some((n) => !n.is_read);

  return (
    <FlatList
      data={query.data}
      keyExtractor={(n) => String(n.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} tintColor={colors.accent} />}
      ListHeaderComponent={hasUnread ? (
        <View style={{ marginBottom: spacing.md }}>
          <Button label="Mark all as read" variant="ghost" onPress={() => readAll.mutate()} loading={readAll.isPending} />
        </View>
      ) : null}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.is_read ? '' : 'Unread. '}${item.title}`}
          onPress={() => open(item)}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowName, !item.is_read && styles.bold]}>{item.title}</Text>
            {item.body ? <Text style={styles.rowPreview} numberOfLines={2}>{item.body}</Text> : null}
            <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
          </View>
          {!item.is_read ? <View style={styles.dot} /> : null}
        </Pressable>
      )}
      ListEmptyComponent={<CenteredState title="You're all caught up" message="Application updates and post approvals show up here." />}
    />
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },
  segments: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.xs },
  segment: { flex: 1, minHeight: minTouchSize - 8, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.surfaceRaised },
  segmentLabel: { ...type.label, color: colors.textMuted },
  list: { padding: spacing.lg, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rowName: { ...type.body, color: colors.text, flexShrink: 1 },
  bold: { fontWeight: '700' },
  rowPreview: { ...type.caption, color: colors.textMuted, marginTop: 2 },
  rowTime: { ...type.caption, color: colors.textMuted },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});
