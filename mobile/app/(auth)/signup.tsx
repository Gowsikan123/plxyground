import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/client';
import type { Role } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Agreement } from '@/components/Agreement';
import { RolePicker } from '@/components/RolePicker';
import { Body, Button, Screen, TextField, Title } from '@/components/ui';
import { businessSignupSchema, creatorSignupSchema, fieldErrors } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

export default function Signup() {
  const params = useLocalSearchParams<{ role?: Role }>();
  const [role, setRole] = useState<Role>(params.role === 'business' ? 'business' : 'creator');
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    companyName: '',
    industry: '',
    sport: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const signupCreator = useAuth((s) => s.signupCreator);
  const signupBusiness = useAuth((s) => s.signupBusiness);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setErrors({});
    if (!agreed) return setErrors({ agreement: 'Tick the box to continue.' });
    setSubmitting(true);
    try {
      if (role === 'creator') {
        const parsed = creatorSignupSchema.safeParse({
          displayName: form.displayName,
          username: form.username,
          email: form.email,
          password: form.password,
          sport: form.sport || undefined,
        });
        if (!parsed.success) return setErrors(fieldErrors(parsed.error));
        await signupCreator(parsed.data);
      } else {
        const parsed = businessSignupSchema.safeParse({
          companyName: form.companyName,
          email: form.email,
          password: form.password,
          industry: form.industry || undefined,
        });
        if (!parsed.success) return setErrors(fieldErrors(parsed.error));
        await signupBusiness(parsed.data);
      }
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
          <Title>Create your account</Title>
          <View style={{ height: spacing.xl }} />
          <RolePicker value={role} onChange={setRole} />

          {role === 'creator' ? (
            <>
              <TextField label="Your name" value={form.displayName} onChangeText={set('displayName')} autoComplete="name" error={errors.displayName} />
              <TextField label="Username" value={form.username} onChangeText={set('username')} autoCapitalize="none" autoComplete="username-new" error={errors.username} />
              <TextField label="Main sport (optional)" value={form.sport} onChangeText={set('sport')} error={errors.sport} />
            </>
          ) : (
            <>
              <TextField label="Company name" value={form.companyName} onChangeText={set('companyName')} autoComplete="organization" error={errors.companyName} />
              <TextField label="Industry (optional)" value={form.industry} onChangeText={set('industry')} error={errors.industry} />
            </>
          )}

          <TextField
            label="Email"
            value={form.email}
            onChangeText={set('email')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={errors.email}
          />
          <TextField
            label="Password"
            value={form.password}
            onChangeText={set('password')}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
          />
          <Body muted>At least 8 characters, with an uppercase letter and a number.</Body>
          {errors.form ? <><View style={{ height: spacing.md }} /><Body>{errors.form}</Body></> : null}

          <View style={{ height: spacing.lg }} />
          <Agreement checked={agreed} onChange={setAgreed} error={errors.agreement} />
          <View style={{ height: spacing.lg }} />
          <Button label="Create account" onPress={submit} loading={submitting} />
          <Button label="I already have an account" variant="ghost" onPress={() => router.replace({ pathname: '/login', params: { role } })} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl },
});
