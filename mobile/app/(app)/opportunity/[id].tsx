import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/api/client';
import { applications, opportunities } from '@/api/endpoints';
import { useAuth } from '@/auth/store';
import { Avatar } from '@/components/Avatar';
import { openReport } from '@/lib/chat';
import { MessageButton } from '@/components/MessageButton';
import { Body, Button, CenteredState, Loading, Screen, StatusTag, Tag, TextField, Title } from '@/components/ui';
import { colors, spacing, type } from '@/theme/tokens';

export default function OpportunityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const opportunityId = Number(id);
  const role = useAuth((s) => s.session?.role);
  const myBusinessId = useAuth((s) => (s.session?.role === 'business' ? s.session.user.id : null));
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const query = useQuery({
    queryKey: ['opportunity', opportunityId],
    queryFn: () => opportunities.get(opportunityId),
    enabled: Number.isFinite(opportunityId),
  });

  // Creators see where their existing application stands instead of the Apply form.
  const myApplications = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: applications.mine,
    enabled: role === 'creator',
  });
  const existing = myApplications.data?.find((a) => a.opportunity_id === opportunityId);

  const apply = useMutation({
    mutationFn: () => applications.apply(opportunityId, message.trim() || undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['opportunities', 'mine'] });
    },
  });

  if (query.isPending) return <Screen><Loading /></Screen>;
  if (query.isError) {
    return (
      <Screen>
        <CenteredState
          title="Opportunity not found"
          message={query.error.message}
          action={{ label: 'Back', onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  const opp = query.data;
  const applyError = apply.error instanceof ApiError ? apply.error.message : apply.error ? 'Could not apply.' : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <View style={styles.posterRow}>
          <Avatar url={opp.poster?.avatar_url} name={opp.poster?.display_name ?? 'PLXYGROUND'} size={32} />
          <Text style={styles.poster}>{opp.poster?.display_name ?? 'PLXYGROUND'}</Text>
        </View>
        <Title>{opp.title}</Title>
        <View style={styles.tags}>
          {opp.sport ? <Tag label={opp.sport} /> : null}
          {opp.budget ? <Tag label={opp.budget} /> : null}
          {opp.location ? <Tag label={opp.location} /> : null}
          {opp.deadline ? <Tag label={`Apply by ${opp.deadline.slice(0, 10)}`} /> : null}
        </View>
        <Body>{opp.description}</Body>
        {role === 'creator' && opp.posted_by_type === 'business' ? (
          <View style={{ marginTop: spacing.lg }}>
            <MessageButton
              recipientType="business"
              recipientId={opp.posted_by_id}
              name={opp.poster?.display_name ?? 'Brand'}
              label="Message the brand"
            />
          </View>
        ) : null}

        {role === 'creator' ? (
          <View style={styles.apply}>
            {existing ? (
              <View style={{ gap: spacing.sm }}>
                <Body>You applied on {new Date(existing.created_at).toLocaleDateString('en-GB')}.</Body>
                <StatusTag status={existing.status} />
              </View>
            ) : apply.isSuccess ? (
              <Body>Application sent. The brand will see it in their dashboard.</Body>
            ) : opp.status !== 'published' ? (
              <Body muted>This opportunity is closed to new applications.</Body>
            ) : (
              <>
                <TextField
                  label="Message to the brand (optional)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={2000}
                  style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: spacing.sm }}
                />
                {applyError ? <Body>{applyError}</Body> : null}
                <View style={{ height: spacing.md }} />
                <Button label="Apply" onPress={() => apply.mutate()} loading={apply.isPending} />
              </>
            )}
          </View>
        ) : null}
        {opp.posted_by_type === 'business' && opp.posted_by_id !== myBusinessId ? (
          <View style={{ marginTop: spacing.xl }}>
            <Button label="Report this opportunity" variant="ghost" onPress={() => openReport('opportunity', opp.id, opp.title)} />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  poster: { ...type.caption, color: colors.textMuted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  posterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  apply: { marginTop: spacing.xl, paddingTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border },
});
