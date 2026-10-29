import { router } from 'expo-router';
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
              {session.user.bio ? <View style={{ marginTop: spacing.md }}><Body>{session.user.bio}</Body></View> : null}
            </>
          )}
        </Card>
        <Button label="Edit profile" onPress={() => router.push('/edit-profile')} />
        <Button label="Log out" variant="secondary" onPress={() => void logout()} />

        <Text style={styles.section}>Privacy and safety</Text>
        <View style={styles.links}>
          <Button label="Blocked accounts" variant="ghost" onPress={() => router.push('/blocked')} />
          <Button label="Terms of use" variant="ghost" onPress={() => router.push('/legal/terms')} />
          <Button label="Privacy notice" variant="ghost" onPress={() => router.push('/legal/privacy')} />
          <Button label="Delete account" variant="ghost" onPress={() => router.push('/delete-account')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  name: { ...type.heading, color: colors.text },
  section: { ...type.label, color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.md },
  links: { gap: spacing.xs, alignItems: 'flex-start' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
});
