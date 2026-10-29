import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/store';
import { Body, Button, Card, Screen, Tag, Title } from '@/components/ui';
import { colors, spacing, type } from '@/theme/tokens';

export default function Profile() {
  const session = useAuth((s) => s.session);
  const logout = useAuth((s) => s.logout);
  if (!session) return null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Profile</Title>
        <Card>
          {session.role === 'creator' ? (
            <>
              <Text style={styles.name}>{session.user.display_name}</Text>
              <Body muted>@{session.user.username}</Body>
              <View style={styles.tags}>
                <Tag label="Creator" />
                {session.user.sport ? <Tag label={session.user.sport} /> : null}
                {session.user.is_verified ? <Tag label="Verified" /> : null}
              </View>
              {session.user.bio ? <View style={{ marginTop: spacing.md }}><Body>{session.user.bio}</Body></View> : null}
            </>
          ) : (
            <>
              <Text style={styles.name}>{session.user.company_name}</Text>
              <Body muted>{session.user.email}</Body>
              <View style={styles.tags}>
                <Tag label="Brand" />
                {session.user.industry ? <Tag label={session.user.industry} /> : null}
              </View>
            </>
          )}
        </Card>
        <Button label="Log out" variant="secondary" onPress={() => void logout()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  name: { ...type.heading, color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
});
