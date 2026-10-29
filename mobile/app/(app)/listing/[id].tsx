import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { applications, opportunities } from '@/api/endpoints';
import type { Applicant } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { MessageButton } from '@/components/MessageButton';
import { Body, Button, Card, CenteredState, Loading, Screen, StatusTag, Title } from '@/components/ui';
import { colors, spacing, type } from '@/theme/tokens';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listingId = Number(id);
  const queryClient = useQueryClient();

  const listing = useQuery({ queryKey: ['opportunity', listingId], queryFn: () => opportunities.get(listingId) });
  const applicants = useQuery({
    queryKey: ['applicants', listingId],
    queryFn: () => applications.forOpportunity(listingId),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['applicants', listingId] });
    void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    void queryClient.invalidateQueries({ queryKey: ['opportunity', listingId] });
  };

  const decide = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: number; status: 'accepted' | 'rejected' }) =>
      applications.decide(applicationId, status),
    onSuccess: refresh,
  });

  const toggleOpen = useMutation({
    mutationFn: (status: 'published' | 'closed') => opportunities.setStatus(listingId, status),
    onSuccess: refresh,
  });

  if (listing.isPending) return <Screen><Loading /></Screen>;
  if (listing.isError) {
    return (
      <Screen>
        <CenteredState title="Listing not found" message={listing.error.message} action={{ label: 'Back', onPress: () => router.back() }} />
      </Screen>
    );
  }

  const opp = listing.data;
  const isOpen = opp.status === 'published';

  return (
    <Screen>
      <FlatList
        data={applicants.data ?? []}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
            <Title>{opp.title}</Title>
            <Body muted>{opp.description}</Body>
            <Button
              label={isOpen ? 'Close to new applications' : 'Reopen listing'}
              variant="secondary"
              loading={toggleOpen.isPending}
              onPress={() => toggleOpen.mutate(isOpen ? 'closed' : 'published')}
            />
            <Text style={styles.section}>Applicants</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApplicantCard
            applicant={item}
            busy={decide.isPending && decide.variables?.applicationId === item.id}
            onDecide={(status) => decide.mutate({ applicationId: item.id, status })}
          />
        )}
        ListEmptyComponent={
          applicants.isPending ? <Loading /> : (
            <Body muted>
              {applicants.isError ? applicants.error.message : 'No applications yet. They will appear here as creators apply.'}
            </Body>
          )
        }
      />
    </Screen>
  );
}

function ApplicantCard({ applicant, busy, onDecide }: {
  applicant: Applicant;
  busy: boolean;
  onDecide: (status: 'accepted' | 'rejected') => void;
}) {
  return (
    <Card>
      <View style={styles.row}>
        <Avatar url={applicant.avatar_url} name={applicant.display_name} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{applicant.display_name}</Text>
          <Text style={styles.handle}>@{applicant.username}</Text>
        </View>
        <StatusTag status={applicant.status} />
      </View>
      {applicant.message ? <View style={{ marginTop: spacing.sm }}><Body>{applicant.message}</Body></View> : null}
      {applicant.status === 'pending' ? (
        <View style={styles.actions}>
          <View style={{ flex: 1 }}><Button label="Accept" onPress={() => onDecide('accepted')} loading={busy} /></View>
          <View style={{ flex: 1 }}><Button label="Decline" variant="secondary" onPress={() => onDecide('rejected')} disabled={busy} /></View>
        </View>
      ) : null}
      <View style={{ marginTop: spacing.sm }}>
        <MessageButton recipientType="creator" recipientId={applicant.creator_id} name={applicant.display_name} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, flexGrow: 1 },
  section: { ...type.label, color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...type.heading, color: colors.text },
  handle: { ...type.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
