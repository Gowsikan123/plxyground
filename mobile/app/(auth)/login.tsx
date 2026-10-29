import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import type { Role } from '@/api/types';
import { useAuth } from '@/auth/store';
import { RolePicker } from '@/components/RolePicker';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { fieldErrors, loginSchema } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

export default function Login() {
  const params = useLocalSearchParams<{ role?: Role }>();
  const [role, setRole] = useState<Role>(params.role === 'business' ? 'business' : 'creator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const login = useAuth((s) => s.login);

  async function submit() {
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    try {
      await login(role, parsed.data.email, parsed.data.password);
      // The root layout switches to the signed-in stack automatically.
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Something went wrong. Try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Title>Welcome back</Title>
          <View style={{ height: spacing.xl }} />
          <RolePicker value={role} onChange={setRole} />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={errors.email}
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            error={errors.password}
            onSubmitEditing={submit}
          />
          {errors.form ? <Body>{errors.form}</Body> : null}
          <View style={{ height: spacing.lg }} />
          <Button label="Log in" onPress={submit} loading={submitting} />
          <Button
            label="New here? Create an account"
            variant="ghost"
            onPress={() => router.replace({ pathname: '/signup', params: { role } })}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl },
});
