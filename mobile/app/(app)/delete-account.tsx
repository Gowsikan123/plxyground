import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { safety } from '@/api/endpoints';
import { useAuth } from '@/auth/store';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme/tokens';

export default function DeleteAccount() {
  const role = useAuth((s) => s.session?.role);
  const logout = useAuth((s) => s.logout);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: () => safety.deleteAccount(password),
    // Signing out sends the app back to the welcome screen.
    onSuccess: () => void logout(),
    onError: (err) => setError(err.message),
  });

  const lost = role === 'business'
    ? ['Your brand profile and logo', 'Every opportunity you posted, and the applications to them', 'All your conversations']
    : ['Your profile and photo', 'Every post and photo you shared', 'Your applications', 'All your conversations'];

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          <Title>Delete account</Title>
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>This can't be undone</Text>
            <Body>Deleting your account permanently removes:</Body>
            {lost.map((item) => <Body key={item}>•  {item}</Body>)}
          </View>
          <TextField
            label="Enter your password to confirm"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            error={error ?? undefined}
          />
          <Button
            label="Permanently delete my account"
            onPress={() => {
              setError(null);
              remove.mutate();
            }}
            disabled={!password}
            loading={remove.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  warning: {
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger, padding: spacing.md, gap: spacing.xs,
  },
  warningTitle: { ...type.label, color: colors.danger },
});
