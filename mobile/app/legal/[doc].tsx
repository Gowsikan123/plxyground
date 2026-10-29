import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Body, Button, CenteredState, Screen, Title } from '@/components/ui';
import { legalDocs, type LegalDocKey } from '@/lib/legal';
import { colors, spacing, type } from '@/theme/tokens';

// Reachable signed in or out, so people can read it before signing up.
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = doc in legalDocs ? legalDocs[doc as LegalDocKey] : null;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!content) {
    return (
      <Screen>
        <CenteredState title="Page not found" action={{ label: 'Go back', onPress: back }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Back" variant="ghost" onPress={back} />
        <Title>{content.title}</Title>
        <Body muted>Last updated {content.updated}</Body>
        {content.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading} accessibilityRole="header">{section.heading}</Text>
            {section.paragraphs.map((p) => <Body key={p}>{p}</Body>)}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  section: { marginTop: spacing.lg, gap: spacing.sm },
  heading: { ...type.heading, color: colors.text },
});
