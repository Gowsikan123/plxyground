import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { messages, safety } from '@/api/endpoints';
import type { Message, Role } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Button, CenteredState, Loading, Screen } from '@/components/ui';
import { openReport } from '@/lib/chat';
import { timeAgo } from '@/lib/time';
import { colors, minTouchSize, radius, spacing, type } from '@/theme/tokens';

// Polls every 4 seconds while open; real-time sockets are a later upgrade.
export default function Chat() {
  const { threadId, name, otherType, otherId } = useLocalSearchParams<{
    threadId: string; name?: string; otherType?: Role; otherId?: string;
  }>();
  const id = Number(threadId);
  const other = otherType && otherId ? { type: otherType, id: Number(otherId) } : null;
  const [menu, setMenu] = useState<'closed' | 'open' | 'confirmBlock'>('closed');
  const session = useAuth((s) => s.session);
  const myId = session?.role === 'creator' ? session.user.creator_id : session?.user.id;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const query = useQuery({
    queryKey: ['messages', id],
    queryFn: () => messages.list(id),
    refetchInterval: 4_000,
  });

  const send = useMutation({
    mutationFn: (body: string) => messages.send(id, body),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['messages', id] });
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });

  const block = useMutation({
    mutationFn: () => safety.block(other!.type, other!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['threads'] });
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void queryClient.invalidateQueries({ queryKey: ['blocks'] });
      router.back();
    },
  });

  const isMine = (m: Message) => m.sender_type === session?.role && m.sender_id === myId;
  const canSend = draft.trim().length > 0 && !send.isPending;

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">{name ?? 'Conversation'}</Text>
        {other ? (
          <Button label={menu === 'closed' ? 'More' : 'Close'} variant="ghost" onPress={() => setMenu(menu === 'closed' ? 'open' : 'closed')} />
        ) : null}
      </View>
      {other && menu === 'open' ? (
        <View style={styles.menu}>
          <View style={{ flex: 1 }}>
            <Button label="Report" variant="secondary" onPress={() => { setMenu('closed'); openReport(other.type, other.id, name); }} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Block" variant="secondary" onPress={() => setMenu('confirmBlock')} />
          </View>
        </View>
      ) : null}
      {other && menu === 'confirmBlock' ? (
        <View style={[styles.menu, { flexDirection: 'column' }]}>
          <Text style={styles.menuText}>
            Block {name ?? 'this account'}? Neither of you will be able to message the other, and you won't see their posts. You can unblock them from Profile.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}><Button label="Block" onPress={() => block.mutate()} loading={block.isPending} /></View>
            <View style={{ flex: 1 }}><Button label="Cancel" variant="secondary" onPress={() => setMenu('closed')} /></View>
          </View>
          {block.error ? <Text style={styles.error}>{block.error.message}</Text> : null}
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <CenteredState title="Couldn't load this conversation" message={query.error.message} />
        ) : (
          <FlatList
            data={[...query.data].reverse()}
            inverted
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                // Long-press someone else's message to report it.
                onLongPress={isMine(item) ? undefined : () => openReport('message', item.id, name)}
                accessibilityHint={isMine(item) ? undefined : 'Long press to report this message'}
                style={[styles.bubble, isMine(item) ? styles.mine : styles.theirs]}
              >
                <Text style={[styles.body, isMine(item) && { color: colors.accentText }]}>{item.body}</Text>
                <Text style={[styles.time, isMine(item) && { color: colors.accentText }]}>{timeAgo(item.created_at)}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<CenteredState title="Say hello" message="Messages you send appear here." />}
          />
        )}
        {send.error ? <Text style={styles.error}>{send.error.message}</Text> : null}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Message"
            multiline
            maxLength={4000}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => send.mutate(draft.trim())}
            style={[styles.send, !canSend && { opacity: 0.4 }]}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { ...type.heading, color: colors.text, flex: 1 },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.accent },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surfaceRaised },
  body: { ...type.body, color: colors.text },
  time: { ...type.caption, color: colors.textMuted, marginTop: 2, opacity: 0.8 },
  menu: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  menuText: { ...type.body, color: colors.text, marginBottom: spacing.sm },
  error: { ...type.caption, color: colors.danger, paddingHorizontal: spacing.lg },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: minTouchSize,
    maxHeight: 140,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    ...type.body,
  },
  send: { minHeight: minTouchSize, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.accent, justifyContent: 'center' },
  sendLabel: { ...type.label, color: colors.accentText },
});
